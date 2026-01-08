# data "aws_caller_identity" "current" {}

#data "aws_region" "current" {}

# data "aws_kms_key" "swa_kms_key" {
#   key_id = "alias/swa_${data.aws_caller_identity.current.account_id}_kms"
# }

# data "terraform_remote_state" "certificate" {
#   backend = "s3"
#   config = {
#     bucket = "swa-ec-tf-state-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
#     key    = var.certificate_arn_tf_state_key
#     region = data.aws_region.current.name
#   }
# }
