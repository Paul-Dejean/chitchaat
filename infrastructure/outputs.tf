output "instance_public_ipv4" {
  description = "Public IP of the EC2 instance that runs the backend"
  value       = aws_instance.backend_ec2_instance.public_ip
}

output "instance_public_ipv6" {
  description = "Public IP of the EC2 instance that runs the backend"
  value       = aws_instance.backend_ec2_instance.ipv6_addresses[0]
}

output "instance_id" {
    description = "ID of the EC2 instance that runs the backend"
    value       = aws_instance.backend_ec2_instance.id
}
