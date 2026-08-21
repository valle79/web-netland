# 🏡 Netland - Corporación Inmobiliaria

Sistema completo de gestión inmobiliaria con panel administrativo y sitio web público.

## 🌟 Características

### 🌐 Sitio Web Público
- Catálogo de proyectos inmobiliarios
- Galería de imágenes y videos
- Planos interactivos con disponibilidad en tiempo real
- Calculadora de cuotas
- Formularios de contacto y leads
- WhatsApp integrado
- Diseño responsive y moderno

### 🔧 Panel Administrativo
- Gestión completa de proyectos
- Subida de imágenes y videos (Cloudinary)
- Editor de planos interactivos
- Importación automática de lotes desde PDFs
- CRM de leads y clientes
- Sistema de cotizaciones
- Gestión de visitas
- Usuarios y roles
- Dashboard con métricas

## 🛠️ Tecnologías

### Backend
- **FastAPI** - Framework web moderno
- **PostgreSQL** (Neon) - Base de datos en la nube
- **SQLAlchemy** - ORM
- **Alembic** - Migraciones
- **Cloudinary** - Almacenamiento de archivos
- **JWT** - Autenticación

### Frontend
- **React** + **TypeScript**
- **Vite** - Build tool
- **TanStack Query** - Data fetching
- **Tailwind CSS** - Estilos
- **React Router** - Navegación

## 📦 Estructura del Proyecto

```
proyecto_netland/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── api/            # Endpoints
│   │   ├── core/           # Config, seguridad, DB
│   │   ├── domain/         # Modelos
│   │   ├── infrastructure/ # Servicios externos
│   │   └── schemas/        # Validaciones Pydantic
│   ├── alembic/            # Migraciones
│   ├── requirements.txt
│   └── render.yaml         # Config para Render
│
├── frontend/               # React App
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── features/      # Módulos por funcionalidad
│   │   ├── pages/         # Páginas públicas
│   │   └── lib/           # Utilidades
│   ├── netlify.toml       # Config para Netlify
│   └── package.json
│
├── DEPLOYMENT.md          # Guía de despliegue
├── check-deployment.md    # Checklist pre-deploy
└── README.md             # Este archivo
```

## 🚀 Despliegue en Producción

### Backend → Render
```bash
# Ver guía completa en DEPLOYMENT.md

1. Push código a GitHub/GitLab
2. Crear Web Service en Render
3. Configurar variables de entorno
4. Deploy automático
```

### Frontend → Netlify
```bash
# Ver guía completa en DEPLOYMENT.md

1. Push código a GitHub/GitLab
2. Importar proyecto en Netlify
3. Configurar variables de entorno
4. Deploy automático
```

👉 **[Ver guía completa de despliegue](./DEPLOYMENT.md)**

## 💻 Desarrollo Local

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Configurar .env (copiar de .env.example)
cp .env.example .env

# Ejecutar migraciones
alembic upgrade head

# Crear datos iniciales
python -m app.seed

# Iniciar servidor
uvicorn app.main:app --reload
```

Backend disponible en: http://localhost:8000
Documentación API: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar .env (copiar de .env.example)
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

Frontend disponible en: http://localhost:5173

## 🔐 Credenciales por Defecto

Después de ejecutar `python -m app.seed`:

**Super Admin:**
- Email: `admin@netland.com`
- Password: `admin123`

**Admin:**
- Email: `admin2@netland.com`
- Password: `admin123`

⚠️ **Importante:** Cambiar estas contraseñas en producción

## 📚 Documentación

- [Guía de Despliegue](./DEPLOYMENT.md) - Cómo desplegar en producción
- [Checklist Pre-Deploy](./check-deployment.md) - Verificaciones antes de desplegar
- [API Docs](http://localhost:8000/docs) - Documentación interactiva de la API

## 🗃️ Base de Datos

El proyecto usa **Neon PostgreSQL** (compatible con Render, Netlify y desarrollo local).

### Migraciones

```bash
# Crear nueva migración
alembic revision --autogenerate -m "descripción"

# Aplicar migraciones
alembic upgrade head

# Revertir última migración
alembic downgrade -1
```

## 📤 Cloudinary

El sistema usa Cloudinary para almacenar:
- Imágenes de proyectos
- Videos promocionales
- Documentos PDF
- Planos interactivos

Folders organizados:
- `projects/{proyecto_slug}/gallery/`
- `projects/{proyecto_slug}/videos/`
- `projects/{proyecto_slug}/documents/`
- `site/hero/`

## 🧪 Testing

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

## 📊 Monitoreo

### Producción
- **Backend (Render):** Dashboard → Logs
- **Frontend (Netlify):** Dashboard → Deploys → Logs
- **Database (Neon):** Dashboard → Monitoring

### Métricas importantes
- Tiempo de respuesta de API
- Errores 5xx en backend
- Tasa de conversión de leads
- Uso de ancho de banda de Cloudinary

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y propiedad de Netland Corporación Inmobiliaria.

## 📞 Soporte

- **Email:** admin@netland.com
- **WhatsApp:** +51 985 928 062
- **Website:** https://netland.com.pe

---

Hecho con ❤️ por el equipo de Netland
