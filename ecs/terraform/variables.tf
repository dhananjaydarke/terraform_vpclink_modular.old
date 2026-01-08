variable "region" {
  type        = string
  description = "The region to deploy the resources. Only required to initialize the aws provider. This will be set automatically"
}


variable "container_insights_enabled" {
  type        = string
  description = "Determines whether container insights are enabled."
  default     = "enabled"

  validation {
    condition     = contains(["enabled", "disabled"], var.container_insights_enabled)
    error_message = "The container_insights_enabled value must be either 'enabled' or 'disabled'."
  }
}

# Variable to enable sleep/wake process
variable "sleep_wake_enabled" {
  type        = bool
  default     = false
  description = "Along with var.environment, determines whether to enable the sleep/wake process."
}

variable "sleep_schedule" {
  type        = string
  default     = "cron(0 2 ? * TUE-SAT *)"
  description = "The sleep schedule. This is only used if sleep_wake_enabled is set to true."
}

variable "wake_schedule" {
  type        = string
  default     = "cron(0 12 ? * MON-FRI *)"
  description = "The wake schedule. This is only used if sleep_wake_enabled is set to true."
}

variable "container_cpu" {
  type        = number
  default     = 256
  description = "The amount of CPU (in CPU units) to reserve for the container."
}

variable "container_memory" {
  type        = number
  default     = 512
  description = "The amount of memory (in MiB) to allow the container to use."
}


variable "alb_deletion_protection_enabled" {
  description = "Protect the ALB from deletion"
  type        = bool
  default     = false
}

variable "cluster_log_retention" {
  type        = number
  default     = 365
  description = "The Cloudwatch Log retention set on the ECS Cluster."
}

variable "autoscaling_min_capacity" {
  description = "The minimum number of ECS tasks to create."
  type        = number
  default     = 1
}
variable "autoscaling_max_capacity" {
  description = "The maximum number of ECS tasks to create."
  type        = number
  default     = 2
}

variable "vpc_tag_name" {
  type        = string
  description = "Name Tag to identify the VPC"
}

variable "certificate_domain" {
  description = "Domain name for ACM certificate lookup"
  type        = string
}

variable "container_image" {
  type        = string
  description = "The container image to use for the ECS service"
}

variable "thd_secret_name" {
  type        = string
  description = "The name of the secret in Secrets Manager"
  default     = "thd-db/dev"
}

variable "dash_secret_name" {
  type        = string
  description = "The name of the secret in Secrets Manager"
  default     = "dash-db/dev"
}

variable "backend_secret_name" {
  type        = string
  description = "The name of the secret in Secrets Manager"
  default     = "thd-backend/dev"
}

variable "task_memory" {
  type        = number
  description = "The amount of memory (in MiB) to allocate to the ECS task"
  default     = 3800
}

variable "task_cpu" {
  type        = number
  description = "The amount of CPU allocated to the ECS task"
  default     = 1024
}

variable "private_zone_name" {
  description = "Name of the existing private Route 53 hosted zone"
  type        = string
  default     = "dev.technologyhealth.swacorp.com"
}
