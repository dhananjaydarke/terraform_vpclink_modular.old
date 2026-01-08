output "hosted_zone_names" {
  description = "Names of the created Route53 Public Hosted Zones"
  value       = [for zone in aws_route53_zone.public_hosted_zone : zone.name]
}

output "hosted_zone_ids" {
  description = "IDs of the created Route53 Public Hosted Zones"
  value       = { for zone in aws_route53_zone.public_hosted_zone : zone.name => zone.id }
}

output "hosted_zone_arns" {
  description = "ARNs of the created Route53 Public Hosted Zones"
  value       = { for zone in aws_route53_zone.public_hosted_zone : zone.name => zone.arn }
}

output "cloudfront_cert_arns" {
  description = "ARNs of the CloudFront ACM certificates"
  value       = { for cert in aws_acm_certificate.cloudfront_cert : cert.domain_name => cert.arn }
}
