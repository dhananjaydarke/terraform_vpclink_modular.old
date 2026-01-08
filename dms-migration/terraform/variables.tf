variable "region" {
  type        = string
  default     = "auto"
  description = "The region to deploy the resources. This will be set automatically"
}

variable "vpc_tag_name" {
  type        = string
  description = "Name Tag to identify the VPC"
}

# endpoint variables
variable "source_endpoint_id" {
  type        = string
  description = "Source endpoint ID"
}

variable "dest_endpoint_id" {
  type        = string
  description = "Destination endpoint ID"
}

variable "on_prem_db_secret" {
  type        = string
  description = "On Prem DB secret"
}

variable "cloud_db_secret" {
  type        = string
  description = "AWS DB secret"
}
