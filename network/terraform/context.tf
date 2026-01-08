# tflint-ignore-file: terraform_standard_module_structure
#
# **ONLY EDIT THIS FILE IN** `swa-common/devplat/ccp-next/ccp-next-modules/ccp-next-labels-module`
# All other instances of this file should be a copy of that one.
#
#
# Copy this file from:
#
# Place it in your Terraform module to automatically get
# CCP Next standard configuration inputs suitable for passing to CCP Next modules to generate SWA standard resource names and tags.
#
# curl --header "PRIVATE-TOKEN: $SWA_GITLAB_HTTPS_PAT" \
#  --output context.tf
#
# Modules should access the whole context as `module.root_labels.context`
# to get the input variables with nulls for defaults,
# for example `context = module.root_labels.context`,
# and access individual variables as `module.root_labels.<var>`,
# with final values filled in. For example if you wish to use `name` from
# a labels context in your Terraform code then you will access it like
# `module.root_labels.name` instead of using `var.name`.
#
# For example, when using defaults, `module.root_labels.context.delimiter`
# will be null, and `module.root_labels.delimiter` will be `-` (hyphen).
#

module "root_labels" {
  #checkov:skip=CKV_TF_1:Terraform module sources do not use a git url with a commit hash revision
  # use latest version
  version = "0.6.1"

  enabled = var.enabled

  # label id elements
  attributes  = var.attributes
  department  = var.department
  environment = var.environment
  name        = var.name
  namespace   = var.namespace

  # ccp tags elements
  business_service = var.business_service
  compliance       = var.compliance
  confidentiality  = var.confidentiality
  repo_id          = var.repo_id
  state_bucket     = var.state_bucket
  state_key        = var.state_key
  sub_environment  = var.sub_environment
  tags             = var.tags

  # qualifiers
  additional_tag_map = var.additional_tag_map
  descriptor_formats = var.descriptor_formats

  delimiter           = var.delimiter
  id_length_limit     = var.id_length_limit
  labels_as_tags      = var.labels_as_tags
  label_key_case      = var.label_key_case
  label_order         = var.label_order
  label_value_case    = var.label_value_case
  regex_replace_chars = var.regex_replace_chars

  context = var.context
}

# Copy contents of swa-common/devplat/ccp-next/ccp-next-modules/ccp-next-labels-module/variables.tf

#### BEGIN: Variables Content
##########
# Context
##########

variable "context" {
  type = any
  default = {
    attributes       = []
    business_service = null
    compliance       = null
    confidentiality  = null
    department       = null
    environment      = null
    name             = null
    namespace        = null
    repo_id          = null
    state_bucket     = null
    state_key        = null
    sub_environment  = null
    tags             = {}

    additional_tag_map  = {}
    delimiter           = null
    descriptor_formats  = {}
    enabled             = true
    id_length_limit     = null
    labels_as_tags      = ["default"]
    label_key_case      = null
    label_order         = []
    label_value_case    = null
    regex_replace_chars = null
  }
  description = <<-EOT
    Single object for setting entire context at once.
    See description of individual variables for details.
    Leave string and numeric variables as `null` to use default value.
    Individual variable settings (non-null) override settings in context object,
    except for attributes, tags, and additional_tag_map, which are merged.
  EOT

  validation {
    condition     = lookup(var.context, "label_key_case", null) == null ? true : contains(["lower", "title", "upper"], var.context["label_key_case"])
    error_message = "Allowed values: `lower`, `title`, `upper`."
  }

  validation {
    condition     = lookup(var.context, "label_value_case", null) == null ? true : contains(["lower", "title", "upper", "none"], var.context["label_value_case"])
    error_message = "Allowed values: `lower`, `title`, `upper`, `none`."
  }
}

####################
# Label ID elements
####################

variable "attributes" {
  type        = list(string)
  default     = []
  description = <<-EOT
    Label ID element. Additional attributes to add to `id`,
    in the order they appear in the list. New attributes are appended to the
    end of the list. The elements of the list are joined by the `delimiter`
    and treated as a single ID element.
    EOT
}

variable "department" {
  type        = string
  default     = null
  description = <<-EOT
    ***(Mandatory)*** Label ID element. The department doing the deployment. Value is normalized and formatted. Also used as `SWA:Name` tag.
    The value of SWA:Name is the core of reporting data and should capture the referenced SWA product name.
    E.g. `OpsSuite`, `SWIM`, `CrewBit` or `Baker`.
    ccp-next-labels-module stops outputting labels and tags if unset.
    EOT
}

variable "environment" {
  type        = string
  default     = null
  description = <<-EOT
    ***(Mandatory)*** Label ID element. The environment in which to deploy. Value is normalized and formatted.
    Also used as `EnvPrefix` tag.
    ccp-next-labels-module stops outputting labels and tags if unset.
    EOT
}

variable "name" {
  type        = string
  default     = null
  description = <<-EOT
    Label ID element. Usually the component, service or solution name.
    This is the only ID element not included as a `tag`. `Name` tag has a special meaning for AWS resources.
    Value is normalized and formatted.
    The "name" tag is set to the full `id` string. There is no tag with the value of the `name` input.
    EOT
}

variable "namespace" {
  type        = string
  default     = null
  description = <<-EOT
    ***(Mandatory)*** Label ID element. The CCP namespace in which to deploy. Value is normalized and formatted.
    Also used as `CCPNamespace` tag.
    ccp-next-labels-module stops outputting labels and tags if unset.
    EOT
}

################
# Tags Elements
################

variable "business_service" {
  type        = string
  default     = null
  description = "CCP Next Tag. Used as `SWA:BusinessService` tag."
}

variable "compliance" {
  type        = string
  default     = null
  description = "CCP Next Tag. Used as `SWA:Compliance` tag."
}

variable "confidentiality" {
  type        = string
  default     = null
  description = "CCP Next Tag. Used as `SWA:Confidentiality` tag. This tag identifies if this is sensitive customer data or confidential business information."
}

variable "repo_id" {
  type        = string
  default     = null
  description = <<-EOT
    ***(Mandatory)*** CCP Next Tag. Used as `RepoId` tag. An identifier from where the AWS resources were deployed.
    ccp-next-labels-module stops outputting labels and tags if unset.
    EOT
}

variable "state_bucket" {
  type        = string
  default     = null
  description = <<-EOT
    ***(Mandatory)*** CCP Next Tag. Used as `TFStateBucket` tag. Specifies AWS s3 bucket name where Terraform state is stored.
    ccp-next-labels-module stops outputting labels and tags if unset.
    EOT
}

variable "state_key" {
  type        = string
  default     = null
  description = <<-EOT
    ***(Mandatory)*** CCP Next Tag. Used as `TFStateBucket` tag. Specifies AWS s3 prefix where Terraform state is stored.
    ccp-next-labels-module stops outputting labels and tags if unset.
    EOT
}

variable "sub_environment" {
  type        = string
  default     = null
  description = "CCP Next Tag. Used as `SWA:Environment` tag. SWA Accounts are already associated with an environment."
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = <<-EOT
    Additional tags (e.g. `{'SWA:Tier': 'app'}`).
    Neither the tag keys nor the tag values will be modified by this module.
    EOT
}

###################
# Qualifier Inputs
###################

variable "additional_tag_map" {
  type        = map(string)
  default     = {}
  description = <<-EOT
    Additional key-value pairs to add to each map in `tags_as_list_of_maps`. Not added to `tags` or `id`.
    This is for some rare cases where resources want additional configuration of tags
    and therefore take a list of maps with tag key, value, and additional configuration.
    Check example for ec2 autoscaling group and launch template.
    EOT
}

variable "delimiter" {
  type        = string
  default     = null
  description = <<-EOT
    Delimiter to be used between ID elements.
    Defaults to `-` (hyphen). Set to `""` to use no delimiter at all.
  EOT
}

variable "descriptor_formats" {
  type        = any
  default     = {}
  description = <<-EOT
    Describe additional descriptors to be output in the `descriptors` output map.
    Map of maps. Keys are names of descriptors. Values are maps of the form
    `{
       format = string
       labels = list(string)
    }`
    (Type is `any` so the map values can later be enhanced to provide additional options.)
    `format` is a Terraform format string to be passed to the `format()` function.
    `labels` is a list of labels, in order, to pass to `format()` function.
    Label values will be normalized before being passed to `format()` so they will be
    identical to how they appear in `id`.
    Default is `{}` (`descriptors` output will be empty).
    EOT
}

variable "enabled" {
  type        = bool
  default     = null
  description = "Set to false to prevent the module from creating any resources"
}

variable "id_length_limit" {
  type        = number
  default     = null
  description = <<-EOT
    Limit `id` to this many characters (minimum 6).
    Set to `0` for unlimited length.
    Set to `null` for keep the existing setting, which defaults to `0`.
    Does not affect `id_full`.
  EOT
  validation {
    condition     = var.id_length_limit == null ? true : var.id_length_limit >= 6 || var.id_length_limit == 0
    error_message = "The id_length_limit must be >= 6 if supplied (not null), or 0 for unlimited length."
  }
}

variable "labels_as_tags" {
  type        = set(string)
  default     = ["unset"]
  description = <<-EOT
    Set of labels to include as tags in the `tags` output.
    Default is to include all labels.
    Tags with empty values will not be included in the `tags` output.
    Set to `[]` to suppress all generated tags.
    **Notes:**
      The value of the `name` tag, if included, will be the `id`, not the `name`.
    EOT
}

variable "label_key_case" {
  type        = string
  default     = null
  description = <<-EOT
    Controls the letter case of the `tags` keys (label names) for tags generated by this module.
    Does not affect keys of tags passed in via the `tags` input.
    Applies only to `attributes` and `name` labels.
    Possible values: `lower`, `title`, `upper`.
    Default value: `title`.
  EOT
  validation {
    condition     = var.label_key_case == null ? true : contains(["lower", "title", "upper"], var.label_key_case)
    error_message = "Allowed values: `lower`, `title`, `upper`."
  }
}

variable "label_order" {
  type        = list(string)
  default     = null
  description = <<-EOT
    The order in which the labels (ID elements) appear in the `id`.
    Defaults to ["department", "environment", "namespace", "name", "attributes"].
    You can omit any of the 6 labels ("tenant" is the 6th), but at least one must be present.
    EOT
}

variable "label_value_case" {
  type        = string
  default     = null
  description = <<-EOT
    Controls the letter case of ID elements (labels) as included in `id`,
    set as tag values, and output by this module individually.
    Does not affect values of tags passed in via the `tags` input.
    Possible values: `lower`, `title`, `upper` and `none` (no transformation).
    Set this to `title` and set `delimiter` to `""` to yield Pascal Case IDs.
    Default value: `lower`.
  EOT
  validation {
    condition     = var.label_value_case == null ? true : contains(["lower", "title", "upper", "none"], var.label_value_case)
    error_message = "Allowed values: `lower`, `title`, `upper`, `none`."
  }
}

variable "regex_replace_chars" {
  type        = string
  default     = null
  description = <<-EOT
    Terraform regular expression (regex) string.
    Characters matching the regex will be removed from the ID elements.
    If not set, `"/[^a-zA-Z0-9-]/"` is used to remove all characters other than hyphens, letters and digits.
  EOT
}

#### END: Variables Content
