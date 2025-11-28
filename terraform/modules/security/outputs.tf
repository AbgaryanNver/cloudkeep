output "alb_sg_id" {
  value = aws_security_group.alb.id
}

output "lambda_sg_id" {
  value = aws_security_group.lambda.id
}

output "elasticache_sg_id" {
  value = aws_security_group.elasticache.id
}