# Optional input vars to override defaults.auto.tfvars

vpc_tf_state_key                = "sre/opsmon/infrastructure-deployment/network/dev0/terraform.tfstate"
certificate_arn_tf_state_key    = "sre/opsmon/infrastructure-deployment/public-hosted-zone/dev0/terraform.tfstate"
public_hosted_zone_tf_state_key = "sre/opsmon/infrastructure-deployment/public-hosted-zone/dev0/terraform.tfstate"

# vpc_origin_domain_name    = "app.backend.technologyhealth.dev.aws.ddarkecorp.com" // FIXME - Hardcoded
vpc_origin_name           = "thd-dev-vpc-origin-backend-internal"
vpc_origin_domain_name_cf = "thd-dev-vpc-origin-backend.internal"
