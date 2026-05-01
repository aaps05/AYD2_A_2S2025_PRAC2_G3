resource "aws_ecr_repository" "frontend" {
  name                 = "${var.project_name}-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
  tags                 = { Name = "${var.project_name}-frontend-ecr" }
}

resource "aws_ecr_repository" "medical_services" {
  name                 = "${var.project_name}-medical-services"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
  tags                 = { Name = "${var.project_name}-medical-services-ecr" }
}

resource "aws_ecr_repository" "specialties" {
  name                 = "${var.project_name}-specialties"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
  tags                 = { Name = "${var.project_name}-specialties-ecr" }
}
