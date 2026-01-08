# Data lookups are for resources that should already exist in the AWS account.
# These resources are typically either deployed through the DDE Account Baseline
# or through another stack.

data "aws_caller_identity" "current" {}

# data "aws_ssm_parameter" "swa_cert_internal" {
#   name = "/swa/cert-internal"
# }
data "aws_acm_certificate" "certificate" {
  domain   = var.certificate_domain
  statuses = ["ISSUED"]
  types    = ["PRIVATE"]
}
data "aws_kms_key" "swa_kms_key" {
  key_id = "alias/swa_${local.account_id}_kms"
}
