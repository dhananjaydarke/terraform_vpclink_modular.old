output "cloudfront_distribution_hosted_zone_id" {
  description = "The CloudFront Route 53 zone ID that can be used to route an Alias Resource Record Set to."
  value       = try(module.cloudfront.cloudfront_distribution_hosted_zone_id, "")
}

output "cloudfront_distribution_id" {
  description = "The identifier for the distribution."
  value       = try(module.cloudfront.cloudfront_distribution_id, "")
}

output "private_hosted_zone_name" {
  description = "The name of the private hosted zone"
  value       = module.private_hosted_zones.private_hosted_zone_name
}

output "private_hosted_zone_id" {
  description = "The ID of the private hosted zone"
  value       = module.private_hosted_zones.private_hosted_zone_id
}
