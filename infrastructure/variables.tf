variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
  type        = string
}


# variable "key_name" {
#   description = "AWS key pair name for EC2 instance"
# }

# variable "public_key" {
#   description = "Public key for the key pair"
# }

variable "cloudflare_api_token" {
  description = "Api token for mananing dns records on cloudflare"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Zone id of your domain on cloudflare"
  type        = string
}

variable "frontend_domain_name" {
  description = "domain name where your frontend is accessible"
  type        = string
}


