# Data lookups are for resources that should already exist in the AWS account.
# These resources are typically either deployed through the DDE Account Baseline
# or through another stack.

data "aws_caller_identity" "current" {}

# data "aws_ssm_parameter" "DDARKE_cert_internal" {
#   name = "/DDARKE/cert-internal"
# }
data "aws_acm_certificate" "certificate" {
  domain   = var.certificate_domain
  statuses = ["ISSUED"]
  types    = ["PRIVATE"]
}
data "aws_kms_key" "DDARKE_kms_key" {
  key_id = "alias/DDARKE_${local.account_id}_kms"
}
