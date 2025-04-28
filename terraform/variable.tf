variable "aws_region" {
  description = "AWS Region"
  default     = "us-east-2"
}

variable "vpc_cidr_block" {
  description = "CIDR block for VPC"
  default     = "10.0.0.0/16"
}

variable "subnet_cidr_block" {
  description = "CIDR block for Subnet"
  default     = "10.0.1.0/24"
}

variable "subnet_az" {
  description = "Availability Zone for Subnet"
  default     = "us-east-2a"
}

variable "ecs_cluster_name" {
  description = "Name of ECS Cluster"
  default     = "linksapp-cluster"
}

variable "cloudwatch_log_group" {
  description = "CloudWatch Log Group for ECS Exec"
  default     = "/aws/ecs/linksapp-cluster"
}

variable "webapp_image" {
  description = "Docker image for the Webapp container"
  default     = "node:latest"
}

variable "environment" {
  description = "Deployment Environment"
  default     = "Development"
}

variable "project_name" {
  description = "Name of the project"
  default     = "LinksApp"
}

variable "repository_names" {
  type    = list(string)
  default = ["webapp", "db", "redis", "nginx"]
}