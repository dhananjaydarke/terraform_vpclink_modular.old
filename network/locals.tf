# The locals block and the data sources below are required for forming the appropriate ARN
# from which the SSM param containing PCA Arn is shared. Do not change this.
locals {
  pca_arn_ssm_account = {
    "lab"  = "521245781947",
    "dev"  = "521245781947",
    "qa"   = "082744873235",
    "prod" = "290503755741"
  }
}
