# API Gateway will be created via Serverless Framework
# This module configures the authorizer and basic settings

resource "aws_api_gateway_rest_api" "main" {
  name        = var.api_name
  description = "CloudKeep API Gateway"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_authorizer" "cognito" {
  name          = "cognito-authorizer"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [var.user_pool_arn]
}

# API Gateway deployment will be handled by Serverless Framework