terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "cloudkeep-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "CloudKeep"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# Security Groups Module
module "security" {
  source = "./modules/security"

  environment = var.environment
  vpc_id      = module.vpc.vpc_id
}

# Cognito Module
module "cognito" {
  source = "./modules/cognito"

  environment           = var.environment
  user_pool_name        = "${var.project_name}-users-${var.environment}"
  callback_urls         = var.cognito_callback_urls
  logout_urls           = var.cognito_logout_urls
  allowed_oauth_scopes  = ["email", "openid", "profile"]
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  environment   = var.environment
  bucket_prefix = var.project_name
}

# DynamoDB Module
module "dynamodb" {
  source = "./modules/dynamodb"

  environment = var.environment
  table_name  = "${var.project_name}-metadata-${var.environment}"
}

# ElastiCache Module
module "elasticache" {
  source = "./modules/elasticache"

  environment             = var.environment
  cluster_id              = "${var.project_name}-cache-${var.environment}"
  subnet_ids              = module.vpc.private_subnet_ids
  security_group_ids      = [module.security.elasticache_sg_id]
  node_type               = var.elasticache_node_type
  num_cache_nodes         = var.elasticache_num_nodes
}

# Lambda Module
module "lambda" {
  source = "./modules/lambda"

  environment         = var.environment
  subnet_ids          = module.vpc.private_subnet_ids
  security_group_ids  = [module.security.lambda_sg_id]
  s3_bucket_name      = module.s3.files_bucket_name
  dynamodb_table_name = module.dynamodb.table_name
  user_pool_arn       = module.cognito.user_pool_arn
  elasticache_endpoint = module.elasticache.cache_endpoint
}

# API Gateway Module
module "api_gateway" {
  source = "./modules/api-gateway"

  environment       = var.environment
  lambda_functions  = module.lambda.lambda_functions
  user_pool_arn     = module.cognito.user_pool_arn
  api_name          = "${var.project_name}-api-${var.environment}"
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  security_group_ids = [module.security.alb_sg_id]
  certificate_arn    = var.acm_certificate_arn
}