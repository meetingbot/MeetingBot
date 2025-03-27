# ---------------------------------------------------------------------------------------------------------------------
# ECS Cluster Configuration
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_ecs_cluster" "this" {
  name = local.name

  setting {
    name  = "containerInsights"
    value = "enhanced"
  }
}

resource "aws_ecs_cluster_capacity_providers" "this" {
  cluster_name       = aws_ecs_cluster.this.name
  capacity_providers = ["FARGATE"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# IAM Roles and Policies
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${local.name}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "backend_role" {
  name = "${local.name}-backend-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# Attach S3 access policy to backend role
resource "aws_iam_role_policy_attachment" "backend_s3_policy" {
  role       = aws_iam_role.backend_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

# Attach ECS access policy to backend role
resource "aws_iam_role_policy_attachment" "backend_ecs_policy" {
  role       = aws_iam_role.backend_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonECS_FullAccess"
}

resource "aws_iam_role" "bot_role" {
  name = "${local.name}-bot-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# Attach S3 access policy to bot role
resource "aws_iam_role_policy_attachment" "bot_s3_policy" {
  role       = aws_iam_role.bot_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

# ---------------------------------------------------------------------------------------------------------------------
# Common Configuration
# ---------------------------------------------------------------------------------------------------------------------
locals {
  frontend_port = 3000
  backend_port  = 3001
}

resource "random_password" "auth_secret" {
  length  = 32
  special = false
}

# ---------------------------------------------------------------------------------------------------------------------
# CloudWatch Log Groups
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${local.name}/frontend"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${local.name}/backend"
  retention_in_days = 14
}

# ---------------------------------------------------------------------------------------------------------------------
# Frontend Service
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${local.name}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "frontend"
      image     = var.frontend_image_url != "" ? var.frontend_image_url : "ghcr.io/meetingbot/frontend:sha-${local.current_commit_sha_short}"
      essential = true
      portMappings = [
        {
          containerPort = local.frontend_port
          hostPort      = local.frontend_port
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "frontend"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "frontend" {
  name            = "${local.name}-frontend"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = local.frontend_port
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# Backend Service
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.backend_role.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = var.backend_image_url != "" ? var.backend_image_url : "ghcr.io/meetingbot/backend:sha-${local.current_commit_sha_short}"
      essential = true
      portMappings = [
        {
          containerPort = local.backend_port
          hostPort      = local.backend_port
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "PORT"
          value = tostring(local.backend_port)
        },
        {
          name  = "DATABASE_URL"
          value = "postgres://${aws_db_instance.this.username}:${random_password.db_password.result}@${aws_db_instance.this.endpoint}/${aws_db_instance.this.db_name}"
        },
        {
          name  = "AUTH_TRUST_HOST"
          value = "true"
        },
        {
          name  = "AUTH_SECRET"
          value = random_password.auth_secret.result
        },
        {
          name  = "FRONTEND_URL"
          value = "http://${var.domain_name}"
        },
        {
          name  = "AUTH_GITHUB_ID"
          value = var.auth_github_id
        },
        {
          name  = "AUTH_GITHUB_SECRET"
          value = var.auth_github_secret
        },
        {
          name  = "ECS_CLUSTER_NAME"
          value = aws_ecs_cluster.this.name
        },
        {
          name  = "ECS_TASK_DEFINITION_MEET"
          value = aws_ecs_task_definition.meet_bot.family
        },
        {
          name  = "ECS_TASK_DEFINITION_TEAMS"
          value = aws_ecs_task_definition.teams_bot.family
        },
        {
          name  = "ECS_TASK_DEFINITION_ZOOM"
          value = aws_ecs_task_definition.zoom_bot.family
        },
        {
          name  = "ECS_SUBNETS"
          value = join(",", aws_subnet.private[*].id)
        },
        {
          name  = "ECS_SECURITY_GROUPS"
          value = join(",", [aws_security_group.ecs_tasks.id])
        },
        {
          name  = "AWS_BUCKET_NAME"
          value = aws_s3_bucket.this.bucket
        },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "backend" {
  name            = "${local.name}-backend"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = local.backend_port
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# Security Groups
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_security_group" "ecs_tasks" {
  name        = "${local.name}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.this.id

  tags = {
    Name = "${local.name}-ecs-tasks-sg"
  }
}

# Allow inbound access from the Frontend ALB
resource "aws_security_group_rule" "ecs_inbound_from_frontend_alb" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.frontend_alb.id
  security_group_id        = aws_security_group.ecs_tasks.id
  description              = "Allow inbound traffic from Frontend ALB"
}

# Allow all outbound traffic
resource "aws_security_group_rule" "ecs_all_outbound" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ecs_tasks.id
  description       = "Allow all outbound traffic"
}

# One-off Tasks (bots)
resource "aws_ecs_task_definition" "meet_bot" {
  family                   = "${local.name}-meet-bot"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 4096
  memory                   = 16384
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.bot_role.arn

  container_definitions = jsonencode([
    {
      name      = "bot"
      image     = var.meet_bot_image_url != "" ? var.meet_bot_image_url : "ghcr.io/meetingbot/bots/meet:sha-${local.current_commit_sha_short}"
      essential = true
      environment = [
        {
          name  = "BACKEND_URL"
          value = "https://${var.domain_name}/api/trpc"
        },
        {
          name  = "AWS_BUCKET_NAME"
          value = aws_s3_bucket.this.bucket
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
      ]
      readonlyRootFilesystem = false

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "zoom_bot" {
  family                   = "${local.name}-zoom-bot"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 4096
  memory                   = 16384
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.bot_role.arn

  container_definitions = jsonencode([
    {
      name      = "bot"
      image     = var.zoom_bot_image_url != "" ? var.zoom_bot_image_url : "ghcr.io/meetingbot/bots/zoom:sha-${local.current_commit_sha_short}"
      essential = true
      environment = [
        {
          name  = "BACKEND_URL"
          value = "https://${var.domain_name}/api/trpc"
        },
        {
          name  = "AWS_BUCKET_NAME"
          value = aws_s3_bucket.this.bucket
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
      ]
      readonlyRootFilesystem = false

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "teams_bot" {
  family                   = "${local.name}-teams-bot"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 4096
  memory                   = 16384
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.bot_role.arn

  container_definitions = jsonencode([
    {
      name      = "bot"
      image     = var.teams_bot_image_url != "" ? var.teams_bot_image_url : "ghcr.io/meetingbot/bots/teams:sha-${local.current_commit_sha_short}"
      essential = true
      environment = [
        {
          name  = "BACKEND_URL"
          value = "https://${var.domain_name}/api/trpc"
        },
        {
          name  = "AWS_BUCKET_NAME"
          value = aws_s3_bucket.this.bucket
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
      ]
      readonlyRootFilesystem = false

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])
}
