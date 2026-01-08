module "database_migration_service" {
  source  = "terraform-aws-modules/dms/aws"
  version = "2.6.0"

  # Subnet group
  repl_subnet_group_name        = "private-subnets"
  repl_subnet_group_description = "DMS Subnet group"
  repl_subnet_group_subnet_ids  = data.aws_subnets.private_subnets.ids

  # Instance
  repl_instance_allocated_storage           = 64
  repl_instance_auto_minor_version_upgrade  = true
  repl_instance_allow_major_version_upgrade = true
  repl_instance_apply_immediately           = true
  repl_instance_engine_version              = "3.6.1"
  repl_instance_multi_az                    = false
  repl_instance_publicly_accessible         = false
  repl_instance_class                       = "dms.t3.medium"
  repl_instance_id                          = "dms-migration-etothddb"
  repl_instance_kms_key_arn                 = data.aws_kms_key.swa_kms_key.arn
  repl_instance_vpc_security_group_ids      = [aws_security_group.dms_security_group.id]

  # Endpoints
  endpoints = {
    source = {
      database_name               = local.tecc_db_secrets.TECC_DB_NAME
      endpoint_id                 = var.source_endpoint_id
      endpoint_type               = "source"
      engine_name                 = "sqlserver"
      extra_connection_attributes = "heartbeatFrequency=1;"
      kms_key_arn                 = data.aws_kms_key.swa_kms_key.arn
      username                    = local.tecc_db_secrets.TECC_DB_USER
      password                    = local.tecc_db_secrets.TECC_DB_PASS
      port                        = 1433
      server_name                 = local.tecc_db_secrets.TECC_DB_ENDPOINT
      ssl_mode                    = "none"
      tags                        = { EndpointType = "source" }
    }

    destination = {
      database_name = local.thd_db_secrets.DB_NAME
      endpoint_id   = var.dest_endpoint_id
      endpoint_type = "target"
      engine_name   = "sqlserver"
      kms_key_arn   = data.aws_kms_key.swa_kms_key.arn
      username      = local.thd_db_secrets.DB_USER
      password      = local.thd_db_secrets.DB_PASS
      port          = 1433
      server_name   = local.thd_db_secrets.DB_ENDPOINT
      ssl_mode      = "none"
      tags          = { EndpointType = "destination" }
    }
  }

  replication_tasks = {
    full_load = {
      replication_task_id       = "etothd-dms-full-load"
      migration_type            = "full-load"
      replication_task_settings = file("task_settings.json")
      table_mappings            = file("table_mappings.json")
      source_endpoint_key       = "source"
      target_endpoint_key       = "destination"
      tags                      = { Task = "THD-on-prem-to-aws" }
    }
  }

  tags = {
    Terraform   = "true"
    Environment = "dev"
  }
}

# Retrieve VPC ID from the AWS account
data "aws_vpc" "vpc_id" {
  filter {
    name   = "tag:Name"
    values = [var.vpc_tag_name]
  }
}

data "aws_subnets" "private_subnets" {
  filter {
    name   = "tag:SubnetType"
    values = ["private"]
  }
}

resource "aws_security_group" "dms_security_group" {
  name        = "dms_security_group"
  description = "Allow private traffic to on-prem network"
  vpc_id      = data.aws_vpc.vpc_id.id

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    description = "Allow outbound connections on port 443 from the private subnets"
    cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  }

  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    description = "Allow outbound connections on port 80 from the private subnets"
    cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  }

  egress {
    from_port   = 1433
    to_port     = 1433
    protocol    = "tcp"
    description = "Allow outbound SQL Server connections from the private subnets"
    cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    description = "Allow inbound connections on port 443 from the private subnets"
    cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    description = "Allow inbound connections on port 80 from the private subnets"
    cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  }

  ingress {
    from_port   = 1433
    to_port     = 1433
    protocol    = "tcp"
    description = "Allow inbound SQL Server connections from the private subnets"
    cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  }

  tags = {
    Name = "dms_security_group"
  }
}

data "aws_caller_identity" "current" {} # returns current account

# Get a SWA KMS key for encrypting the DMS connections
data "aws_kms_key" "swa_kms_key" {
  key_id = "alias/swa_${local.account_id}_kms"
}

locals {
  account_id = data.aws_caller_identity.current.account_id
}

# Fetch secrets from AWS Secrets Manager
data "aws_secretsmanager_secret" "thd_db" {
  name = var.cloud_db_secret
}

data "aws_secretsmanager_secret_version" "thd_db" {
  secret_id = data.aws_secretsmanager_secret.thd_db.id
}

data "aws_secretsmanager_secret" "tecc_db" {
  name = var.on_prem_db_secret
}

data "aws_secretsmanager_secret_version" "tecc_db" {
  secret_id = data.aws_secretsmanager_secret.tecc_db.id
}

locals {
  thd_db_secrets  = jsondecode(data.aws_secretsmanager_secret_version.thd_db.secret_string)
  tecc_db_secrets = jsondecode(data.aws_secretsmanager_secret_version.tecc_db.secret_string)
}
