output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}
output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "execute_api_endpoint_id" {
  description = "The ID of the execute API endpoint"
  value       = module.vpc_endpoints.endpoints.execute_api.id
}

# output "vpc_link_id" {
#   description = "ID of the VPC Link"
#   value       = aws_api_gateway_vpc_link.this.id
# }
