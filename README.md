# NETLAND Corporación Inmobiliaria — Plataforma Web + Administrativa

Plataforma inmobiliaria premium para **NETLAND Corporación Inmobiliaria** (Cañete, Perú).

Incluye una **web pública** orientada a la conversión de visitantes en clientes y un **sistema administrativo completo** para gestionar proyectos, lotes, planos interactivos, clientes, asesores, promociones, visitas, cotizaciones PDF y multimedia en Cloudinary.

> **Objetivo:** *"El lugar donde mereces vivir."*

---

## Arquitectura

```
/frontend   → React + Vite + TypeScript + Tailwind CSS (Netlify)
/backend    → Python + FastAPI + SQLAlchemy + Alembic (Render)
/docker     → PostgreSQL local para desarrollo
/docs       → Documentación
/scripts    → Scripts de instalación
```

| Capa            | Tecnología                                  |
| --------------- | ------------------------------------------- |
| Frontend        | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, Lucide, Recharts |
| Backend         | FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic, PyJWT, bcrypt, ReportLab, Cloudinary SDK |
| Base de datos   | PostgreSQL (Neon)                            |
| Almacenamiento  | Cloudinary (imágenes, videos, PDFs)          |

---

## 1. Instalación

### Requisitos
- Node.js ≥ 18
- Python ≥ 3.11
- PostgreSQL local (opcional, para desarrollo) — ver `docker/docker-compose.yml`

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # editar con tus credenciales
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # editar VITE_API_URL
```

---

## 2. Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción |
| -------- | ----------- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL (Neon). Ej: `postgresql+psycopg://user:pass@host/neondb?sslmode=require` |
| `JWT_SECRET` | Clave secreta para firmar tokens (usa una larga y aleatoria) |
| `JWT_ALGORITHM` | Algoritmo JWT (`HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token en minutos |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud de Cloudinary |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary |
| `FRONTEND_URL` | URL del frontend (origen permitido por CORS) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Credenciales del primer administrador |
| `COMPANY_WHATSAPP` | Número de WhatsApp principal (con código de país) |

### Frontend (`frontend/.env`)

| Variable | Descripción |
| -------- | ----------- |
| `VITE_API_URL` | URL de la API. Ej: `http://localhost:8000/api` |
| `VITE_WHATSAPP_NUMBER` | Número de WhatsApp: `51985928062` |

> **Nunca** se deben subir secretos a Git. Revisa que el `.env` esté ignorado (ver `.gitignore`).

---

## 3. Base de datos (Neon PostgreSQL)

1. Crea una base de datos gratuita en [neon.tech](https://neon.tech).
2. Copia la cadena de conexión en `DATABASE_URL` del backend.
3. Ejecuta las migraciones:

```bash
cd backend
alembic upgrade head        # o crea la inicial: alembic revision --autogenerate -m "init"
```

**Alternativa rápida:** el script de seed crea las tablas automáticamente:

```bash
cd backend
python -m app.seed
```

El seed crea:
- Roles: `SUPER_ADMIN`, `ADMIN`, `ASESOR`
- Usuario administrador (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`)
- Asesor: **Luis Valle** (WhatsApp 985 928 062)
- Proyectos: **Villa del Sur** (Almenares, Cañete) y **Villa Real** (Panamericana Sur Km 148)
- 15 lotes del Condominio Campestre Villa del Sur (disponibles, reservados y vendidos de ejemplo)

---

## 4. Migraciones (Alembic)

```bash
cd backend
alembic revision --autogenerate -m "descripcion del cambio"
alembic upgrade head
```

La configuración lee `DATABASE_URL` desde las variables de entorno.

---

## 5. Cloudinary

1. Crea una cuenta en [cloudinary.com](https://cloudinary.com).
2. Configura `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` en el `.env`.
3. Desde el panel admin (`/admin/multimedia`) pega las URLs de Cloudinary de imágenes, videos y PDFs.

Endpoint de subida: `POST /api/uploads` (multipart, autenticado) guarda el archivo en Cloudinary y devuelve `{ url, public_id }`.

En PostgreSQL solo se almacenan la **URL** y el **public_id**; los archivos pesados viven en Cloudinary.

---

## 6. Desarrollo local

### Backend

```bash
cd backend
uvicorn app.main:app --reload
# Documentación interactiva: http://localhost:8000/docs
# Health check: http://localhost:8000/health
```

### Frontend

```bash
cd frontend
npm run dev
# Sitio:   http://localhost:5173
# Admin:   http://localhost:5173/admin/login
```

### Docker (PostgreSQL local opcional)

```bash
cd docker
docker compose up -d
# DATABASE_URL=postgresql+psycopg://netland:netland_dev_password@localhost:5432/netland
```

---

## 7. Build

```bash
cd frontend
npm run build     # genera /dist con code-splitting por ruta
npm run preview   # previsualiza el build
```

---

## 8. Deploy en Netlify (frontend)

1. Conecta el repositorio en Netlify.
2. Configuración de build:
   - **Base directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `dist`
3. Variables de entorno en Netlify:
   - `VITE_API_URL=https://tu-backend.onrender.com/api`
   - `VITE_WHATSAPP_NUMBER=51985928062`
4. El archivo `netlify.toml` y `public/_redirects` ya están configurados para el routing SPA (`/admin`, `/proyectos/...`).

---

## 9. Deploy en Render (backend)

1. Conecta el repositorio en Render → **New Web Service**.
2. Configuración:
   - **Root directory:** `backend`
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Crea una base de datos PostgreSQL en Render (o usa Neon) y asigna `DATABASE_URL`.
4. Agrega las variables restantes (`JWT_SECRET`, `CLOUDINARY_*`, `FRONTEND_URL`).
5. Tras el primer deploy, ejecuta una vez el seed para cargar datos iniciales.

> El archivo `render.yaml` del repositorio permite usar **Blueprint** para crear el web service y la base de datos juntos.

---

## 10. Neon

1. Crea el proyecto en [neon.tech](https://neon.tech).
2. Copia la cadena de conexión (pestaña *Connect*) → `DATABASE_URL`.
3. Ejecuta `alembic upgrade head` o `python -m app.seed`.

---

## 11. Usuarios y roles

| Rol | Permisos |
| --- | -------- |
| `SUPER_ADMIN` | Acceso total: proyectos, lotes, planos, leads, asesores, usuarios, configuraciones |
| `ADMIN` | Gestión operativa: proyectos, lotes, leads, asesores, promociones, visitas, cotizaciones |
| `ASESOR` | Ver y gestionar sus leads, lotes disponibles, visitas y cotizaciones |

El asesor **no** puede modificar configuraciones críticas ni gestionar usuarios (validado en el backend vía `require_admin` / `require_roles`).

**Credenciales por defecto (cambiar en producción):**

```
admin@netlandcorp.com / AdminNetland2026
```

---

## 12. Seguridad

- Autenticación **JWT** (access token con expiración).
- Contraseñas con **bcrypt**.
- Roles y permisos por endpoint.
- Validación de datos con **Pydantic** en todos los endpoints.
- **Anti doble-reserva**: el cambio `available → reserved` usa bloqueo transaccional (`SELECT ... FOR UPDATE`); un lote ya reservado devuelve `409 Conflict`.
- CORS restringido a `FRONTEND_URL`.
- Manejo global de errores + logs.
- Secretos solo en variables de entorno.

---

## 13. Endpoints principales

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| `POST` | `/api/auth/login` | Login (OAuth2 form) |
| `GET` | `/api/projects` | Lista proyectos |
| `GET` | `/api/projects/{slug}` | Detalle de proyecto |
| `GET` | `/api/projects/{id}/lots` | Lotes del proyecto |
| `GET` | `/api/projects/{id}/blocks` | Manzanas del proyecto |
| `GET` | `/api/projects/{id}/gallery` | Galería |
| `GET` | `/api/projects/{id}/videos` | Videos |
| `GET` | `/api/projects/{id}/documents` | Documentos |
| `PATCH` | `/api/projects/lots/{id}/status` | Cambio de estado de lote (transaccional) |
| `GET` | `/api/projects/promotions` | Promociones activas |
| `POST` | `/api/leads` | Captura de lead (público) |
| `GET` | `/api/leads` | Lista de leads (admin) |
| `GET` | `/api/advisors` | Equipo de asesores |
| `POST` | `/api/quotes` | Generar cotización |
| `GET` | `/api/quotes/{id}/pdf` | Descargar cotización en PDF (ReportLab) |
| `GET` | `/api/dashboard/stats` | Estadísticas del panel |
| `POST` | `/api/uploads` | Subir archivo a Cloudinary |

Documentación OpenAPI completa en `/docs`.

---

## 14. Pruebas

```bash
# Backend: prueba de integración (usa SQLite local)
cd backend
$env:DATABASE_URL="sqlite:///./test.db"
python -m app.seed
python tests/test_integration.py
```

Prueba el flujo completo: login, proyectos, lotes, reserva (y rechazo de doble reserva), creación de leads, cotizaciones y generación de PDF.

---

## 15. Funcionalidades clave

- **Web pública premium** responsive (mobile-first): Home, Proyectos, Detalle de proyecto, Nosotros, Contacto.
- **Plano interactivo** por proyecto: SVG con colores por estado, clic en lote → modal con área, precio, promoción y CTAs.
- **Cotizador "Calcula tu inversión"**: lote + inicial + número de cuotas → resumen y generación de PDF.
- **Captura de leads** con pipeline de estados (NUEVO → … → VENDIDO).
- **Panel admin** con dashboard de estadísticas y gráficos (Recharts), CRUD completo y editor de planos.
- **WhatsApp contextual**: cada lote, proyecto y asesor genera mensajes pre-llenados hacia `https://wa.me/51985928062`.
- **SEO**: rutas amigables (`/proyectos/villa-del-sur`), meta tags, lazy loading, Open Graph por proyecto.
- **Datos 100% dinámicos**: proyectos, lotes, precios, promociones, asesores y documentos vienen de la API.

---

## Estructura de carpetas

```
backend/
  app/
    api/routes/      # Endpoints (auth, projects, crm, users, dashboard, uploads)
    core/            # Config, base de datos, seguridad, logging
    domain/models.py # Modelos SQLAlchemy (18 entidades)
    infrastructure/  # Cloudinary + generación de PDF
    schemas/         # Schemas Pydantic
    main.py          # App FastAPI
    seed.py          # Datos iniciales
  alembic/           # Migraciones
  tests/             # Prueba de integración

frontend/
  public/_redirects  # Routing SPA Netlify
  src/
    components/      # Layout, UI kit, plano interactivo, cotizador
    features/admin/  # Panel administrativo
    features/leads/  # Captura de leads
    lib/             # Cliente API, constantes, utilidades
    pages/           # Páginas públicas
    types/           # Tipos TypeScript
```

---

## Próximos pasos sugeridos

1. Configurar credenciales reales de Cloudinary y subir las fotos de los proyectos.
2. Cargar el plano real de Villa del Sur y posicionar los lotes desde `/admin/plano`.
3. Ingresar precios y promociones reales desde el panel.
4. Cambiar las contraseñas por defecto en producción.
5. Conectar los formularios de contacto con el WhatsApp del asesor asignado.