module "vpc_label" {
  # use latest version
  version = "0.6.1"

  context = module.root_labels.context
}

## TODO: Add Variable for auto Minor Upgrade
module "rds" {
  source  = "cloudposse/rds/aws"
  version = "1.1.2"

  context     = module.root_labels.context
  kms_key_arn = data.aws_kms_key.swa_kms_key.arn

  stage                        = var.stage
  name                         = "ETOTHD"
  database_name                = var.database_name
  database_user                = var.database_user
  database_password            = random_password.db_password.result
  database_port                = var.database_port
  allocated_storage            = var.allocated_storage
  engine                       = var.engine
  engine_version               = var.engine_version
  instance_class               = var.instance_class
  db_parameter_group           = var.db_parameter_group
  backup_retention_period      = var.backup_retention_period
  associate_security_group_ids = [aws_security_group.default.id]
  vpc_id                       = data.aws_vpc.vpc_id.id
  subnet_ids                   = data.aws_subnets.subnets.ids

  apply_immediately   = true
  deletion_protection = var.deletion_protection
}


# Retrieve VPC ID from the AWS account
data "aws_vpc" "vpc_id" {
  filter {
    name   = "tag:Name"
    values = [var.vpc_tag_name]
  }
}

data "aws_subnets" "subnets" {
  filter {
    name   = "tag:SubnetType"
    values = ["private"]
  }
}

data "aws_caller_identity" "current" {} # returns current account

data "aws_kms_key" "swa_kms_key" {
  key_id = "alias/swa_${local.account_id}_kms"
}

locals {
  account_id = data.aws_caller_identity.current.account_id
}

resource "random_password" "db_password" {
  length           = 16
  override_special = "!#$%&*()-_=+[]{}<>:?"
  depends_on       = [aws_secretsmanager_secret.thd_db]
}

# Store all secrets that are TECC DB related
resource "aws_secretsmanager_secret" "thd_db" {
  name = "thd-db/${var.stage}"
}
resource "aws_secretsmanager_secret_version" "thd_db" {
  secret_id = aws_secretsmanager_secret.thd_db.id
  secret_string = jsonencode({
    DB_ENDPOINT = module.rds.instance_address
    DB_USER     = var.database_user
    DB_PASS     = random_password.db_password.result
    DB_NAME     = var.database_name
    DB_PORT     = tostring(var.database_port)
  })
}

# Store all secrets that are non TECC DB related
resource "aws_secretsmanager_secret" "thd_backend" {
  name = "thd-backend/${var.stage}"
}

## Added to get past a security scan
resource "aws_security_group" "default" {

  name        = var.db_sg_name
  description = "Allow inbound traffic from the security groups"
  vpc_id      = data.aws_vpc.vpc_id.id
  tags        = module.root_labels.tags
}
resource "aws_security_group_rule" "ingress_cidr_blocks" {

  description       = "Allow inbound traffic from CIDR blocks"
  type              = "ingress"
  from_port         = var.database_port
  to_port           = var.database_port
  protocol          = "tcp"
  cidr_blocks       = var.allowed_cidr_blocks
  security_group_id = aws_security_group.default.id
}

resource "aws_security_group_rule" "egress" {
  description       = "Allow all egress traffic"
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = var.allowed_cidr_blocks
  security_group_id = aws_security_group.default.id
}
