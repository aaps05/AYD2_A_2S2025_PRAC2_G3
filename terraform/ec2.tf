# ─── Frontend ─────────────────────────────────────────────────────────────────
resource "aws_instance" "frontend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.frontend.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_ecr.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = { Name = "${var.project_name}-frontend" }
}

resource "aws_eip" "frontend" {
  instance = aws_instance.frontend.id
  domain   = "vpc"
  tags     = { Name = "${var.project_name}-frontend-eip" }
}

# ─── Medical Services ─────────────────────────────────────────────────────────
resource "aws_instance" "medical_services" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.medical_services.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_ecr.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = { Name = "${var.project_name}-medical-services" }
}

resource "aws_eip" "medical_services" {
  instance = aws_instance.medical_services.id
  domain   = "vpc"
  tags     = { Name = "${var.project_name}-medical-services-eip" }
}

# ─── Specialties ──────────────────────────────────────────────────────────────
resource "aws_instance" "specialties" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.specialties.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_ecr.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = { Name = "${var.project_name}-specialties" }
}

resource "aws_eip" "specialties" {
  instance = aws_instance.specialties.id
  domain   = "vpc"
  tags     = { Name = "${var.project_name}-specialties-eip" }
}
