variable "domain_validation_options" {
  description = "List of domain validation options from ACM"
  type = list(object({
    domain_name           = string
    resource_record_name  = string
    resource_record_value = string
    resource_record_type  = string
  }))
}

variable "zone_id" {
  description = "The Route 53 zone ID where the DNS records will be created for validation"
  type        = string
}

variable "domain_name" {
  description = "The Domain name for the hosted zone name"
  type        = string
}

variable "certificate_arn" {
  description = "The certificate ARN for the domain"
  type        = string
}

variable "san_names" {
  description = "List of SAN's for the domain"
  type        = list(string)
}
