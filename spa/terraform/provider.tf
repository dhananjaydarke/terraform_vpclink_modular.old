provider "aws" {
  region = var.region

  # adds these common tags to all supported resources
  default_tags {
    tags = module.root_labels.tags
  }
}
