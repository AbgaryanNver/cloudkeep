environment = "dev"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr            = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

# Cognito Configuration
cognito_callback_urls = ["http://localhost:3000/callback", "https://dev.cloudkeep.example.com/callback"]
cognito_logout_urls   = ["http://localhost:3000", "https://dev.cloudkeep.example.com"]

# ElastiCache Configuration
elasticache_node_type  = "cache.t3.micro"
elasticache_num_nodes  = 1

# ACM Certificate ARN (leave empty to use HTTP only)
acm_certificate_arn = ""