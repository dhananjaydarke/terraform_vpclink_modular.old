data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "s3_policy" {
  # IAM policy that restricts access to the S3 bucket from cloudfront only
  statement {
    actions = ["s3:GetObject"]
    resources = ["${module.s3_bucket_cf_primary.s3_bucket_arn}/build/index.html",
      "${module.s3_bucket_cf_primary.s3_bucket_arn}/build/static/*",
      "${module.s3_bucket_cf_primary.s3_bucket_arn}/build/*",
    ]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [module.cloudfront.cloudfront_distribution_arn]
    }
  }
}

# Grab swa kms key to be used for s3 bucket encryption
data "aws_kms_alias" "swa_kms" {
  name = "alias/swa_${data.aws_caller_identity.current.account_id}_kms"
}

data "terraform_remote_state" "vpc_network" {
  backend = "s3"
  config = {
    bucket = "swa-ec-tf-state-${data.aws_caller_identity.current.account_id}-${var.region}"
    key    = var.vpc_tf_state_key
    region = var.region
  }
}

data "terraform_remote_state" "certificate" {
  backend = "s3"
  config = {
    bucket = "swa-ec-tf-state-${data.aws_caller_identity.current.account_id}-${var.region}"
    key    = var.certificate_arn_tf_state_key
    region = var.region
  }
}

data "terraform_remote_state" "public_hosted_zone" {
  backend = "s3"
  config = {
    bucket = "swa-ec-tf-state-${data.aws_caller_identity.current.account_id}-${var.region}"
    key    = var.public_hosted_zone_tf_state_key
    region = var.region
  }
}

data "aws_lb" "existing_alb" {
  name = "tf-lb-20251205210638267000000005" # FIXME - use remote state when ECS is deployed
}
