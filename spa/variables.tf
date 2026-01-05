variable "region" {
  type        = string
  default     = "us-east-1"
  description = "The region to deploy the resources. This will be set automatically"
}

variable "cloudfront_origin_bucket_name" {
  type        = string
  description = "the name of the s3 bucket that will be created to be used a cloudfront origin"
}

variable "certificate_arn_tf_state_key" {
  type        = string
  description = "the Terraform state key for the certificate ARN"
}

variable "vpc_tf_state_key" {
  type        = string
  description = "the Terraform state key for the VPC"
}

# variable "acm_certificate_arn" {
#   type        = string
#   description = "the arn of the viewer certificate for using a custom r53 domain to access cloudfront"
# }

variable "project_dir" {
  type        = string
  description = "the project directory path for static assets, defaults to current working directory if not specified"
  default     = null
}

variable "static_asset_deployments" {
  type = list(object({
    name        = string
    bucket_name = string
    source_path = optional(string)
    site_path   = optional(string)
  }))
  description = "list of configuration parameters for deployment of static asset files to s3 buckets using terraform"
}

# Add VPC origin variables
# variable "vpc_origin_domain_name" {
#   type        = string
#   description = "Domain name for the VPC origin (e.g., internal ALB domain)"
# }

variable "apigateway_prefix" {
  type        = string
  default     = "thd-private-api"
  description = "The API Gateway DNS prefix name"
}

variable "vpc_origin_name" {
  type        = string
  description = "Name for the VPC origin endpoint (alphanumeric, dashes, underscores only)"
}

variable "vpc_origin_domain_name_cf" { # FIXME uncomment
  type        = string
  description = "Domain name format for CloudFront origin (must be valid domain format)"
}

variable "public_hosted_zone_tf_state_key" {
  type        = string
  description = "the Terraform state key for the hosted zone"
}
