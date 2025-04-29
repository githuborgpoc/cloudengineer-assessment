provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "vpc" {
  cidr_block = var.vpc_cidr_block
}

resource "aws_subnet" "subnet" {
  vpc_id                  = aws_vpc.vpc.id
  cidr_block              = var.subnet_cidr_block
  availability_zone       = var.subnet_az
  map_public_ip_on_launch = true
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
    user-management-service = {
      cpu    = 4096
      memory = 8192
      assign_public_ip = true

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

      subnet_ids = [aws_subnet.subnet.id]
      security_group_ids = [aws_security_group.ecs_sg.id]
    }
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
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

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.vpc.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Route Table
resource "aws_route_table" "rtb" {
  vpc_id = aws_vpc.vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "${var.project_name}-route-table"
  }
}

# Route Table Association
resource "aws_route_table_association" "rtb_assoc" {
  subnet_id      = aws_subnet.subnet.id
  route_table_id = aws_route_table.rtb.id
}

resource "aws_security_group" "ecs_sg" {
  name        = "ecs_security_group"
  description = "Security group for ECS instances"
vpc_id      = aws_vpc.vpc.id
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr_block]
  }
  
    ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ecs_security_group"
  }
}
 