# These are here to show an example
#
# Terraform automatically loads the variable definitions files if they are present
# in the following order:
#
#   - Files named exactly terraform.tfvars or terraform.tfvars.json
#   - Any files with names ending in .auto.tfvars or .auto.tfvars.json
#
# Terraform checks only the root level directory from where terraform was executed
# to find these files
#
# These vars will be overridden by <env>/<namespace>.tfvars
# You can define some general/common input vars that may be valid for different
# env and/or namespaces or expected to be overridden in some env and/or namespaces

department                    = "ETO"
cloudfront_origin_bucket_name = "thd-frontend-source-code"

# used for static deployment example
static_asset_deployments = [
  {
    name        = "thd-deployment"
    bucket_name = "thd-frontend-source-code"
    source_path = "build"
    site_path   = "/build/"
  }
]
