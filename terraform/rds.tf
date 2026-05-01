resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  tags       = { Name = "${var.project_name}-db-subnet-group" }
}

# ─── Medical Services DB ──────────────────────────────────────────────────────
resource "aws_db_instance" "medical_services" {
  identifier          = "${var.project_name}-medical-db"
  engine              = "postgres"
  engine_version      = "15.7"
  instance_class      = var.db_instance_class
  allocated_storage   = 20
  storage_type        = "gp2"

  db_name  = "medical_services"
  username = "postgres"
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_medical.id]

  publicly_accessible       = false
  skip_final_snapshot       = true
  deletion_protection       = false
  backup_retention_period   = 0
  auto_minor_version_upgrade = false

  tags = { Name = "${var.project_name}-medical-db" }
}

# ─── Specialties DB ───────────────────────────────────────────────────────────
resource "aws_db_instance" "specialties" {
  identifier          = "${var.project_name}-specialties-db"
  engine              = "postgres"
  engine_version      = "15.7"
  instance_class      = var.db_instance_class
  allocated_storage   = 20
  storage_type        = "gp2"

  db_name  = "specialties"
  username = "postgres"
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_specialties.id]

  publicly_accessible       = false
  skip_final_snapshot       = true
  deletion_protection       = false
  backup_retention_period   = 0
  auto_minor_version_upgrade = false

  tags = { Name = "${var.project_name}-specialties-db" }
}
