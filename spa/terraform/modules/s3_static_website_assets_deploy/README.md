# Welcome

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
| terraform | >= 1.7.0, < 2.0.0 |
| aws | ~> 5.27 |

## Providers

| Name | Version |
|------|---------|
| aws | ~> 5.27 |


## Resources

| Name | Type |
|------|------|
| [aws_s3_object.static_website_object](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_object) | resource |

## Inputs

| Name | Description | Type | Default |
|------|-------------|------|---------|
| bucket\_name | the name of the bucket to place the static website assets in | `string` | n/a |
| site\_path | the path where the site needs to be deployed | `string` | n/a |
| source\_path | the source file of the static asset | `string` | n/a |

## Outputs

No outputs.
<!-- END_TF_DOCS -->
