variable "region" {
  type        = string
  default     = "auto"
  description = "The region to deploy the resources. This will be set automatically"
}

variable "domain" {
  type        = string
  default     = "technologyhealth.swacorp.com"
  description = "The THD domain name"
}
# variable "certificate_arn_tf_state_key" {
#   type        = string
#   description = "the Terraform state key for the certificate ARN"
# }
