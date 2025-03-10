terraform {
  required_version = ">= 1.0.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "4.52.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5"
    }
  }
  backend s3 {
    bucket = "chitchaat-terraform-state"
    key    = "terraform.tfstate"
    region = "eu-west-3"
    encrypt = true
  }
}

provider "aws" {
  region     = var.aws_region
  default_tags {
    tags = {
      CreatedBy = "Terraform"
      Project   = "Chitchaat"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}








