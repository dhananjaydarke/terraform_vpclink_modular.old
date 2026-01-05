variable "region" {
  type        = string
  default     = "auto"
  description = "The region to deploy the resources. This will be set automatically"
}

variable "public_hosted_zones" {
  description = "List of public hosted zones to be created"
  type = list(object({
    name        = string
    create_cert = bool
    san_names   = optional(list(string))
    Alarms = object({
      AssignmentGroup = string
      Application     = string
    })
    tags = list(object({
      Key   = string
      Value = string
    }))
  }))
}

variable "delegation_set_name" {
  type        = string
  default     = "delegation_set_name"
  description = "Delegation Set name"
}
variable "name_prefix" {
  type        = string
  description = "name prefix to be added to all the resources to uniquely identify within namespace"
}
