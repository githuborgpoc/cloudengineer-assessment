provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "this" {
  cidr_block = var.vpc_cidr_block
}

# Subnet
resource "aws_subnet" "this" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.subnet_cidr_block
  availability_zone       = var.subnet_az
  map_public_ip_on_launch = true
}

# Security Group
resource "aws_security_group" "this" {
  vpc_id = aws_vpc.this.id

  ingress {
    description = "Allow HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow MySQL"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow Redis"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# IAM Roles
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role" "ecs_task_role" {
  name = "ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy_attachment" "ecs_task_execution_policy" {
  name       = "ecs-task-execution-policy-attachment"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  roles      = [aws_iam_role.ecs_task_execution_role.name]
}

resource "aws_iam_policy_attachment" "ecs_task_role_policy" {
  name       = "ecs-task-role-policy-attachment"
  policy_arn = aws_iam_policy.ecs_task_policy.arn
  roles      = [aws_iam_role.ecs_task_role.name]
}

module "ecs" {
  source = "terraform-aws-modules/ecs/aws"

  cluster_name = var.ecs_cluster_name

  cluster_configuration = {
    execute_command_configuration = {
      logging = "OVERRIDE"
      log_configuration = {
        cloud_watch_log_group_name = var.cloudwatch_log_group
      }
    }
  }

  fargate_capacity_providers = {
    FARGATE = {
      default_capacity_provider_strategy = {
        weight = 50
      }
    }
    FARGATE_SPOT = {
      default_capacity_provider_strategy = {
        weight = 50
      }
    }
  }

  services = {
    linksweb-service = {
      cpu    = 4096
      memory = 8192

      container_definitions = {
        webapp = {
          cpu    = 1024
          memory = 2048
          image  = var.webapp_image
          essential = true
          port_mappings = [
            {
              name          = "webapp"
              containerPort = 4000
              protocol      = "tcp"
            }
          ]
          environment = [
            { name = "NODE_ENV", value = "development" },
            { name = "DATABASE_HOST", value = "db" },
            { name = "DATABASE_USER", value = "fazt" },
            { name = "DATABASE_PASSWORD", value = "mypassword" },
            { name = "DATABASE_NAME", value = "linksdb" },
            { name = "REDIS_HOST", value = "redis" }
          ]
        }

        db = {
          cpu    = 1024
          memory = 2048
          image  = "mysql:8.0"
          essential = true
          port_mappings = [
            {
              containerPort = 3306
              protocol      = "tcp"
            }
          ]
          environment = [
            { name = "MYSQL_DATABASE", value = "linksdb" },
            { name = "MYSQL_USER", value = "fazt" },
            { name = "MYSQL_PASSWORD", value = "mypassword" },
            { name = "MYSQL_ROOT_PASSWORD", value = "mypassword" }
          ]
        }

        redis = {
          cpu    = 1024
          memory = 2048
          image  = "redis/redis-stack"
          essential = true
          port_mappings = [
            {
              containerPort = 6379
              protocol      = "tcp"
            }
          ]
        }

        nginx = {
          cpu    = 1024
          memory = 2048
          image  = "nginx:latest"
          essential = true
          port_mappings = [
            {
              containerPort = 80
              protocol      = "tcp"
            }
          ]
        }
      }

      subnet_ids = [aws_subnet.this.id]
      security_group_rules = {
        app_ingress_http = {
          type                     = "ingress"
          from_port                = 80
          to_port                  = 80
          protocol                 = "tcp"
          source_security_group_id = aws_security_group.this.id
        }
        egress_all = {
          type        = "egress"
          from_port   = 0
          to_port     = 0
          protocol    = "-1"
          cidr_blocks = ["0.0.0.0/0"]
        }
      }
    }
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_policy" "ecs_task_policy" {
  name        = "AmazonEC2ContainerServiceRole"
  description = "Policy similar to AWS managed AmazonEC2ContainerServiceRole"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:Describe*",
          "elasticloadbalancing:DeregisterInstancesFromLoadBalancer",
          "elasticloadbalancing:DeregisterTargets",
          "elasticloadbalancing:Describe*",
          "elasticloadbalancing:RegisterInstancesWithLoadBalancer",
          "elasticloadbalancing:RegisterTargets",
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "ecs_task_policy_attachment" {
  name       = "ecs-task-policy-attachment"
  policy_arn = aws_iam_policy.ecs_task_policy.arn
  roles      = [aws_iam_role.ecs_task_role.name]
}

resource "aws_ecr_repository" "repos" {
  for_each            = toset(var.repository_names)
  name                = each.value
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = each.value
  }
}
