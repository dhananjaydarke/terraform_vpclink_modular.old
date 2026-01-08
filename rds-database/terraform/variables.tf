variable "region" {
  type        = string
  default     = "auto"
  description = "The region to deploy the resources. This will be set automatically"
}

# variable "db_parameter_group" {
#   type        = string
#   description = "The DB parameter group family name. The value depends on DB engine used. See [DBParameterGroupFamily](https://docs.aws.amazon.com/AmazonRDS/latest/APIReference/API_CreateDBParameterGroup.html#API_CreateDBParameterGroup_RequestParameters) for instructions on how to retrieve applicable value."
#   default     = "sqlserver-ex-16.0"
# }

# variable "instance_class" {
#   type        = string
#   description = "Class of RDS instance"
#   default     = "db.t3.micro"
#   # https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.html
# }

# variable "database_port" {
#   type        = number
#   description = "The port on which the DB accepts connections"
#   default     = "1433"
# }

# variable "database_user" {
#   type        = string
#   description = "The name of the database user"
#   default     = "teccdbadm"
# }

# variable "allocated_storage" {
#   type        = number
#   description = "Number of GB allocated for DB storage"
#   default     = 50
# }

# variable "engine" {
#   type        = string
#   description = "Database engine type. Required unless a `snapshot_identifier` or `replicate_source_db` is provided."
#   default     = "sqlserver-ex"
#   # http://docs.aws.amazon.com/cli/latest/reference/rds/create-db-instance.html
# }

# variable "engine_version" {
#   type        = string
#   description = "Database engine version, depends on engine type."
#   default     = "16.00.4215.2.v1"
#   # http://docs.aws.amazon.com/cli/latest/reference/rds/create-db-instance.html
# }

variable "vpc_tag_name" {
  type        = string
  description = "Name Tag to identify the VPC"
}

variable "stage" {
  type        = string
  description = "Stage: dev, qa, prod"
}

variable "allowed_cidr_blocks" {
  type        = list(string)
  default     = []
  description = "The whitelisted CIDRs which to allow `ingress` traffic to the DB instance"
}


variable "deletion_protection" {
  type        = bool
  description = "Enable deletion protection for the RDS instance"
  default     = false
}

variable "database_name" {
  type        = string
  description = "The name of the database"
  default     = null
}


# variable "db_sg_name" {
#   type        = string
#   description = "Name for the database security group"
#   default     = "SG_Name"
# }
