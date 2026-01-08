# ACM Certificate Management
<!-- BEGIN_TF_DOCS -->

## Special Inputs

Following input variables will be set with automations. You do not have to set them in any `tfvars` file.

1. `environment`
1. `namespace`
1. `region` - Only required to initialize the `aws` provider if it is not explicitly listed for the module inputs.
1. `repo_id`
1. `state_bucket`
1. `state_key`

## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.7.0, < 2.0.0 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | ~> 6.1 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | ~> 6.1 |

## Modules

No modules.

## Resources

| Name | Type |
|------|------|
| [aws_acm_certificate_validation.cert_validation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/acm_certificate_validation) | resource |
| [aws_route53_record.domain_records](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route53_record) | resource |

## Inputs

| Name | Description | Type | Default |
|------|-------------|------|---------|
| <a name="input_certificate_arn"></a> [certificate\_arn](#input\_certificate\_arn) | The certificate ARN for the domain | `string` | n/a |
| <a name="input_domain_name"></a> [domain\_name](#input\_domain\_name) | The Domain name for the hosted zone name | `string` | n/a |
| <a name="input_domain_validation_options"></a> [domain\_validation\_options](#input\_domain\_validation\_options) | List of domain validation options from ACM | ```list(object({ domain_name = string resource_record_name = string resource_record_value = string resource_record_type = string }))``` | n/a |
| <a name="input_san_names"></a> [san\_names](#input\_san\_names) | List of SAN's for the domain | `list(string)` | n/a |
| <a name="input_zone_id"></a> [zone\_id](#input\_zone\_id) | The Route 53 zone ID where the DNS records will be created for validation | `string` | n/a |

## Outputs

No outputs.
<!-- END_TF_DOCS -->
