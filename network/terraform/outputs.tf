output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

# Outputs the ARN of the cert provisioned
output "aws_acm_certificate_arn" {
  description = "Private cert arn"
  value       = aws_acm_certificate.cert.arn
}

output "execute_api_endpoint_id" {
  description = "The ID of the execute API endpoint"
  value       = module.vpc.execute_api_endpoint_id
}

# output "vpc_link_id" {
#   description = "ID of the VPC Link"
#   value       = module.vpc.vpc_link_id
# }
