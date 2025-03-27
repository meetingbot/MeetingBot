variable "aws_profile" {
  type        = string
  description = "The AWS profile to use"
}

variable "aws_region" {
  type        = string
  description = "The AWS region to deploy resources"
  nullable    = true
}

variable "app_name" {
  type        = string
  description = "The name of the application"
}

variable "domain_name" {
  type        = string
  description = "The domain name to use for the website"
}

variable "auth_github_id" {
  type        = string
  description = "The GitHub ID for authentication"
  sensitive   = true
}

variable "auth_github_secret" {
  type        = string
  description = "The GitHub secret for authentication"
  sensitive   = true
}

variable "meet_bot_image_url" {
  type        = string
  description = "The Docker image to use for the Google Meet bot"
  default     = ""
}

variable "zoom_bot_image_url" {
  type        = string
  description = "The Docker image to use for the Zoom bot"
  default     = ""
}

variable "teams_bot_image_url" {
  type        = string
  description = "The Docker image to use for the Teams bot"
  default     = ""
}

variable "frontend_image_url" {
  type        = string
  description = "The Docker image to use for the frontend"
  default     = ""
}

variable "backend_image_url" {
  type        = string
  description = "The Docker image to use for the backend"
  default     = ""
}
