module "rds" {
  source = "./modules/rds"

  # instead of passing all context inputs using a specific context
  # for this module instead of spelling out all the input variables
  context = module.root_labels.context

  vpc_tag_name        = var.vpc_tag_name
  stage               = var.stage
  allowed_cidr_blocks = var.allowed_cidr_blocks
  deletion_protection = var.deletion_protection
  database_name       = var.database_name
}
