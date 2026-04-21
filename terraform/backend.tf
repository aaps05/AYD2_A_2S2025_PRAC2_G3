# Estado remoto compartido en S3 — todos los compañeros usan el mismo estado.
# PASO PREVIO: crear el bucket UNA sola vez antes de hacer `terraform init`:
#
#   aws s3api create-bucket --bucket ayd2-g3-tfstate --region us-east-1
#   aws s3api put-bucket-versioning \
#       --bucket ayd2-g3-tfstate \
#       --versioning-configuration Status=Enabled
#
# Luego cada integrante del equipo ejecuta normalmente:
#   terraform init   (descarga el estado desde S3)
#   terraform plan
#   terraform apply

terraform {
  backend "s3" {
    bucket  = "ayd2-g3-tfstate"
    key     = "practica2/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
