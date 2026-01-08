
# Documentation: https://registry.terraform.io/modules/terraform-aws-modules/alb/aws/latest
module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 10.0"
  create  = module.ecs_labels.enabled

  load_balancer_type = "application"

  # INFO: (SWA-Standard) requires ALBs to be internal
  internal = true

  vpc_id  = data.aws_vpc.vpc_id.id
  subnets = data.aws_subnets.private_subnets.ids

  # INFO: (SWA-Standard) requires access logs be enabled.
  access_logs = {
    bucket = "swa-central-logging-${var.region}"
  }

  # INFO: Checkov recommends deletion protection be enabled
  enable_deletion_protection = var.alb_deletion_protection_enabled

  security_group_name = "alb-${module.ecs_labels_short.id}"
  # Security Group
  security_group_ingress_rules = {
    all_https_192 = {
      from_port   = 443
      to_port     = 443
      ip_protocol = "tcp"
      cidr_ipv4   = "192.168.0.0/16"
    }
    all_https_10 = {
      from_port   = 443
      to_port     = 443
      ip_protocol = "tcp"
      cidr_ipv4   = "10.0.0.0/8"
    }
    all_https_172 = {
      from_port   = 443
      to_port     = 443
      ip_protocol = "tcp"
      cidr_ipv4   = "172.16.0.0/12"
    }
    all_http_192 = {
      from_port   = 80
      to_port     = 80
      ip_protocol = "tcp"
      cidr_ipv4   = "192.168.0.0/16"
    }
    all_http_10 = {
      from_port   = 80
      to_port     = 80
      ip_protocol = "tcp"
      cidr_ipv4   = "10.0.0.0/8"
    }
    all_http_172 = {
      from_port   = 80
      to_port     = 80
      ip_protocol = "tcp"
      cidr_ipv4   = "172.16.0.0/12"
    }
  }

  security_group_egress_rules = {
    all = {
      ip_protocol = "-1"
      cidr_ipv4   = "0.0.0.0/0"
    }
  }

  # INFO: (SWA-Standard) requires listeners to be HTTPS
  listeners = {
    ex_http = {
      port     = 80
      protocol = "HTTP"

      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
    ex_https = {
      port       = 443
      protocol   = "HTTPS"
      ssl_policy = "ELBSecurityPolicy-TLS13-1-2-Res-2021-06"
      # INFO: Certificate is assumed to already be in the account
      certificate_arn = data.aws_acm_certificate.certificate.arn

      forward = {
        target_group_key = "ecs_tg"
      }
    }
  }

  # INFO: (SWA-Standard) requires target groups to be HTTPS
  #       Pipeline security tools may flag using HTTP to connect the ALB to your container.
  #       Check with security or your architect to ensure SWA standards are being met.
  target_groups = {
    ecs_tg = {
      backend_protocol                  = "HTTP" #INFO: CKV_AWS_378: "Ensure AWS Load Balancer doesn't use HTTP protocol"
      backend_port                      = 3001
      target_type                       = "ip"
      deregistration_delay              = 5
      load_balancing_cross_zone_enabled = true

      health_check = {
        enabled             = true
        healthy_threshold   = 5
        interval            = 30
        matcher             = "200"
        path                = "/Operations"
        port                = "traffic-port"
        protocol            = "HTTP"
        timeout             = 5
        unhealthy_threshold = 2
      }

      # Theres nothing to attach here in this definition. Instead,
      # ECS will attach the IPs of the tasks to this target group
      create_attachment = false
    }
  }
}

# Use existing Route 53 hosted zone
data "aws_route53_zone" "vpc_private_zone" {
  name         = var.private_zone_name
  private_zone = true
}
# Create record in existing hosted zone
resource "aws_route53_record" "backend_alb" {
  name    = "backend.${data.aws_route53_zone.vpc_private_zone.name}"
  type    = "A"
  zone_id = data.aws_route53_zone.vpc_private_zone.zone_id
  alias {
    name                   = module.alb.dns_name
    zone_id                = module.alb.zone_id
    evaluate_target_health = true
  }
}
