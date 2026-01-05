# Documentation: https://registry.terraform.io/modules/terraform-aws-modules/ecs/aws/latest/submodules/cluster
# trivy:ignore:AVD-AWS-0057 "HIGH: IAM policy document uses sensitive action"
module "ecs_cluster" {
  #checkov:skip=CKV_AWS_356, not configurable in the module
  source  = "terraform-aws-modules/ecs/aws//modules/cluster"
  version = "~> 6.4.0"
  create  = module.ecs_labels.enabled
  # create_task_exec_iam_role = false
  create_task_exec_policy = false
  # INFO: Trivy Security - avd-aws-0057
  task_exec_ssm_param_arns = [
    "arn:aws:ssm:${var.region}:${local.account_id}:parameter/${module.ecs_labels.id}/*"
  ]
  task_exec_secret_arns = [
    "arn:aws:secretsmanager:${var.region}:${local.account_id}:secret/${module.ecs_labels.id}/*"
  ]


  name = module.ecs_labels.id

  setting                                = [{ "name" : "containerInsights", "value" : var.container_insights_enabled }]
  cloudwatch_log_group_retention_in_days = var.cluster_log_retention
  cloudwatch_log_group_kms_key_id        = data.aws_kms_key.swa_kms_key.arn
  # TODO: See if these capacity providers are working
  default_capacity_provider_strategy = {
    FARGATE = {
      weight = 0
    }
    FARGATE_SPOT = {
      weight = 100
    }
  }
}

# INFO: Task Execution Role is used when starting the task. Once Running, the Task Role is used.
# .     Use this role for things only needed to start the task.
# .     i.e. Secrets Manager or SSM Parameters configured in the `environments` section of your Task Definition.
# Documentation: https://registry.terraform.io/modules/terraform-aws-modules/iam/aws/latest
module "ecs_task_execution_role" {
  source                        = "terraform-aws-modules/iam/aws//modules/iam-assumable-role"
  version                       = "~> 5.60.0"
  role_path                     = "/ccp-next/ecs/"
  role_permissions_boundary_arn = "arn:aws:iam::${local.account_id}:policy/swa/SWACSPermissionsBoundary"

  create_role       = true
  role_name         = "${module.ecs_labels_short.id}-ecs-task-execution-role"
  role_requires_mfa = false

  trusted_role_services = ["ecs-tasks.amazonaws.com"]

  custom_role_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    aws_iam_policy.policy.arn
  ]

  tags = module.ecs_labels_short.tags
}

# INFO: Task Role is used by the running task after startup.
module "ecs_task_role" {
  source                        = "terraform-aws-modules/iam/aws//modules/iam-assumable-role"
  version                       = "~> 5.60.0"
  role_path                     = "/ccp-next/ecs/"
  role_permissions_boundary_arn = "arn:aws:iam::${local.account_id}:policy/swa/SWACSPermissionsBoundary"

  create_role       = true
  role_name         = "${module.ecs_labels.id}-ecs-task-role"
  role_requires_mfa = false

  trusted_role_services = ["ecs-tasks.amazonaws.com"]

  custom_role_policy_arns = [
    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
    aws_iam_policy.policy.arn
  ]

  tags = module.ecs_labels.tags
}

# Documentation: https://registry.terraform.io/modules/terraform-aws-modules/ecs/aws/latest/submodules/service
# trivy:ignore:AVD-AWS-0104 "CRITICAL: Security group rule allows egress to multiple public internet addresses."
# trivy:ignore:AVD-AWS-0057 "HIGH: IAM policy document uses sensitive action"
module "ecs_service" {
  #checkov:skip=CKV_AWS_356, not configurable in the module
  source      = "terraform-aws-modules/ecs/aws//modules/service"
  version     = "~> 6.4.0"
  name        = module.ecs_labels_short.id
  family      = module.ecs_labels.id
  cluster_arn = module.ecs_cluster.arn
  tags        = module.ecs_labels.tags

  cpu                    = var.task_cpu
  memory                 = var.task_memory
  enable_execute_command = true

  autoscaling_min_capacity = var.autoscaling_min_capacity
  autoscaling_max_capacity = var.autoscaling_max_capacity


  # INFO: Scheduled Action for cost savings in lower environments.
  autoscaling_scheduled_actions = local.sleep_wake_enabled ? {
    nighttime-shutdown = {
      schedule     = var.sleep_schedule
      min_capacity = 0
      max_capacity = 0
    }
    morning-startup = {
      schedule     = var.wake_schedule
      min_capacity = 1
      max_capacity = 1
    }
  } : {}

  # Deployment config
  force_new_deployment       = false
  triggers                   = { time = plantimestamp() } # Use Redeploy service on every Applydeployment_minimum_healthy_percent = 50
  deployment_maximum_percent = 200
  wait_for_steady_state      = false

  load_balancer = {
    service = {
      target_group_arn = module.alb.target_groups["ecs_tg"].arn
      container_name   = module.ecs_labels.id
      container_port   = 3001
    }
  }

  deployment_circuit_breaker = {
    enable   = true
    rollback = true
  }

  timeouts = {
    create  = "5m"
    update  = "5m"
    destroy = "5m"
  }

  # INFO: Scopes the Task Execution Role to only have access to SSM Params/Secrets in the Service's Namespace
  task_exec_ssm_param_arns = [
    "arn:aws:ssm:${var.region}:${local.account_id}:parameter/${module.ecs_labels.id}/*"
  ]
  task_exec_secret_arns = [
    "arn:aws:secretsmanager:${var.region}:${local.account_id}:secret/${module.ecs_labels.id}/*"
  ]
  create_iam_role           = false
  create_task_exec_iam_role = false
  create_tasks_iam_role     = false
  task_exec_iam_role_arn    = module.ecs_task_execution_role.iam_role_arn
  tasks_iam_role_arn        = module.ecs_task_role.iam_role_arn

  container_definitions = {
    (module.ecs_labels.id) = {
      cpu       = var.container_cpu
      memory    = var.container_memory
      essential = true
      image     = var.container_image

      portMappings = [
        {
          name          = "ecs_http"
          containerPort = 3001
          protocol      = "tcp"
        }
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3001/Operations || exit 1"]
        interval    = 30
        timeout     = 6
        retries     = 5
        startPeriod = 30
      }

      dependencies                           = []
      readonlyRootFilesystem                 = false
      cloudwatch_log_group_kms_key_id        = data.aws_kms_key.swa_kms_key.arn
      cloudwatch_log_group_retention_in_days = 365

      // environment = [] //In case this is needed at another time else

      secrets = [
        {
          name      = "THD_DB_PASS"
          valueFrom = "${local.secret_manager_arn}:${var.thd_secret_name}:DB_PASS::"
        },
        {
          name      = "THD_DB_NAME"
          valueFrom = "${local.secret_manager_arn}:${var.thd_secret_name}:DB_NAME::"
        },
        {
          name      = "THD_DB_PORT"
          valueFrom = "${local.secret_manager_arn}:${var.thd_secret_name}:DB_PORT::"
        },
        {
          name      = "THD_DB_USER"
          valueFrom = "${local.secret_manager_arn}:${var.thd_secret_name}:DB_USER::"
        },
        {
          name      = "THD_DB_ENDPOINT"
          valueFrom = "${local.secret_manager_arn}:${var.thd_secret_name}:DB_ENDPOINT::"
        },
        {
          name      = "DASH_DB_PASS"
          valueFrom = "${local.secret_manager_arn}:${var.dash_secret_name}:DB_PASS::"
        },
        {
          name      = "DASH_DB_NAME"
          valueFrom = "${local.secret_manager_arn}:${var.dash_secret_name}:DB_NAME::"
        },
        {
          name      = "DASH_DB_PORT"
          valueFrom = "${local.secret_manager_arn}:${var.dash_secret_name}:DB_PORT::"
        },
        {
          name      = "DASH_DB_USER"
          valueFrom = "${local.secret_manager_arn}:${var.dash_secret_name}:DB_USER::"
        },
        {
          name      = "DASH_DB_ENDPOINT"
          valueFrom = "${local.secret_manager_arn}:${var.dash_secret_name}:DB_ENDPOINT::"
        },
        {
          name      = "appDAuthHeader"
          valueFrom = "${local.secret_manager_arn}:${var.backend_secret_name}:appDAuthHeader::"
        }
      ]
    }
  }

  subnet_ids = data.aws_subnets.private_subnets.ids
  # REPLACE VPC ID WITH TERRAFORM LOOKUP
  security_group_egress_rules = {
    egress = {
      description = "Block Egress"
      from_port   = 443
      to_port     = 443
      ip_protocol = "tcp"
      cidr_ipv4   = "0.0.0.0/0"
    }
  }

  security_group_ingress_rules = {
    ingress = {
      description                  = "Allow ingress from ALB"
      from_port                    = 3001
      to_port                      = 3001
      ip_protocol                  = "tcp"
      referenced_security_group_id = try(module.alb.security_group_id, null)

    }
  }

  volume = {
    ecs_config = {
      name = "ecs_config"
    }
  }
}

# Retrieve VPC ID from the AWS account
data "aws_vpc" "vpc_id" {
  filter {
    name   = "tag:Name"
    values = [var.vpc_tag_name]
  }
}

data "aws_subnets" "private_subnets" {
  filter {
    name   = "tag:SubnetType"
    values = ["private"]
  }
}

resource "aws_iam_policy" "policy" {
  name        = "backend_policy"
  path        = "/"
  description = "My backend test policy"

  # Terraform's "jsonencode" function converts a
  # Terraform expression result to valid JSON syntax.
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:ListSecrets",
        ]
        Effect = "Allow"
        Resource = [
          "arn:aws:secretsmanager:us-east-1:848685496612:secret:thd-db/*",
          "arn:aws:secretsmanager:us-east-1:848685496612:secret:dash-db/*",
          "arn:aws:secretsmanager:us-east-1:848685496612:secret:thd-backend/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject"
        ]
        Resource = [
          "arn:aws:s3:::*",
          "arn:aws:s3:::*/*"
        ]
      }
    ]
  })
}


# ECR policy for pulling container images
# resource "aws_iam_policy" "ecr_policy" {
#   name        = "${module.ecs_labels_short.id}-ecr-policy"
#   path        = "/ccp-next/ecs/"
#   description = "Policy for ECS task execution role to pull images from ECR"

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = [
#           "ecr:GetAuthorizationToken",
#           "ecr:BatchCheckLayerAvailability",
#           "ecr:GetDownloadUrlForLayer",
#           "ecr:BatchGetImage"
#         ]
#         Resource = "*"
#       }
#     ]
#   })
# }
