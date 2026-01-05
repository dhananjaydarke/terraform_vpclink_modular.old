# Optional input vars to override defaults.auto.tfvars

# # Here I am not overriding the topic name and letting use the name
# # from defaults.auto.tfvars
# gitlab_sns_module_attributes = ["gitlab", "module", "topic"]
# Environment variables for dev-net environment.
# db_parameter_group = "foo"
# instance_class = "bar"
vpc_tag_name        = "eto-dev-dev0-vpc"
stage               = "dev"
allowed_cidr_blocks = ["10.97.25.64/26", "10.97.25.0/26"]
# database_name       = "ETOTHDDB"
deletion_protection = false
