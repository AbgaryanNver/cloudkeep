# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "cloudkeep-alb-${var.environment}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from anywhere"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "cloudkeep-alb-sg-${var.environment}"
  }
}

# Lambda Security Group
resource "aws_security_group" "lambda" {
  name_prefix = "cloudkeep-lambda-${var.environment}-"
  description = "Security group for Lambda functions"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "cloudkeep-lambda-sg-${var.environment}"
  }
}

# ElastiCache Security Group
resource "aws_security_group" "elasticache" {
  name_prefix = "cloudkeep-elasticache-${var.environment}-"
  description = "Security group for ElastiCache"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "Redis from Lambda"
  }

  tags = {
    Name = "cloudkeep-elasticache-sg-${var.environment}"
  }
}