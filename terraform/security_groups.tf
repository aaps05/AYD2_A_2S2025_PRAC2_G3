# ─── ALB ──────────────────────────────────────────────────────────────────────
resource "aws_security_group" "alb" {
  name   = "${var.project_name}-alb-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-alb-sg" }
}

# ─── Frontend EC2 ─────────────────────────────────────────────────────────────
resource "aws_security_group" "frontend" {
  name   = "${var.project_name}-frontend-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "SSH for Ansible"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-frontend-sg" }
}

# ─── Medical Services EC2 ─────────────────────────────────────────────────────
resource "aws_security_group" "medical_services" {
  name   = "${var.project_name}-medical-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    description     = "API from frontend nginx"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend.id]
  }

  ingress {
    description = "SSH for Ansible"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-medical-sg" }
}

# ─── Specialties EC2 ──────────────────────────────────────────────────────────
resource "aws_security_group" "specialties" {
  name   = "${var.project_name}-specialties-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    description     = "API from frontend nginx"
    from_port       = 3002
    to_port         = 3002
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend.id]
  }

  ingress {
    description = "SSH for Ansible"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-specialties-sg" }
}

# ─── RDS Medical Services ─────────────────────────────────────────────────────
resource "aws_security_group" "rds_medical" {
  name   = "${var.project_name}-rds-medical-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from medical-services EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.medical_services.id]
  }

  tags = { Name = "${var.project_name}-rds-medical-sg" }
}

# ─── RDS Specialties ──────────────────────────────────────────────────────────
resource "aws_security_group" "rds_specialties" {
  name   = "${var.project_name}-rds-specialties-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from specialties EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.specialties.id]
  }

  tags = { Name = "${var.project_name}-rds-specialties-sg" }
}
