module "vpc" {
  version = "0.9.2"
  cidr_block_provider = {
    use_ipam_pool       = true
    ipv4_netmask_length = 24
  }
  context = module.root_labels.context

  public_subnets_provider = {
    new_bits = [8, 8]
  }

  private_subnets_provider = {
    new_bits = [2, 2]
  }

  data_subnets_provider = {
    new_bits = [2, 2]
  }

  enable_public_nat_gateway = true
  single_public_nat_gateway = true

  create_transit_gateway_attachments = true
}

module "vpc_endpoints" {
  source  = "terraform-aws-modules/vpc/aws//modules/vpc-endpoints"
  version = "5.16.0"

  vpc_id             = module.vpc.vpc_id
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  endpoints = {
    # Interface Endpoint
    execute_api = {
      service             = "execute-api"
      private_dns_enabled = true
      subnet_ids          = module.vpc.private_subnets
    },
  }

  tags = {
    Name = "${module.root_labels.department}-${module.root_labels.namespace}-${module.root_labels.environment}-api-gw-endpoints"
  }
}

# resource "aws_lb" "alb" {
#   name                       = "${module.root_labels.department}-${module.root_labels.namespace}-${module.root_labels.environment}-alb"
#   internal                   = true
#   load_balancer_type         = "application"
#   security_groups            = [aws_security_group.alb.id]
#   subnets                    = module.vpc.private_subnets
#   drop_invalid_header_fields = true
# }

# resource "aws_lb" "nlb" {
#   name               = "${module.root_labels.department}-${module.root_labels.namespace}-${module.root_labels.environment}-nlb"
#   internal           = true
#   load_balancer_type = "network"
#   subnets            = module.vpc.private_subnets

#   depends_on = [
#     aws_s3_bucket_policy.nlb_access_logs,
#     aws_s3_bucket_public_access_block.nlb_access_logs,
#     aws_s3_bucket_versioning.nlb_access_logs
#   ]

#   access_logs {
#     bucket  = aws_s3_bucket.nlb_access_logs.bucket
#     prefix  = "nlb-logs"
#     enabled = true
#   }

#   tags = var.tags
# }

# resource "aws_s3_bucket" "nlb_access_logs" {
#   bucket = "thd-${module.root_labels.department}-${module.root_labels.namespace}-${module.root_labels.environment}-aws-lb-nlb-access-logs-bucket"
# }
# resource "aws_s3_bucket_lifecycle_configuration" "nlb_access_logs" {
#   bucket = aws_s3_bucket.nlb_access_logs.id

#   rule {
#     id     = "delete_old_logs"
#     status = "Enabled"
#     filter {
#       prefix = "nlb-logs/"
#     }
#     expiration {
#       days = 90
#     }
#   }
# }

# resource "aws_s3_bucket_versioning" "nlb_access_logs" {
#   bucket = aws_s3_bucket.nlb_access_logs.id
#   versioning_configuration {
#     status = "Enabled"
#   }
# }


# resource "aws_s3_bucket_server_side_encryption_configuration" "nlb_access_logs" {
#   bucket = aws_s3_bucket.nlb_access_logs.id

#   rule {
#     apply_server_side_encryption_by_default {
#       kms_master_key_id = data.aws_kms_key.ddarke_kms_key.key_id
#       sse_algorithm     = "aws:kms"
#     }
#     bucket_key_enabled = true
#   }
# }

# resource "aws_s3_bucket_policy" "nlb_access_logs" {
#   bucket = aws_s3_bucket.nlb_access_logs.id

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Principal = {
#           AWS = "arn:aws:iam::127311923021:root"
#         }
#         Action   = "s3:PutObject"
#         Resource = "${aws_s3_bucket.nlb_access_logs.arn}/*"
#       },
#       {
#         Effect = "Allow"
#         Principal = {
#           AWS = "arn:aws:iam::127311923021:root"
#         }
#         Action   = "s3:GetBucketAcl"
#         Resource = aws_s3_bucket.nlb_access_logs.arn
#       }
#     ]
#   })
# }


# resource "aws_s3_bucket_public_access_block" "nlb_access_logs" {
#   bucket = aws_s3_bucket.nlb_access_logs.id

#   block_public_acls       = true
#   block_public_policy     = true
#   ignore_public_acls      = true
#   restrict_public_buckets = true
# }

# resource "aws_api_gateway_vpc_link" "this" {
#   name        = "${module.root_labels.department}-${module.root_labels.namespace}-${module.root_labels.environment}-vpc-link"
#   description = "VPC Link for API Gateway"
#   target_arns = [aws_lb.nlb.arn]
#   tags        = var.tags
# }

resource "aws_security_group" "vpc_endpoints" {
  name        = "${module.root_labels.department}-${module.root_labels.namespace}-${module.root_labels.environment}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = module.vpc.vpc_id

  #ingress from ddarke-Network/On-Prem networks
  ingress {
    description = "HTTPS access from ddarke-Network/On-Prem networks"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${module.root_labels.department}-${module.root_labels.namespace}-${module.root_labels.environment}-vpc-endpoints-sg"
    }
  )
}

# resource "aws_security_group" "alb" {
#   name        = "${module.root_labels.department}-${module.root_labels.namespace}-${module.root_labels.environment}-alb-sg"
#   description = "Security group for Application Load Balancer"
#   vpc_id      = module.vpc.vpc_id

#   ingress {
#     description = "HTTP access from private networks"
#     from_port   = 80
#     to_port     = 80
#     protocol    = "tcp"
#     cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
#   }

#   ingress {
#     description = "HTTPS access from private networks"
#     from_port   = 443
#     to_port     = 443
#     protocol    = "tcp"
#     cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
#   }

#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12"]
#   }

#   tags = merge(
#     var.tags,
#     {
#       Name = "${module.root_labels.department}-${module.root_labels.namespace}-${module.root_labels.environment}-alb-sg"
#     }
#   )
# }
