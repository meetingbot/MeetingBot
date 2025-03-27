provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
  default_tags {
    tags = {
      app-id      = var.app_name
      app-purpose = "Self-hosted meeting bot API"
      environment = terraform.workspace
      pii         = "yes"
    }
  }
}

data "aws_availability_zones" "available" {}

locals {
  name = "${var.app_name}-${terraform.workspace}"

  azs = slice(data.aws_availability_zones.available.names, 0, 3)

  current_commit_sha_short = substr(trimspace(file("../../.git/${trimspace(trimprefix(file("../../.git/HEAD"), "ref:"))}")), 0, 7)

  prod = terraform.workspace == "prod"
}

terraform {
  backend "s3" {
    encrypt = true
  }
}
