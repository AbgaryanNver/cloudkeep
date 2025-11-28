variable "environment" {
  description = "Environment name"
  type        = string
}

variable "user_pool_name" {
  description = "Cognito User Pool name"
  type        = string
}

variable "callback_urls" {
  description = "Callback URLs"
  type        = list(string)
}

variable "logout_urls" {
  description = "Logout URLs"
  type        = list(string)
}

variable "allowed_oauth_scopes" {
  description = "Allowed OAuth scopes"
  type        = list(string)
}