# Create a VPC
resource "aws_vpc" "chitchaat_vpc" {
  cidr_block = "10.0.0.0/16"
  assign_generated_ipv6_cidr_block = true
  tags = {
    Name = "chitchaat-vpc"
  }
}

# Create a public subnet
data "aws_availability_zones" "available" {}

resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.chitchaat_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]
  assign_ipv6_address_on_creation = true
  ipv6_cidr_block                = cidrsubnet(aws_vpc.chitchaat_vpc.ipv6_cidr_block, 8, 0)
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.chitchaat_vpc.id
}

# Route Table and Route for Internet access
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.chitchaat_vpc.id
}

resource "aws_route" "ipv4_internet_access" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route" "ipv6_internet_access" {
  route_table_id                = aws_route_table.public.id
  destination_ipv6_cidr_block   = "::/0"
  gateway_id                    = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
