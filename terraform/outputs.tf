output "alb_dns_name" {
  description = "Public URL of the application (via Load Balancer)"
  value       = "http://${aws_lb.main.dns_name}"
}

output "frontend_eip" {
  description = "Elastic IP of the frontend EC2 instance"
  value       = aws_eip.frontend.public_ip
}

output "medical_services_eip" {
  description = "Elastic IP of the medical-services EC2 instance"
  value       = aws_eip.medical_services.public_ip
}

output "specialties_eip" {
  description = "Elastic IP of the specialties EC2 instance"
  value       = aws_eip.specialties.public_ip
}

output "medical_services_private_ip" {
  description = "Private IP of medical-services (used by nginx proxy)"
  value       = aws_instance.medical_services.private_ip
}

output "specialties_private_ip" {
  description = "Private IP of specialties (used by nginx proxy)"
  value       = aws_instance.specialties.private_ip
}

output "medical_services_db_host" {
  description = "RDS endpoint for medical-services"
  value       = aws_db_instance.medical_services.address
}

output "specialties_db_host" {
  description = "RDS endpoint for specialties"
  value       = aws_db_instance.specialties.address
}

output "ecr_frontend_url" {
  description = "ECR repository URL for frontend image"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_medical_services_url" {
  description = "ECR repository URL for medical-services image"
  value       = aws_ecr_repository.medical_services.repository_url
}

output "ecr_specialties_url" {
  description = "ECR repository URL for specialties image"
  value       = aws_ecr_repository.specialties.repository_url
}

output "aws_region" {
  value = var.aws_region
}
