module "vpc" {
  source = "./modules/vpc"

  # instead of passing all context inputs using a specific context
  # for this module instead of spelling out all the input variables
  context = module.root_labels.context
  # certificate_arn_tf_state_key = var.certificate_arn_tf_state_key
}

# Resource for provisioning a private cert using the SWA common PCA for a specific env and region.
resource "aws_acm_certificate" "cert" {
  domain_name               = "backend.technologyhealth.${var.environment}.aws.swacorp.com"
  subject_alternative_names = ["*.backend.technologyhealth.${var.environment}.aws.swacorp.com"]
  certificate_authority_arn = data.aws_ssm_parameter.swa_pca_arn_share.value
  key_algorithm             = "RSA_2048"
  lifecycle {
    create_before_destroy = true
  }
}
