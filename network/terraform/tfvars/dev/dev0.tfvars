# Optional input vars to override defaults.auto.tfvars

# # Here I am not overriding the topic name and letting use the name
# # from defaults.auto.tfvars
# gitlab_sns_module_attributes = ["gitlab", "module", "topic"]
# Environment variables for dev-net environment.

environment = "dev"
namespace   = "dev0"
#vpc_tf_state_key             = "sre/opsmon/infrastructure-deployment/network/dev0/terraform.tfstate"
#certificate_arn_tf_state_key = "sre/opsmon/infrastructure-deployment/public-hosted-zone/dev0/terraform.tfstate"
#hosted_zone_tf_state_key     = "sre/opsmon/infrastructure-deployment/public-hosted-zone/dev0/terraform.tfstate"
#vpc_origin_domain_name = "backend.dev.technologyhealth.ddarkecorp.com"
