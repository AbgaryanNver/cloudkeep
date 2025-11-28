output "lambda_role_arn" {
  value = aws_iam_role.lambda.arn
}

output "lambda_functions" {
  value = {
    role_arn = aws_iam_role.lambda.arn
  }
}