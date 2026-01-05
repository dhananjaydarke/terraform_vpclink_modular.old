# Optional input vars to override defaults.auto.tfvars
environment = "dev"

region = "us-east-1"
# r53_namespace       = "AWS/Route53"
# metric_name         = "HealthCheckStatus"
# statistic           = "Minimum"
# period              = 60
# evaluation_periods  = 1
# threshold           = 1
# comparison_operator = "GreaterThanOrEqualToThreshold"
# treat_missing_data  = "missing"
name_prefix         = "thd-dev"
delegation_set_name = "etothd-r53-delegation-set"

public_hosted_zones = [
  {
    name        = "technologyhealth.dev.aws.swacorp.com",
    create_cert = true,
    san_names   = ["*.technologyhealth.dev.aws.swacorp.com"]
    Alarms = {
      AssignmentGroup = "Technology Health Dashboard Support L3",
      Application     = "THD",
      Description     = "Alarm for THD Public Hosted Zone"
    },
    tags = [
      { Key = "Usecase", Value = "public hosted zone" },
      { Key = "SWA:BusinessService", Value = "SWA THD" },
      { Key = "Owner", Value = "THD" }
    ]
  }
]
