output "api_id" {
  value = aws_api_gateway_rest_api.main.id
}

output "api_url" {
  value = aws_api_gateway_rest_api.main.execution_arn
}

output "authorizer_id" {
  value = aws_api_gateway_authorizer.cognito.id
}