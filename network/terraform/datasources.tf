data "aws_region" "current" {}


data "aws_ssm_parameter" "swa_pca_arn_share" {
  name = "arn:aws:ssm:${data.aws_region.current.name}:${local.pca_arn_ssm_account[var.environment]}:parameter/swa/pca/${var.environment}/shared-pca-arn"
}
