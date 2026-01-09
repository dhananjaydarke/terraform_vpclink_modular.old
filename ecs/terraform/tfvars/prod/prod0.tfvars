# Optional input vars to override defaults.auto.tfvars

# # Here I am not overriding the topic name and letting use the name
# # from defaults.auto.tfvars
# gitlab_sns_module_attributes = ["gitlab", "module", "topic"]

# General Variables
department = "ETO"
name       = "THD-prod-Inst"

# ecs.tf variables
container_insights_enabled = "enabled"
sleep_wake_enabled         = true

vpc_tag_name = "eto-prod-prod0-vpc"

certificate_domain = "prod.technologyhealth.ddarkecorp.com"

container_image = "290503755741.dkr.ecr.us-west-2.amazonaws.com/sre/opsmon/frontend-deployment/backend:1.0.0"

thd_secret_name     = "thd-db/prod"
dash_secret_name    = "dash-db/prod"
backend_secret_name = "thd-backend/prod"

task_cpu    = 1024
task_memory = 3072
