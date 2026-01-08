# terraform/modules/rds/outputs.tf
output "db_instance_address" {
  description = "RDS instance address"
  value       = module.rds.instance_address
}

output "secret_arn" {
  description = "ARN of the secrets manager secret"
  value       = aws_secretsmanager_secret.thd_backend.arn
}
