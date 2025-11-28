output "files_bucket_name" {
  value = aws_s3_bucket.files.id
}

output "files_bucket_arn" {
  value = aws_s3_bucket.files.arn
}