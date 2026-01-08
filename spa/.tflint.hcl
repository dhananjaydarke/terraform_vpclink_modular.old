# Configuration file for TFLint
# TFLint is a Terraform linter focused on possible errors, best practices, etc.

# Configure TFLint
config {
  call_module_type = "local"
  force = false
  disabled_by_default = false
  # Exclude examples directory from linting
  # exclude_paths = ["examples/**"]
}

# Enable the built-in Terraform plugin
# This plugin provides general Terraform language rules
plugin "terraform" {
  enabled = true
  preset = "recommended"
}

# Enable the AWS plugin for TFLint
# This plugin provides AWS-specific rules
plugin "aws" {
  enabled = true
  version = "0.42.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

# This configuration enables comprehensive linting for your Terraform code,
# including both general Terraform best practices and AWS-specific rules.
# It helps catch potential errors and enforce coding standards in your
# infrastructure-as-code.

# terraform_required_version is incorrectly flagging as not provided
rule "terraform_required_version" {
  enabled = false
}
