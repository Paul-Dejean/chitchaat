

# Security Group to allow HTTP traffic
resource "aws_security_group" "backend_security_group" {
  name        = "backend-instance-sg"
  description = "Allow HTTP traffic"
  vpc_id      = aws_vpc.chitchaat_vpc.id


  ingress {
    description      = "Allow HTTP"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description      = "Allow SSH"
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description      = "Allow UDP 10000-10100"
    from_port        = 10000
    to_port          = 10100
    protocol         = "udp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  ingress {
    description      = "Allow HTTPS"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

   egress {
    description = "Allow all outbound IPv4 traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
   egress {
    description      = "Allow all outbound IPv6 traffic"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    ipv6_cidr_blocks = ["::/0"]
  }
}



resource "aws_instance" "backend_ec2_instance" {

  ami             = "ami-0eaf62527f5bb8940"
  instance_type   = "t3.small"
  subnet_id       = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.backend_security_group.id]
  enable_primary_ipv6 = true
  ipv6_address_count = 1
  associate_public_ip_address= true
  iam_instance_profile   = aws_iam_instance_profile.backend_ec2_instance_profile.name


  tags = {
    Name = "chitchaat-backend"
  }

  user_data = <<-EOF
    #!/bin/bash
    # Update system packages
    dnf update -y

    # Install Docker using dnf (Amazon Linux 2023 does not support amazon-linux-extras)
    dnf install -y docker

    # Start and enable the Docker service
    systemctl start docker
    systemctl enable docker

    # Add the ec2-user to the docker group so Docker commands can be run without sudo
    usermod -aG docker ec2-user
  EOF
}


resource "aws_ecr_repository" "chitchaat_ecr_repository" {
  name = "chitchaat"
  image_tag_mutability = "MUTABLE"
}


# Create the IAM role for EC2
resource "aws_iam_role" "backend_ec2_instance_role" {
  name = "backend-ec2-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

# Attach AmazonSSMManagedInstanceCore policy
resource "aws_iam_role_policy_attachment" "ssm_managed" {
  role       = aws_iam_role.backend_ec2_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Attach AmazonEC2ContainerRegistryReadOnly policy
resource "aws_iam_role_policy_attachment" "ecr_read_only" {
  role       = aws_iam_role.backend_ec2_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "backend_ec2_instance_profile" {
  name = "backend-ec2-instance-profile"
  role = aws_iam_role.backend_ec2_instance_role.name
}

