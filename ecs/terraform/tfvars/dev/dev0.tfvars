# Optional input vars to override defaults.auto.tfvars

# # Here I am not overriding the topic name and letting use the name
# # from defaults.auto.tfvars
# gitlab_sns_module_attributes = ["gitlab", "module", "topic"]

# General Variables
department = "ETO"
name       = "THD-Dev-Inst"

# ecs.tf variables
container_insights_enabled = "enabled"
sleep_wake_enabled         = true

vpc_tag_name = "eto-dev-dev0-vpc"

certificate_domain = "dev.technologyhealth.ddarkecorp.com"
container_image    = "290503755741.dkr.ecr.us-west-2.amazonaws.com/sre/opsmon/frontend-deployment/backend:etothd-1038"
private_zone_name  = "dev.technologyhealth.ddarkecorp.com"

thd_secret_name     = "thd-db/dev"
dash_secret_name    = "dash-db/dev"
backend_secret_name = "thd-backend/dev"

task_cpu    = 1024
task_memory = 3072
