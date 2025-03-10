resource "cloudflare_record" "backend_ipv4_dns_record" {
  zone_id = var.cloudflare_zone_id
  name    = "chitchaat-backend"
  content = aws_instance.backend_ec2_instance.public_ip
  type    = "A"
  ttl     = 1
  proxied = true
}

resource "cloudflare_record" "backend_ipv6_dns_record" {
  zone_id = var.cloudflare_zone_id
  name    = "chitchaat-backend"
  content = aws_instance.backend_ec2_instance.ipv6_addresses[0]
  type    = "AAAA"
  ttl     = 1
  proxied= true
}

resource "cloudflare_record" "frontend_dns_record" {
  zone_id = var.cloudflare_zone_id
  name    = "chitchaat"
  type    = "CNAME"
  ttl     = 1
  content = aws_s3_bucket_website_configuration.frontend_s3_bucket_website_configuration.website_endpoint
  proxied = true
}

resource "cloudflare_cloud_connector_rules" "frontend_cloud_connector_rules" {
  zone_id = var.cloudflare_zone_id

  rules {
    description = "Route frontend queries to AWS bucket"
    enabled     = true
    expression  = "(http.host eq \"${var.frontend_domain_name}\")"
    provider    = "aws_s3"
    parameters  {
      host = aws_s3_bucket_website_configuration.frontend_s3_bucket_website_configuration.website_endpoint
    }
  }


}
