variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "key_pair_name" {
  description = "Name of the AWS EC2 Key Pair for SSH access"
  type        = string
}

variable "db_password" {
  description = "Master password for both RDS PostgreSQL instances"
  type        = string
  sensitive   = true
}

variable "admin_cidr" {
  description = "CIDR block allowed to SSH into EC2 instances (use your public IP: x.x.x.x/32)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "project_name" {
  description = "Prefix for all resource names"
  type        = string
  default     = "ayd"
}
