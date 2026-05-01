# Manual del Equipo — Centro Médico AYD

> Práctica 2 · Análisis y Diseño de Sistemas 2 · USAC · 2S 2025

---

## Infraestructura desplegada en AWS

La plataforma ya está corriendo. No hay que volver a crearla desde cero.

| Recurso | URL / IP |
|---------|----------|
| **Aplicación web (entrada pública)** | `http://ayd-alb-869063827.us-east-1.elb.amazonaws.com` |
| Frontend EC2 | `35.170.34.144` |
| Medical Services EC2 | `35.171.99.113` |
| Specialties EC2 | `3.209.5.159` |
| Estado Terraform | S3 `ayd2-g3-tfstate/practica2/terraform.tfstate` |
| Región AWS | `us-east-1` |

---

## Parte 1 — Obtener credenciales AWS (equipo)

**El dueño de la cuenta (aaps05) corre estos comandos una vez por cada integrante:**

```bash
aws iam create-user --user-name nombre-compañero

aws iam attach-user-policy --user-name nombre-compañero --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

aws iam create-access-key --user-name nombre-compañero
```

El último comando imprime un JSON con `AccessKeyId` y `SecretAccessKey`. Comparte esos valores con el compañero **de forma privada** (no los subas al repo).

**Cada compañero configura sus credenciales en su máquina:**

```bash
aws configure
# AWS Access Key ID:     [pega el AccessKeyId]
# AWS Secret Access Key: [pega el SecretAccessKey]
# Default region name:   us-east-1
# Default output format: json
```

Verifica que funciona:
```bash
aws sts get-caller-identity
# Debe mostrar el Account ID: 585008074041
```

---

## Parte 2 — Prerequisitos para todos

Instala estas herramientas antes de continuar:

| Herramienta | Versión mínima | Cómo instalar |
|-------------|---------------|---------------|
| Git | cualquiera | `sudo apt install git` / brew |
| Docker | 24+ | https://docs.docker.com/get-docker |
| Docker Compose | 2+ | incluido con Docker Desktop |
| AWS CLI | 2+ | https://aws.amazon.com/cli |
| Terraform | 1.5+ | https://developer.hashicorp.com/terraform/install |
| Ansible | 2.14+ | `pip install ansible` |
| Node.js | 18+ | solo si vas a desarrollar sin Docker |

---

## Parte 3 — Correr el proyecto localmente (Docker Compose)

Esta es la forma más rápida de levantar todo sin tocar AWS.

```bash
# 1. Clonar el repositorio
git clone <URL-del-repo>
cd AYD2_A_2S2025_PRAC2_G3

# 2. Levantar todos los contenedores
docker compose up --build

# 3. Abrir en el navegador
# http://localhost
```

Esto levanta 5 contenedores: 2 PostgreSQL, 2 microservicios Express, 1 nginx+Vue.  
Los datos se crean automáticamente al iniciar (migración + seed inicial).

Para detener y limpiar volúmenes:
```bash
docker compose down -v
```

**Nota:** Los datos locales son independientes de AWS. Los cambios que hagas localmente no afectan la base de datos de producción.

---

## Parte 4 — Ver el estado de la infraestructura AWS

Para ver qué hay desplegado sin tocar nada:

```bash
cd terraform

# Primera vez: descarga el estado compartido desde S3
terraform init

# Ver el estado actual
terraform state list

# Ver si hay cambios pendientes (no aplica nada)
terraform plan
```

Si `terraform plan` dice `No changes`, la infra está igual que el código. Si dice que hay cambios, coordinense antes de aplicarlos.

---

## Parte 5 — Redesplegar después de cambios de código

Cuando alguien modifique el backend o el frontend y haga push al repo, hay que:

```bash
# Paso 1: Construir imágenes Docker y subirlas a ECR
./scripts/build_and_push.sh

# Paso 2: Configurar el inventario de Ansible (si no lo tienes)
source scripts/generate_inventory.sh

# Paso 3: Desplegar en los servidores EC2
cd ansible
ansible-galaxy collection install -r requirements.yml   # solo la primera vez
ansible-playbook playbooks/site.yml -e "db_password=TU_PASSWORD_DE_BD" --private-key ~/.ssh/ayd-keypair.pem
```

> La llave SSH `ayd-keypair.pem` la tiene el dueño de la cuenta. Pídela si la necesitas para desplegar.

---

## Parte 6 — Usar el panel de administración en la web

La aplicación tiene un modo administrador para gestionar datos directamente desde el navegador.

### Acceder al modo admin

1. Abre `http://ayd-alb-869063827.us-east-1.elb.amazonaws.com` (o `http://localhost` si es local)
2. Haz clic en el botón **"⚙️ Modo Admin"** en la esquina superior derecha del header
3. El botón cambia a **"🔒 Salir del modo admin"** confirmando que está activo

### Qué puedes hacer en modo admin

**Servicios médicos:**
- **Crear:** botón `+ Nuevo Servicio` arriba a la derecha del catálogo
- **Editar:** ✏️ en cada tarjeta de servicio
- **Eliminar:** 🗑️ en cada tarjeta (pide confirmación)

**Especialidades:**
- **Crear:** botón `+ Nueva` al lado del título "Especialidades" en el sidebar
- **Editar:** ✏️ al lado de cada especialidad en el sidebar
- **Eliminar:** 🗑️ al lado de cada especialidad (pide confirmación)
- Al crear/editar una especialidad puedes seleccionar qué servicios le pertenecen con checkboxes

### Datos semilla
La primera vez que se inicia el sistema se cargan 10 servicios y 5 especialidades de ejemplo. Después de eso puedes agregar, editar o eliminar lo que quieras desde la interfaz.

---

## Parte 7 — Base de datos compartida

**Los datos en AWS son compartidos entre todo el equipo.**

- La base de datos corre en **RDS PostgreSQL** en AWS (no en tu máquina)
- Cuando tú creas un servicio médico desde la web, todos los demás lo ven inmediatamente al recargar
- Los datos persisten entre reinicios del servidor
- Si alguien elimina algo, desaparece para todos

Esto es por diseño: simula un entorno de producción real donde hay una sola fuente de verdad.

**La base de datos local** (Docker Compose) es completamente independiente. Puedes hacer pruebas ahí sin afectar producción.

---

## Resumen rápido

| Tarea | Comando |
|-------|---------|
| Levantar local | `docker compose up --build` |
| Ver infra AWS | `cd terraform && terraform init && terraform plan` |
| Redesplegar código | `./scripts/build_and_push.sh` + `ansible-playbook` |
| Abrir app en AWS | `http://ayd-alb-869063827.us-east-1.elb.amazonaws.com` |
| Abrir app local | `http://localhost` |
| Activar admin | Botón "⚙️ Modo Admin" en el header |
