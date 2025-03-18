resource "aws_s3_bucket" "frontend_s3_bucket" {
  bucket = "chitchaat-frontend-source-code"
}

resource "aws_s3_bucket_website_configuration" "frontend_s3_bucket_website_configuration" {
  bucket = aws_s3_bucket.frontend_s3_bucket.id
  index_document {
    suffix = "index.html"
  }
  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "chitchaat_public_access" {
  bucket                  = aws_s3_bucket.frontend_s3_bucket.id
  block_public_acls       = false
  ignore_public_acls      = false
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend_s3_bucket_policy" {
  bucket = aws_s3_bucket.frontend_s3_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "CloudflareReadGetObject"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.frontend_s3_bucket.arn}/*"
      Condition = {
        IpAddress = {
          "aws:SourceIp" = [
            "173.245.48.0/20",
            "103.21.244.0/22",
            "103.22.200.0/22",
            "103.31.4.0/22",
            "141.101.64.0/18",
            "108.162.192.0/18",
            "190.93.240.0/20",
            "188.114.96.0/20",
            "197.234.240.0/22",
            "198.41.128.0/17",
            "162.158.0.0/15",
            "104.16.0.0/13",
            "104.24.0.0/14",
            "172.64.0.0/13",
            "131.0.72.0/22",
            "2400:cb00::/32",
            "2606:4700::/32",
            "2803:f800::/32",
            "2405:b500::/32",
            "2405:8100::/32",
            "2a06:98c0::/29",
            "2c0f:f248::/32",
            "92.184.118.70"
          ]
        }
      }
    }]
  })
  depends_on = [aws_s3_bucket_public_access_block.chitchaat_public_access]
}
