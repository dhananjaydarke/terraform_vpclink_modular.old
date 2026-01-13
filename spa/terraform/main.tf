# resource "aws_vpc" "tiny_vpc" {
#   cidr_block           = "100.64.0.0/28"
#   enable_dns_hostnames = true
#   enable_dns_support   = true

# }

# resource "aws_route53_zone" "private" {
#   name          = "${module.root_labels.environment}.technologyhealth.ddarkecorp.com"
#   force_destroy = true
#   vpc {
#     vpc_id = data.terraform_remote_state.vpc_network.outputs["vpc_id"]
#   }
# }
resource "aws_cloudfront_function" "strip_api_prefix" {
  name    = "strip-api-prefix"
  runtime = "cloudfront-js-2.0"
  comment = "cloudfront function to remove /api prefix for backend routing"
  publish = true
  code    = file("${path.cwd}/cloudfront_strip_api.js")
}

module "private_hosted_zones" { # creates private_hz and no apex_hz
  # use versioned module reference
  version         = "0.5.1"
  private_hz_name = "backend.technologyhealth.${module.root_labels.environment}.aws.ddarkecorp.com"
  vpc = [
    { vpc_id = data.terraform_remote_state.vpc_network.outputs["vpc_id"] }
  ]
  context = module.root_labels.context
}

module "s3_bucket_cf_primary" {
  source        = "terraform-aws-modules/s3-bucket/aws"
  version       = "4.11.0"
  bucket        = "${var.cloudfront_origin_bucket_name}.${module.root_labels.environment}.${var.namespace}"
  force_destroy = true
  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = data.aws_kms_alias.ddarke_kms.arn
      }
      bucket_key_enabled = true
    }
  }
  versioning = { status = "Enabled" }
  lifecycle_rule = [
    {
      id     = "expire-logs"
      status = "Enabled"
      prefix = "logs/"

      transition = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        }
      ]

      expiration = {
        days = 90
      }
    }
  ]
}

resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = module.s3_bucket_cf_primary.s3_bucket_id
  policy = data.aws_iam_policy_document.s3_policy.json
}

resource "aws_shield_protection" "cf_distribution_shield_protection" {
  name         = "thd-shield-protection"
  resource_arn = module.cloudfront.cloudfront_distribution_arn
}

resource "aws_route53_record" "cloudfront_app_domain" {
  name = module.private_hosted_zones.private_hosted_zone_name

  type    = "A"
  zone_id = module.private_hosted_zones.private_hosted_zone_id

  set_identifier = "thd"
  weighted_routing_policy {
    weight = 1
  }

  alias {
    name                   = module.cloudfront.cloudfront_distribution_domain_name
    zone_id                = module.cloudfront.cloudfront_distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "backend_nlb_private" {
    allow_overwrite = true
  name    = "app.${module.private_hosted_zones.private_hosted_zone_name}"
  type    = "A"
  zone_id = module.private_hosted_zones.private_hosted_zone_id

  alias {
    name                   = aws_lb.backend_nlb.dns_name
    zone_id                = aws_lb.backend_nlb.zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "cloudfront_public_domain" {
  name    = one(data.terraform_remote_state.public_hosted_zone.outputs.hosted_zone_names)
  type    = "A"
  zone_id = data.terraform_remote_state.public_hosted_zone.outputs.hosted_zone_ids["technologyhealth.${module.root_labels.environment}.aws.ddarkecorp.com"]

  alias {
    name                   = module.cloudfront.cloudfront_distribution_domain_name
    zone_id                = module.cloudfront.cloudfront_distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_cloudfront_function" "append_index_path" {
  name    = "redirect-to-index"
  runtime = "cloudfront-js-2.0"
  comment = "cloudfront function to append index path"
  publish = true
  code    = file("${path.cwd}/cloudfront_function.js")
}

module "ddarke_only_waf" {
  version                       = "0.6.3"
  waf_type                      = "cloudfront-ddarke-only"
  namespace                     = var.namespace
  context                       = module.root_labels.context
  cloudfront_rate_based_limit   = 1000
  cloudfront_aggregate_key_type = "IP"
  enable_rule_group_cw_metrics  = true
  request_body_size_limit       = 8192
}
# Create CloudWatch Log Group for API Gateway
# amazonq-ignore-next-line
resource "aws_cloudwatch_log_group" "apigw_logs" {
  name              = "/aws/apigateway/${var.apigateway_prefix}-${module.root_labels.id}"
  retention_in_days = 7
  tags              = module.root_labels.tags
}

# IAM role for API Gateway to write to CloudWatch
resource "aws_iam_role" "apigw_cloudwatch" {
  name = "${module.root_labels.id}-apigw-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
    }]
  })

  tags = module.root_labels.tags
}

resource "aws_iam_role_policy_attachment" "apigw_cloudwatch" {
  role       = aws_iam_role.apigw_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# CloudWatch Log Group for WAF (API Gateway)
resource "aws_cloudwatch_log_group" "waf_apigw_logs" {
  name              = "aws-waf-logs-apigw-${module.root_labels.id}"
  retention_in_days = 7
  tags              = module.root_labels.tags
}

resource "aws_wafv2_web_acl_logging_configuration" "apigw_waf_logging" {
  resource_arn            = module.apigw_waf_regional.waf_arn
  log_destination_configs = [aws_cloudwatch_log_group.waf_apigw_logs.arn]
}

# CloudWatch Log Group for WAF (CloudFront)
resource "aws_cloudwatch_log_group" "waf_cloudfront_logs" {
  name              = "aws-waf-logs-cloudfront-${module.root_labels.id}"
  retention_in_days = 7
  tags              = module.root_labels.tags
}

resource "aws_wafv2_web_acl_logging_configuration" "cloudfront_waf_logging" {
  resource_arn            = module.ddarke_only_waf.waf_arn
  log_destination_configs = [aws_cloudwatch_log_group.waf_cloudfront_logs.arn]
}

# VPC Origin for private API Gateway integration

resource "aws_cloudfront_vpc_origin" "backend" {
  vpc_origin_endpoint_config {
    name                   = var.vpc_origin_name
    arn                    = data.aws_lb.existing_alb.arn
    http_port              = 80
    https_port             = 443
    origin_protocol_policy = "http-only"

    origin_ssl_protocols {
      items    = ["TLSv1.2"]
      quantity = 1
    }
  }

  tags = module.root_labels.tags
}

resource "aws_cloudfront_response_headers_policy" "api_cors" {
  name = "thd-api-cors-policy"

  cors_config {
    access_control_allow_credentials = false

    access_control_allow_headers {
      items = ["*"]
    }

    access_control_allow_methods {
      items = ["GET", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
    }

    access_control_allow_origins {
      items = ["*"]
    }

    origin_override = true
  }
}


module "cloudfront" {
  #checkov:skip=CKV_AWS_310:Origin failover not required for single S3 origin
  source                       = "terraform-aws-modules/cloudfront/aws"
  version                      = "4.2.0"
  comment                      = "thd-cloudfront-distribution"
  create_origin_access_control = true
  origin_access_control = {
    s3_oac = {
      description      = "CloudFront access to S3"
      origin_type      = "s3"
      signing_behavior = "always"
      signing_protocol = "sigv4"
    }
  }
  origin = {
    s3_oac = { # with origin access control settings (recommended)
      domain_name           = module.s3_bucket_cf_primary.s3_bucket_bucket_regional_domain_name
      origin_access_control = "s3_oac" # key in `origin_access_control`
    }
    vpc_origin = {
      domain_name = var.vpc_origin_domain_name_cf
      vpc_origin_config = {
        vpc_origin_id = aws_cloudfront_vpc_origin.backend.id
      }
      custom_header = [
        {
          name  = "x-apigw-api-id"
          value = module.apigw.rest_api_id
        }
      ]
    }
    apigw = {
      domain_name = "${module.apigw.rest_api_id}.execute-api.${var.region}.amazonaws.com"
      origin_path = "/test"
      custom_origin_config = {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
  }

  default_cache_behavior = {
    //path_pattern           = "/*"
    target_origin_id       = "s3_oac"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]

    use_forwarded_values = false

    cache_policy_name            = "Managed-CachingOptimized"
    origin_request_policy_name   = "Managed-UserAgentRefererHeaders"
    response_headers_policy_name = "Managed-SimpleCORS"

    function_association = {
      viewer-request = {
        function_arn = aws_cloudfront_function.append_index_path.arn
      }
    }

  }
  ordered_cache_behavior = [
    {
      path_pattern           = "/api/*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]

      //cached_methods             = ["GET", "HEAD"]
      use_forwarded_values       = false
      cache_policy_name          = "Managed-CachingDisabled"
      origin_request_policy_name = "Managed-AllViewerExceptHostHeader"
      //response_headers_policy_name = aws_cloudfront_response_headers_policy.api_cors.name
      response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id
      function_association = {
        viewer-request = {
          function_arn = aws_cloudfront_function.strip_api_prefix.arn
        }
      }

    },
    {
      path_pattern           = "/CreateAddition*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]

      use_forwarded_values       = false
      cache_policy_name          = "Managed-CachingDisabled"
      origin_request_policy_name = "Managed-AllViewerExceptHostHeader"
      response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id
    },
    {
      path_pattern           = "/UpdateItem*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]

      use_forwarded_values       = false
      cache_policy_name          = "Managed-CachingDisabled"
      origin_request_policy_name = "Managed-AllViewerExceptHostHeader"
      response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id
    },
    {
      path_pattern           = "/RemoveItem*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]

      use_forwarded_values       = false
      cache_policy_name          = "Managed-CachingDisabled"
      origin_request_policy_name = "Managed-AllViewerExceptHostHeader"
      response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id
    },
    {
      path_pattern           = "/Login*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]

      use_forwarded_values       = false
      cache_policy_name          = "Managed-CachingDisabled"
      origin_request_policy_name = "Managed-AllViewerExceptHostHeader"
      response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id
    },
    {
      path_pattern           = "/CreateRunbook*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]

      use_forwarded_values       = false
      cache_policy_name          = "Managed-CachingDisabled"
      origin_request_policy_name = "Managed-AllViewerExceptHostHeader"
      response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id
    },
    {
      path_pattern           = "/All*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]

      use_forwarded_values       = false
      cache_policy_name          = "Managed-CachingDisabled"
      origin_request_policy_name = "Managed-AllViewerExceptHostHeader"
      response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id
    },
    {
      path_pattern           = "/Location*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]

      use_forwarded_values       = false
      cache_policy_name          = "Managed-CachingDisabled"
      origin_request_policy_name = "Managed-AllViewerExceptHostHeader"
      response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id
    },
    {
      path_pattern           = "/LIAT*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]

      use_forwarded_values       = false
      cache_policy_name          = "Managed-CachingDisabled"
      origin_request_policy_name = "Managed-AllViewerExceptHostHeader"
      response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id
    },
    {
      path_pattern           = "/RunbookJSON*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]

      use_forwarded_values       = false
      cache_policy_name          = "Managed-CachingDisabled"
      origin_request_policy_name = "Managed-AllViewerExceptHostHeader"
      response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id
    },
    {
      path_pattern           = "/Sidebar*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]

      use_forwarded_values       = false
      cache_policy_name          = "Managed-CachingDisabled"
      origin_request_policy_name = "Managed-AllViewerExceptHostHeader"
      response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id
    },
    {
      path_pattern           = "/Footer*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]

      use_forwarded_values       = false
      cache_policy_name          = "Managed-CachingDisabled"
      origin_request_policy_name = "Managed-AllViewerExceptHostHeader"
      response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id
    },
    {
      path_pattern           = "/healthcheck_receive*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]

      use_forwarded_values       = false
      cache_policy_name          = "Managed-CachingDisabled"
      origin_request_policy_name = "Managed-AllViewerExceptHostHeader"
      response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id
    },
    {
      path_pattern           = "/Operations*"
      target_origin_id       = "apigw"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]

      use_forwarded_values       = false
      cache_policy_name          = "Managed-CachingDisabled"
      origin_request_policy_name = "Managed-AllViewerExceptHostHeader"
      response_headers_policy_id = aws_cloudfront_response_headers_policy.api_cors.id
    }
  ]	

  web_acl_id = module.ddarke_only_waf.waf_arn
  aliases    = [module.private_hosted_zones.private_hosted_zone_name]

  viewer_certificate = {
    acm_certificate_arn            = data.terraform_remote_state.certificate.outputs["cloudfront_cert_arns"]["technologyhealth.${module.root_labels.environment}.aws.ddarkecorp.com"]
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
    cloudfront_default_certificate = true
  }

  logging_config = {
    bucket = "ec-cloudfront-logs-${data.aws_caller_identity.current.account_id}-${var.region}.s3.amazonaws.com",
    prefix = "cloudfront"
  }
}

resource "null_resource" "cloudfront_invalidation" { # FIXME - this can be deleted
  provisioner "local-exec" {
    command = "aws cloudfront create-invalidation --distribution-id ${module.cloudfront.cloudfront_distribution_id} --paths '/test/*'"
  }

  triggers = {
    distribution_id = module.cloudfront.cloudfront_distribution_id
  }
}

module "s3_static_website_assets_deploy" {
  for_each    = { for deployment in var.static_asset_deployments : deployment.name => deployment }
  source      = "./modules/s3_static_website_assets_deploy"
  bucket_name = each.value.bucket_name
  source_path = "${var.project_dir != null ? var.project_dir : path.cwd}/${each.value.source_path != null ? each.value.source_path : "app/generated"}"
  site_path   = each.value.site_path != null ? each.value.site_path : "/"

  context = module.root_labels.context

  depends_on = [module.s3_bucket_cf_primary]
}

module "apigw_waf_regional" {
  version   = "0.6.3"
  waf_type  = "apigw"
  namespace = var.namespace
  context   = module.root_labels.context
  //cloudfront_rate_based_limit = 1000
  //cloudfront_aggregate_key_type = "IP"
  // enable_rule_group_cw_metrics = true
  //request_body_size_limit = 8192


}



module "apigw" {
  version = "1.11.0"

  context       = module.root_labels.context
  api_name      = "${var.apigateway_prefix}-${module.root_labels.id}"
  endpoint_type = "REGIONAL"
  //vpc_endpoint_ids = [data.terraform_remote_state.vpc_network.outputs["execute_api_endpoint_id"]]
  wafv2_arn = module.apigw_waf_regional.waf_arn

  vpc_links = {
    main = {
      name        = "${module.root_labels.id}-vpc-link"
      target_arns = [aws_lb.backend_nlb.arn]
    }
  }

  resources = {
 proxy = {
      path_part  = "{proxy+}"
      methods = {
        any = {
          http_method   = "ANY"
          authorization = "NONE"
          api_key_required = false		  
          integration_type = "HTTP_PROXY"
          integration_config = {
            timeout_milliseconds = 29000
            connection_type      = "VPC_LINK"
            vpc_link_key         = "main"
            integration_method   = "ANY"
            uri                  = "https://app.${module.private_hosted_zones.private_hosted_zone_name}/{proxy}"
          }
        }
      }
    }	
    Sidebar = {
      path_part  = "Sidebar"
      methods = {
		get = {
          http_method      = "GET"
          authorization    = "NONE"
          api_key_required = false		  
          integration_type = "HTTP_PROXY"
          integration_config = {
            timeout_milliseconds = 29000
            connection_type      = "VPC_LINK"
            vpc_link_key         = "main"
            integration_method   = "ANY"
            uri                  = "https://app.${module.private_hosted_zones.private_hosted_zone_name}/Sidebar"
          }
        }
      }
    }
    Footer = {
      path_part  = "Footer"
      methods = {
        get = {
          http_method      = "GET"
          authorization    = "NONE"
          api_key_required = false		  
          integration_type = "HTTP_PROXY"
          integration_config = {
            timeout_milliseconds = 29000
            connection_type      = "VPC_LINK"
            vpc_link_key         = "main"
            integration_method   = "ANY"
            uri                  = "https://app.${module.private_hosted_zones.private_hosted_zone_name}/Footer"
          }
                  }
      }
    }
    Location = {
      path_part  = "Location"
      methods = {
        get = {
          http_method      = "GET"
          authorization    = "NONE"
          api_key_required = false		  
          integration_type = "HTTP_PROXY"
          integration_config = {
            timeout_milliseconds = 29000
            connection_type      = "VPC_LINK"
            vpc_link_key         = "main"
            integration_method   = "ANY"
            uri                  = "https://app.${module.private_hosted_zones.private_hosted_zone_name}/Location"
          }
        }
      }
    }
    RunbookJSON = {
      path_part  = "RunbookJSON"
      methods = {
        get = {
          http_method      = "GET"
          authorization    = "NONE"
          api_key_required = false		  
          integration_type = "HTTP_PROXY"
          integration_config = {
            timeout_milliseconds = 29000
            connection_type      = "VPC_LINK"
            vpc_link_key         = "main"
            integration_method   = "ANY"
            uri                  = "https://app.${module.private_hosted_zones.private_hosted_zone_name}/RunbookJSON"
          }
        }
      }
    }

    healthcheck_receive = {
      path_part  = "healthcheck_receive"
      methods = {
        get = {
          http_method      = "GET"
          authorization    = "NONE"
          api_key_required = false		  
          integration_type = "HTTP_PROXY"
          integration_config = {
            timeout_milliseconds = 29000
            connection_type      = "VPC_LINK"
            vpc_link_key         = "main"
            integration_method   = "ANY"
            uri                  = "https://app.${module.private_hosted_zones.private_hosted_zone_name}/healthcheck_receive"
          }
        }
      }
    }
    Operations = { # FIXME - remove when healthcheck_receive is added to backend
      path_part  = "Operations"
      methods = {
        get = {
          http_method      = "GET"
          authorization    = "NONE"
          api_key_required = false		  
          integration_type = "HTTP_PROXY"
          integration_config = {
            timeout_milliseconds = 29000
            connection_type      = "VPC_LINK"
            vpc_link_key         = "main"
            integration_method   = "ANY"
            uri                  = "https://app.${module.private_hosted_zones.private_hosted_zone_name}/Operations"
          }
        }
      }
    }
  }

  stages = {
    test = {
      name                 = "test"
      //xray_tracing_enabled = true
    }
  }

  resource_policies = [
    {
      effect = "Allow"
      principals = [
        {
          type        = "AWS"
          identifiers = ["*"]
        }
      ]
      actions   = ["execute-api:Invoke"]
      resources = ["*"]
    }
  ]
}

# Network Load Balancer for backend VPC Link
resource "aws_lb" "backend_nlb" {
  name               = "${module.root_labels.namespace}-backend-nlb"
  internal           = true
  load_balancer_type = "network"
  subnets            = data.terraform_remote_state.vpc_network.outputs["private_subnets"]

  access_logs {
    bucket  = "ec-cloudfront-logs-${data.aws_caller_identity.current.account_id}-${var.region}"
    prefix  = "nlb"
    enabled = true
  }

  tags = module.root_labels.tags
}

# Target Group pointing to ALB
resource "aws_lb_target_group" "vpc_link_tg" {
  name        = "${module.root_labels.namespace}-vpc-link-tg"
  port        = 443
  protocol    = "TCP"
  vpc_id      = data.terraform_remote_state.vpc_network.outputs["vpc_id"]
  target_type = "alb"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    protocol            = "HTTPS"
    port                = "443"
    path                = "/Operations"
    matcher             = "200"
    timeout             = 10
    unhealthy_threshold = 2
  }

  tags = module.root_labels.tags
}

# Attach ALB to NLB target group
resource "aws_lb_target_group_attachment" "alb_attachment" {
  target_group_arn = aws_lb_target_group.vpc_link_tg.arn
  target_id        = data.aws_lb.existing_alb.arn
  port             = 443
}

# NLB Listener
resource "aws_lb_listener" "backend_listener" {
  load_balancer_arn = aws_lb.backend_nlb.arn
  port              = "443"
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.vpc_link_tg.arn
  }
}
