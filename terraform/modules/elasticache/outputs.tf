output "cache_endpoint" {
  value = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "cache_port" {
  value = aws_elasticache_cluster.main.port
}