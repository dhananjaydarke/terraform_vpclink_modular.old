# DMS Migration

Database migration service infrastructure using AWS DMS.

## Getting Started

1. Configure your environment variables
2. Update tfvars files with your specific values
3. Run terraform commands to deploy

## Usage

```bash
terraform init
terraform plan
terraform apply
```

<!-- BEGIN_TF_DOCS -->
## `terraform-docs`

> :information_source: Showing example of adding dynamic contents below from other files in your markdown docs.
> Check [.terraform-docs.yml](.terraform-docs.yml), [terraform/.terraform-docs.yml](terraform/.terraform-docs.yml) and [.pre-commit-config.yaml](.pre-commit-config.yaml) config files or [tf-docs documentation](https://terraform-docs.io/) for more details.
> Notice that there are different configuration for `terraform-docs` for different dynamic contents in different markdown files.
>
> :information_source: Keep documentation clear, concise, and purposeful. Focus only on essential details users need, avoiding unnecessary information that can obscure key points.
> Well-structured, minimal, and direct documentation makes it easier for users to quickly understand and apply the information.

<details>
  <summary>Example Provider Config</summary>

```terraform
# file: terraform/provider.tf

provider "aws" {
  region = var.region

  # adds these common tags to all supported resources
  default_tags {
    tags = module.root_labels.tags
  }
}
```

</details>
<!-- END_TF_DOCS -->
