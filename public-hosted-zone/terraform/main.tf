# All code copied from MX / Pay at Shop Visit / Infrastructure / pasv-ui-hosted-zones repository.
resource "aws_route53_delegation_set" "main" {
  reference_name = local.delegation_set_name
  lifecycle {
    prevent_destroy = false
  }
}

# Create Route 53 Hosted Zones
resource "aws_route53_zone" "public_hosted_zone" {
  for_each = { for zone in var.public_hosted_zones : zone.name => zone }

  name              = each.value.name
  comment           = "Public Hosted Zones for THD"
  delegation_set_id = aws_route53_delegation_set.main.id
  force_destroy     = true
  tags = merge(var.tags, {
    "ddarke:Environment" = var.environment
  })
}

# resource "aws_ssm_parameter" "public_hosted_zone_id" {
#   for_each = aws_route53_zone.public_hosted_zone

#   name        = "/thd/route53/${each.key}/zone_id"
#   description = "Route 53 Hosted Zone ID for ${each.key}"
#   type        = "String"
#   value       = each.value.zone_id

#   tags = var.tags
# }




# Enable DNSSEC for the hosted zone
# resource "aws_route53_hosted_zone_dnssec" "public_hosted_zone_dnssec" {
#   for_each = module.public_hosted_zone
#
#   hosted_zone_id = each.value.zone_id
# }


# # Create CloudWatch Log Groups for Query Logging
# resource "aws_cloudwatch_log_group" "public_hosted_zone_log_group" {
#   for_each = module.public_hosted_zone

#   name = "/aws/route53/${each.key}"
# }

# resource "aws_cloudwatch_log_resource_policy" "route53_query_logging_policy" {
#   policy_document = data.aws_iam_policy_document.route53_query_logging_policy.json
#   policy_name     = "route53_query_logging_policy"
# }
# # Attach Query Logging to Hosted Zones
# resource "aws_route53_query_log" "public_hosted_zone_log" {
#   for_each                 = module.public_hosted_zone
#   cloudwatch_log_group_arn = aws_cloudwatch_log_group.public_hosted_zone_log_group[each.key].arn
#   zone_id                  = each.value.zone_id
# }

# # Create CloudWatch Alarms for DDoS Detection
# resource "aws_cloudwatch_metric_alarm" "public_hosted_zone_alarm" {
#   for_each = module.public_hosted_zone

#   alarm_name          = "${each.key}-alarm"
#   alarm_description   = "Alarm for ${each.key}"
#   namespace           = var.r53_namespace
#   metric_name         = var.metric_name
#   statistic           = var.statistic
#   period              = var.period
#   evaluation_periods  = var.evaluation_periods
#   threshold           = var.threshold
#   comparison_operator = var.comparison_operator
#   treat_missing_data  = var.treat_missing_data

#   alarm_actions = ["arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cw_low_alarm_sns_to_dash"]
#   ok_actions    = ["arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:cw_low_alarm_sns_to_dash"]
# }

# Create public ACM certificate in us-east-1 for CloudFront
resource "aws_acm_certificate" "cloudfront_cert" {
  for_each = { for zone in var.public_hosted_zones : zone.name => zone if zone.create_cert }

  domain_name               = each.value.name
  subject_alternative_names = each.value.san_names
  validation_method         = "DNS"
  tags                      = var.tags

  lifecycle {
    create_before_destroy = false
  }
}

module "cert_validation" {
  source   = "./modules/acm_certificate_validation"
  for_each = { for zone in var.public_hosted_zones : zone.name => zone if zone.create_cert == true }

  domain_validation_options = aws_acm_certificate.cloudfront_cert[each.key].domain_validation_options

  certificate_arn = aws_acm_certificate.cloudfront_cert[each.key].arn
  domain_name     = each.value.name
  san_names       = each.value.san_names
  zone_id         = aws_route53_zone.public_hosted_zone[each.key].zone_id

  depends_on = [aws_acm_certificate.cloudfront_cert]
}

# resource "aws_ssm_parameter" "public_cert_ssm" {
#   for_each = aws_acm_certificate.cloudfront_cert

#   name        = "/thd/route53/${each.key}/public_cert_arn"
#   description = "ARN of the public ACM certificate for ${each.key}"
#   type        = "String"
#   value       = each.value.arn

#   tags = var.tags
# }

# Store the delegation set name servers in SSM Parameter Store
resource "aws_ssm_parameter" "delegation_set_name_servers" {
  name        = "/thd/route53/delegation_set/name_servers"
  description = "Name servers for the THD delegation set"
  type        = "StringList"
  value       = join(",", aws_route53_delegation_set.main.name_servers)

  tags = var.tags
}
