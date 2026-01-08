# file: local/main.tf
module "ecs_labels" {
  # use latest version
  version = "0.6.1"

  tags = {
    CCPSleepWake = var.sleep_wake_enabled
  }

  context = module.root_labels.context
}

module "ecs_labels_short" {
  # use latest version
  version = "0.6.1"

  id_length_limit = 37

  context = module.ecs_labels.context
}

locals {
  account_id         = data.aws_caller_identity.current.account_id
  sleep_wake_enabled = var.sleep_wake_enabled && var.environment != "prod"
  secret_manager_arn = "arn:aws:secretsmanager:${var.region}:${local.account_id}:secret"
}
