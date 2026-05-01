# Manual de Usuario — Centro Médico AYD

## Plataforma Web de Gestión de Servicios Médicos

---

## Acceso a la Plataforma

Una vez desplegada la infraestructura, accede desde cualquier navegador web:

```
http://<DNS-del-Load-Balancer>
```

El DNS del Load Balancer se obtiene al final del despliegue con:
```bash
cd terraform && terraform output alb_dns_name
```

---

## Pantalla Principal

Al ingresar verás la pantalla principal dividida en dos áreas:

```
┌─────────────────────────────────────────────────────────────┐
│     Centro Médico AYD — Catálogo de Servicios Médicos       │
├────────────────┬────────────────────────────────────────────┤
│ Especialidades │  Todos los Servicios                       │
│                │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│    Todas  (10) │  │ Servicio │ │ Servicio │ │ Servicio │    │
│    Cardiología │  │   Card   │ │   Card   │ │   Card   │    │
│    Pediatría   │  └──────────┘ └──────────┘ └──────────┘    │
│    Laboratorio │                                            │
│    Neurología  │                                            │
│   Traumatología│                                            │
└────────────────┴────────────────────────────────────────────┘
```

---

## Cómo Visualizar el Listado de Servicios

1. Al cargar la página, el sistema obtiene automáticamente todos los servicios médicos disponibles.
2. Los servicios se muestran como **tarjetas** en el área principal.
3. Cada tarjeta contiene:
   - **Nombre del servicio** (ej. "Electrocardiograma (ECG)")
   - **Estado de disponibilidad** — etiqueta verde **Disponible** o roja **No disponible**
   - **Descripción técnica** del procedimiento
   - **Requisitos previos** (ayuno, preparación especial, etc.)
   - **Precio** en quetzales (Q)

---

## Cómo Navegar Entre Especialidades

1. En el **panel izquierdo** se muestran todas las especialidades médicas disponibles.
2. Cada especialidad muestra un contador con el número de servicios asociados.
3. **Haz clic** en una especialidad para filtrar los servicios:

   | Especialidad | Servicios incluidos |
   |---|---|
   | Cardiología | ECG, Ecocardiograma, Prueba de Esfuerzo |
   | Pediatría | Consulta Pediátrica |
   | Laboratorio Clínico | Hemograma, Glucosa en Ayunas, Colesterol Total |
   | Neurología | Resonancia Magnética, Tomografía Computarizada |
   | Traumatología | Radiografía de Tórax |

4. Para volver a ver **todos los servicios**, haz clic en **"Todas"** en la parte superior del panel izquierdo.

---

## Cómo Consultar los Detalles de un Servicio

Cada tarjeta de servicio muestra toda la información necesaria:

```
┌──────────────────────────────────────────┐
│  Electrocardiograma (ECG)   [Disponible] │
│                                          │
│  Registro gráfico de la actividad        │
│  eléctrica del corazón mediante          │
│  electrodos.                             │
│                                          │
│  Requisitos: Ninguno                     │
│                                          │
│  Q 150.00                                │
└──────────────────────────────────────────┘
```

### Campos informativos:

| Campo | Descripción |
|---|---|
| **Nombre** | Nombre del estudio o procedimiento |
| **Disponibilidad** | Verde = puede agendarse ahora; Rojo = temporalmente no disponible |
| **Descripción técnica** | Explicación del procedimiento para el paciente |
| **Requisitos previos** | Preparación necesaria antes del procedimiento |
| **Precio** | Costo en Quetzales (Q) |

---

## Indicadores de Estado

| Indicador | Significado |
|---|---|
| Pantalla con spinner girando | El sistema está cargando los datos |
| Tarjeta con badge verde "Disponible" | El servicio puede ser agendado |
| Tarjeta con badge rojo "No disponible" | El servicio está temporalmente suspendido |
| Mensaje "No hay servicios disponibles" | La especialidad no tiene servicios asignados aún |
| Mensaje de error con botón "Reintentar" | Los microservicios no responden — contactar al administrador |

---

## Acceso para Administradores (API REST)

Los microservicios exponen endpoints REST para gestión avanzada:

### Servicios Médicos
```
GET    http://<medical-services-ip>:3001/api/servicios
GET    http://<medical-services-ip>:3001/api/servicios/:id
POST   http://<medical-services-ip>:3001/api/servicios
PUT    http://<medical-services-ip>:3001/api/servicios/:id
DELETE http://<medical-services-ip>:3001/api/servicios/:id
```

### Especialidades
```
GET    http://<specialties-ip>:3002/api/especialidades
GET    http://<specialties-ip>:3002/api/especialidades/:id
POST   http://<specialties-ip>:3002/api/especialidades
PUT    http://<specialties-ip>:3002/api/especialidades/:id
DELETE http://<specialties-ip>:3002/api/especialidades/:id
```

### Ejemplo: Crear un nuevo servicio médico
```bash
curl -X POST http://<medical-ip>:3001/api/servicios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Densitometría Ósea",
    "descripcion_tecnica": "Medición de la densidad mineral ósea.",
    "requisitos_previos": "No tomar calcio 24 horas antes",
    "precio": 450.00,
    "disponible": true
  }'
```

---

## Soporte

Para reportar problemas técnicos, verificar el estado de los servicios:
```bash
# Health check de microservicios
curl http://<medical-services-ip>:3001/health
curl http://<specialties-ip>:3002/health
```
