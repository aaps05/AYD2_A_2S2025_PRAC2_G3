terraform {
  backend "s3" {
    bucket  = "ayd2-g3-tfstate"
    key     = "practica2/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
