# Diagrama de Arquitectura de Despliegue

## Centro Médico AYD — Infraestructura como Código en AWS

---

## Diagrama General
![alt text](<Diagrama sin título.jpg>)

---

## Arquitectura de Capas (Two-Tier Microservices)

![alt text](<Diagrama sin título (1).jpg>)

---

## Infraestructura Terraform (Recursos AWS)

| Recurso AWS | Nombre | Especificación Real |
|---|---|---|
| `aws_vpc` | ayd-vpc | CIDR `10.0.0.0/16` en región `us-east-1` |
| `aws_subnet` (×4) | public-a/b, private-a/b | 2 públicas (AZ: us-east-1a, 1b) para EC2/ALB; 2 privadas para RDS |
| `aws_internet_gateway` | ayd-igw | Salida a Internet (attached a ayd-vpc) |
| `aws_lb` | ayd-alb | Application Load Balancer · DNS: `ayd-alb-869063827.us-east-1.elb.amazonaws.com` |
| `aws_instance` (×3) | frontend, medical-services, specialties | **EC2 Ubuntu 22.04 LTS · t3.micro · EBS gp3 20GB** |
| `aws_eip` (×3) | frontend-eip, medical-eip, specialties-eip | **IPs Elásticas Públicas:** `35.170.34.144` \| `35.171.99.113` \| `3.209.5.159` |
| `aws_db_instance` (×2) | ayd-medical-db, ayd-specialties-db | **PostgreSQL 15.7** · Instancia `db.t3.micro` · 20GB gp2 · **No público** |
| `aws_db_subnet_group` | ayd-db-subnet-group | Reside en subnets privadas (disponibilidad multi-AZ) |
| `aws_ecr_repository` (×3) | ayd-frontend, ayd-medical-services, ayd-specialties | Registros privados ECR para almacenar imágenes Docker |
| `aws_iam_role` | ayd-ec2-ecr-role | Permite a EC2 leer desde ECR sin credenciales manuales |
| `aws_security_group` (×6) | alb, frontend, medical, specialties, rds-medical, rds-specialties | Reglas de firewall por capa (aislamiento de tráfico) |

---

## Flujo de Automatización (Terraform + Ansible)

```
1. terraform init && terraform apply
        │
        ├── Crea VPC, subnets, IGW, route tables
        ├── Crea Security Groups por capa
        ├── Crea 3 EC2 + 3 Elastic IPs
        ├── Crea 2 RDS PostgreSQL (managed)
        ├── Crea 3 ECR repositories
        └── Crea IAM Role para acceso a ECR

2. source scripts/generate_inventory.sh
        │
        └── Lee outputs de Terraform → genera ansible/inventory/hosts.yml
            y exporta env vars (ECR URLs, DB hosts, private IPs)

3. ./scripts/build_and_push.sh
        │
        ├── docker build frontend/  → ECR push
        ├── docker build services/medical-services/ → ECR push
        └── docker build services/specialties/ → ECR push

4. cd ansible && ansible-playbook playbooks/site.yml
        │
        ├── install_docker.yml (todos los hosts)
        │     ├── Instala Docker Engine
        │     ├── Configura sistema operativo
        │     └── Instala AWS CLI
        │
        └── deploy.yml
              ├── Medical Services: pull ECR → docker run :3001 (+ DB env vars)
              ├── Specialties: pull ECR → docker run :3002 (+ DB env vars)
              └── Frontend: pull ECR → docker run :80
                    env: MEDICAL_SERVICES_HOST, SPECIALTIES_HOST
                    nginx: proxy_pass /api/servicios → :3001
                           proxy_pass /api/especialidades → :3002
```

---

## Seguridad (Security Groups)

```
Internet → ALB SG (0.0.0.0/0:80)
ALB SG → Frontend SG (port 80)
Admin IP → Frontend SG (port 22, SSH)
Admin IP → Medical SG (port 22, SSH)
Admin IP → Specialties SG (port 22, SSH)
Frontend SG → Medical SG (port 3001)
Frontend SG → Specialties SG (port 3002)
Medical SG → RDS Medical SG (port 5432)
Specialties SG → RDS Specialties SG (port 5432)
```

Los microservicios **no son accesibles desde Internet**, solo desde el frontend interno.  
Las bases de datos **no son accesibles desde Internet**, solo desde su microservicio correspondiente.
