# AYD2_A_2S2025_PRAC2_G3 — Centro Médico AYD

Plataforma web de gestión de servicios médicos desplegada en AWS con arquitectura de microservicios, usando Terraform (IaC) y Ansible (automatización).

## Arquitectura

```
Internet → AWS ALB (HTTP:80)
              │
              ▼
     EC2: Frontend (nginx + Vue.js SPA)
      │  nginx actúa como API Gateway:
      ├─ /api/servicios      → EC2: Medical Services (Express :3001) → RDS medical_services
      └─ /api/especialidades → EC2: Specialties      (Express :3002) → RDS specialties
```

Todos los recursos se crean automáticamente con Terraform. Las 3 EC2 tienen IPs Elásticas estáticas. Las bases de datos RDS son privadas (solo accesibles desde su microservicio).

---

## Prerrequisitos

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) configurado con credenciales
- [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/) >= 2.14
- [Docker](https://docs.docker.com/engine/install/)

---

## Despliegue Completo (paso a paso)

### 1. Configurar credenciales AWS

```bash
aws configure
# Ingresar: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)
```

Verificar:
```bash
aws sts get-caller-identity
```

### 2. Crear Key Pair en AWS

```bash
aws ec2 create-key-pair --key-name ayd-keypair --query 'KeyMaterial' --output text > ~/.ssh/ayd-keypair.pem
chmod 400 ~/.ssh/ayd-keypair.pem
```

### 3. Crear archivo de variables de Terraform

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
```

Editar `terraform/terraform.tfvars`:
```hcl
aws_region    = "us-east-1"
key_pair_name = "ayd-keypair"
db_password   = "TuPasswordSeguro123!"   # mínimo 8 chars
admin_cidr    = "0.0.0.0/0"
instance_type = "t3.micro"
```

### 4. Aprovisionar infraestructura AWS con Terraform

```bash
cd terraform
terraform init
terraform apply -auto-approve
cd ..
```

Esto crea: VPC, 3 EC2 + Elastic IPs, 2 RDS PostgreSQL, 3 ECR repositories, ALB, Security Groups, IAM Role.

Duración aproximada: **5-10 minutos**.

### 5. Generar inventario de Ansible

```bash
source scripts/generate_inventory.sh
```

> **Importante**: usar `source` (no `./`) para que las variables de entorno queden disponibles en la sesión.

Este script lee los outputs de Terraform y escribe los valores reales (IPs, URLs de ECR, hosts de DB) en `ansible/inventory/group_vars/all.yml`.

### 6. Construir y subir imágenes Docker a ECR

```bash
./scripts/build_and_push.sh
```

Construye y sube las 3 imágenes (frontend, medical-services, specialties) al registro ECR privado de AWS.

### 7. Instalar colecciones de Ansible

```bash
cd ansible
ansible-galaxy collection install -r requirements.yml
```

### 8. Desplegar contenedores en las EC2

```bash
cd ansible
ansible-playbook playbooks/site.yml
```

El playbook:
1. Instala Docker Engine en los 3 servidores
2. Autentica Docker con ECR usando el IAM Role de la instancia
3. Hace `docker pull` de cada imagen
4. Lanza los contenedores con las variables de base de datos correctas

Duración aproximada: **3-5 minutos**.

### 9. Verificar el despliegue

```bash
# Obtener la URL pública
cd terraform && terraform output alb_dns_name

# Probar los APIs
curl http://<ALB-DNS>/api/servicios
curl http://<ALB-DNS>/api/especialidades
```

Abrir en el navegador: `http://<ALB-DNS>`

---

## Desarrollo Local

Para ejecutar todo localmente sin AWS:

```bash
docker compose up --build
```

Servicios disponibles:
- **Frontend**: http://localhost
- **Medical Services API**: http://localhost:3001
- **Specialties API**: http://localhost:3002

Detener y limpiar volúmenes:
```bash
docker compose down -v
```

### Desarrollo individual por servicio

```bash
# Medical Services
cd backend/medical-services && npm install && npm run dev   # puerto 3001

# Specialties
cd backend/specialties && npm install && npm run dev        # puerto 3002

# Frontend (con proxy automático a 3001/3002)
cd frontend && npm install && npm run dev                    # puerto 5173
```

---

## Infraestructura Terraform

| Recurso | Cantidad | Descripción |
|---------|----------|-------------|
| `aws_vpc` | 1 | Red virtual `10.0.0.0/16` |
| `aws_subnet` | 4 | 2 públicas (EC2/ALB), 2 privadas (RDS) |
| `aws_instance` | 3 | EC2 Ubuntu 22.04 t3.micro |
| `aws_eip` | 3 | IPs estáticas para cada EC2 |
| `aws_db_instance` | 2 | RDS PostgreSQL 15 (managed, sin acceso público) |
| `aws_lb` | 1 | Application Load Balancer (punto de entrada público) |
| `aws_ecr_repository` | 3 | Registro de contenedores privado en AWS |
| `aws_iam_role` | 1 | Permite a EC2 leer ECR sin credenciales manuales |
| `aws_security_group` | 6 | Reglas de red: ALB, Frontend, Medical, Specialties, RDS×2 |

---

## Estructura del Proyecto

```
.
├── frontend/               # Vue.js SPA + nginx (API Gateway)
│   ├── src/
│   │   ├── App.vue         # Componente principal con filtro por especialidad
│   │   └── services/api.js # Cliente axios para los dos microservicios
│   ├── nginx.conf.template # Configuración nginx con envsubst
│   └── Dockerfile
├── backend/
│   ├── medical-services/   # Microservicio Express :3001
│   │   └── src/
│   │       ├── index.js
│   │       ├── db.js
│   │       ├── migrations.js   # Auto-migración + seed al iniciar
│   │       └── routes/servicios.js
│   └── specialties/        # Microservicio Express :3002
│       └── src/
│           ├── index.js
│           ├── db.js
│           ├── migrations.js
│           └── routes/especialidades.js
├── terraform/              # IaC — toda la infraestructura AWS
│   ├── main.tf
│   ├── vpc.tf
│   ├── ec2.tf
│   ├── rds.tf
│   ├── alb.tf
│   ├── ecr.tf
│   ├── iam.tf
│   ├── security_groups.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── terraform.tfvars.example
├── ansible/                # Automatización: instalar Docker + desplegar contenedores
│   ├── ansible.cfg
│   ├── inventory/
│   │   ├── hosts.yml           # Generado por generate_inventory.sh
│   │   └── group_vars/all.yml  # Variables: ECR URLs, DB hosts, IPs
│   ├── playbooks/
│   │   ├── site.yml            # Orquestador principal
│   │   ├── install_docker.yml
│   │   └── deploy.yml
│   └── requirements.yml
├── scripts/
│   ├── build_and_push.sh       # Build Docker → push a ECR
│   └── generate_inventory.sh   # Terraform outputs → inventario Ansible
├── docs/
│   ├── architecture.md         # Diagrama de arquitectura de despliegue
│   └── user-manual.md          # Manual de usuario final
└── docker-compose.yml          # Entorno de desarrollo local completo
```

---

## APIs REST

### Microservicio: Servicios Médicos (`/api/servicios`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/servicios` | Listar todos los servicios médicos |
| GET | `/api/servicios/:id` | Obtener un servicio por ID |
| POST | `/api/servicios` | Crear nuevo servicio |
| PUT | `/api/servicios/:id` | Actualizar servicio existente |
| DELETE | `/api/servicios/:id` | Eliminar servicio |

**Ejemplo de body para POST/PUT:**
```json
{
  "nombre": "Densitometría Ósea",
  "descripcion_tecnica": "Medición de la densidad mineral ósea.",
  "requisitos_previos": "No tomar calcio 24 horas antes",
  "precio": 450.00,
  "disponible": true
}
```

### Microservicio: Especialidades (`/api/especialidades`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/especialidades` | Listar especialidades con sus servicios asociados |
| GET | `/api/especialidades/:id` | Obtener una especialidad por ID |
| POST | `/api/especialidades` | Crear nueva especialidad |
| PUT | `/api/especialidades/:id` | Actualizar especialidad |
| DELETE | `/api/especialidades/:id` | Eliminar especialidad |

---

## Documentación

- [Diagrama de Arquitectura de Despliegue](docs/architecture.md)
- [Manual de Usuario](docs/user-manual.md)

---

## Destruir la Infraestructura

Para eliminar todos los recursos AWS y evitar costos:

```bash
cd terraform
terraform destroy -auto-approve
```

> **Advertencia**: Esto elimina permanentemente todos los datos almacenados en las bases de datos RDS.
