# Diagrama de Arquitectura de Despliegue

## Centro Médico AYD — Infraestructura como Código en AWS

---

## Diagrama General

```
                          INTERNET
                             │
                             ▼
                    ┌────────────────┐
                    │  AWS ALB       │  ← Acceso público HTTP:80
                    │  (Load         │    DNS: ayd-alb-xxx.us-east-1.elb.amazonaws.com
                    │   Balancer)    │
                    └───────┬────────┘
                            │
              ┌─────────────┘
              ▼
    ┌─────────────────────┐       Elastic IP (estática)
    │  EC2: Frontend      │◄──────────────────────────
    │  (Ubuntu 22.04)     │
    │  Docker Container:  │
    │  nginx + Vue.js SPA │
    │  Puerto: 80         │
    └──────┬──────┬───────┘
           │      │   nginx actúa como API Gateway
           │      │   proxy_pass por ruta
           │      │
    ┌──────▼──┐  ┌▼────────────┐
    │  EC2:   │  │  EC2:       │   IPs estáticas (Elastic IPs)
    │  Medical│  │  Specialties│
    │ Services│  │  Service    │
    │ (Ubuntu)│  │  (Ubuntu)   │
    │ Docker: │  │  Docker:    │
    │ Express │  │  Express    │
    │ :3001   │  │  :3002      │
    └────┬────┘  └──────┬──────┘
         │               │
    ┌────▼────┐    ┌─────▼─────┐
    │  RDS    │    │  RDS      │   Subnets Privadas
    │ Postgres│    │ Postgres  │   (sin acceso público)
    │ medical │    │specialties│
    │ _svcs DB│    │    DB     │
    └─────────┘    └───────────┘
```

---

## Arquitectura de Capas (Two-Tier Microservices)

```
┌────────────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN (Layer 1)                    │
│  Vue.js SPA — nginx Docker Container               │
│  • Consume /api/servicios y /api/especialidades    │
│  • nginx enruta como API Gateway interno           │
└────────────────────────────────────────────────────┘
                        │
┌────────────────────────────────────────────────────┐
│  CAPA DE LÓGICA DE NEGOCIO (Layer 2)               │
│  Microservicio A          Microservicio B          │
│  Medical Services         Specialties              │
│  Express.js :3001         Express.js :3002         │
│  • GET/POST/PUT/DELETE    • GET/POST/PUT/DELETE     │
│    /api/servicios           /api/especialidades     │
└────────────────────────────────────────────────────┘
                        │
┌────────────────────────────────────────────────────┐
│  CAPA DE PERSISTENCIA (Layer 3)                    │
│  AWS RDS PostgreSQL 15    AWS RDS PostgreSQL 15    │
│  DB: medical_services     DB: specialties          │
│  (Managed Database —      (Managed Database —      │
│   sin acceso público)      sin acceso público)     │
└────────────────────────────────────────────────────┘
```

---

## Infraestructura Terraform (Recursos AWS)

| Recurso AWS | Nombre | Descripción |
|---|---|---|
| `aws_vpc` | ayd-vpc | Red virtual privada `10.0.0.0/16` |
| `aws_subnet` (×4) | public-a/b, private-a/b | Subnets públicas (EC2/ALB) y privadas (RDS) |
| `aws_internet_gateway` | ayd-igw | Salida a Internet |
| `aws_lb` | ayd-alb | Application Load Balancer (punto de entrada) |
| `aws_instance` (×3) | frontend, medical-services, specialties | EC2 Ubuntu 22.04 t3.micro |
| `aws_eip` (×3) | frontend-eip, medical-eip, specialties-eip | IPs públicas estáticas |
| `aws_db_instance` (×2) | medical-db, specialties-db | RDS PostgreSQL 15 db.t3.micro |
| `aws_ecr_repository` (×3) | ayd-frontend, ayd-medical-services, ayd-specialties | Registro de contenedores |
| `aws_iam_role` | ayd-ec2-ecr-role | Permite a EC2 leer desde ECR sin credenciales manuales |
| `aws_security_group` (×6) | alb, frontend, medical, specialties, rds-medical, rds-specialties | Reglas de red por capa |

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
