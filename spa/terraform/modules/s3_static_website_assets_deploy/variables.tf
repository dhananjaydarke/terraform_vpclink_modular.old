variable "bucket_name" {
  type        = string
  description = "the name of the bucket to place the static website assets in"
}

variable "source_path" {
  type        = string
  description = "the source file of the static asset"
}

variable "site_path" {
  type        = string
  description = "the path where the site needs to be deployed"
}
