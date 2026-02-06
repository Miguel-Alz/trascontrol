# 🚌 Sistema de Registro de Conductores - TransControl

Sistema web completo para el registro diario de conductores de transporte, con panel administrativo y exportación de reportes.

## 📋 Características

### Parte 1 - Formulario de Conductores
- ✅ Interfaz moderna con diseño glassmorphism
- ✅ Campos: Fecha, Empresa, Prefijo (auto), Vehículo, Tabla, Conductor, Horas, Servicio, Novedad
- ✅ Auto-completado de prefijo según empresa seleccionada
- ✅ Validaciones en tiempo real
- ✅ Animaciones suaves y feedback visual
- ✅ Diseño 100% responsivo

### Parte 2 - Panel Administrativo
- ✅ Login con autenticación
- ✅ Dashboard con estadísticas animadas
- ✅ Tabla dinámica con paginación
- ✅ Filtros avanzados (fechas, empresa, conductor, vehículo, novedades)
- ✅ Exportación a Excel (.xls) y CSV
- ✅ Sidebar responsivo

## 🏗️ Estructura del Proyecto

```
Form/
├── index.html          # Formulario de conductores
├── admin.html          # Panel de administración
├── css/
│   ├── styles.css      # Estilos globales y variables CSS
│   ├── form.css        # Estilos del formulario
│   └── admin.css       # Estilos del dashboard
├── js/
│   ├── utils.js        # Utilidades (toasts, validación, helpers)
│   ├── api.js          # Comunicación con backend + datos mock
│   ├── app.js          # Lógica del formulario
│   └── admin.js        # Lógica del dashboard
├── backend/
│   └── server.js       # Servidor Node.js + Express
├── database/
│   └── schema.sql      # Script SQL para PostgreSQL
└── README.md           # Este archivo
```

## 🚀 Inicio Rápido (Sin Backend)

La aplicación funciona completamente sin necesidad de un backend, usando datos simulados:

1. Abrir `index.html` en el navegador para el formulario
2. Abrir `admin.html` para el panel administrativo
3. **Credenciales de prueba:** `admin` / `admin123`

## 🗄️ Base de Datos PostgreSQL

### Crear la base de datos

```sql
-- Conectar a PostgreSQL y ejecutar:
CREATE DATABASE conductores_db;
\c conductores_db

-- Ejecutar el script completo
\i database/schema.sql
```

### Estructura de tablas

#### Tabla `usuarios`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | Identificador único |
| username | VARCHAR(50) | Nombre de usuario |
| password | VARCHAR(255) | Contraseña (hash bcrypt) |
| email | VARCHAR(100) | Email opcional |
| rol | VARCHAR(20) | admin, supervisor, viewer |
| activo | BOOLEAN | Estado del usuario |

#### Tabla `formulario`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | Identificador único |
| fecha | DATE | Fecha del registro |
| empresa | VARCHAR(100) | Nombre de la empresa |
| prefijo | VARCHAR(10) | Prefijo de la empresa |
| vehiculo | VARCHAR(50) | Identificador del vehículo |
| tabla | VARCHAR(50) | Número de tabla |
| conductor | VARCHAR(100) | Nombre del conductor |
| hora_inicio | TIME | Hora de inicio |
| hora_fin | TIME | Hora de finalización |
| servicio | VARCHAR(200) | Descripción del servicio |
| novedad | TEXT | Novedades (opcional) |
| fecha_creacion | TIMESTAMP | Fecha de creación |

#### Tabla `empresas`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | SERIAL | Identificador único |
| nombre | VARCHAR(100) | Nombre de la empresa |
| prefijo | VARCHAR(10) | Prefijo (UC, TP, SL) |
| activa | BOOLEAN | Estado |

### Empresas configuradas

| Empresa | Prefijo |
|---------|---------|
| Urbanos Cañarte | UC |
| Transperla del Otún | TP |
| Servilujo | SL |

## 🖥️ Backend (Opcional)

### Requisitos
- Node.js 16+
- PostgreSQL 12+

### Instalación

```bash
cd backend
npm init -y
npm install express pg cors bcryptjs jsonwebtoken dotenv
```

### Configuración

Crear archivo `.env` en la carpeta `backend`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=conductores_db
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_clave_secreta_muy_larga_y_segura
```

### Ejecución

```bash
node server.js
```

El servidor estará disponible en `http://localhost:3000`

### Crear usuario administrador

```bash
curl -X POST http://localhost:3000/api/setup/admin \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123", "email": "admin@example.com"}'
```

## 📡 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/verify` | Verificar token |
| GET | `/api/formularios` | Listar registros |
| POST | `/api/formularios` | Crear registro |
| GET | `/api/formularios/:id` | Obtener registro |
| PUT | `/api/formularios/:id` | Actualizar registro |
| DELETE | `/api/formularios/:id` | Eliminar registro |
| GET | `/api/stats` | Obtener estadísticas |
| GET | `/api/empresas` | Listar empresas |
| GET | `/api/health` | Health check |

### Parámetros de filtrado (GET /api/formularios)

- `page` - Número de página
- `limit` - Registros por página
- `fechaInicio` - Filtrar desde fecha
- `fechaFin` - Filtrar hasta fecha
- `empresa` - Filtrar por empresa
- `conductor` - Buscar conductor
- `vehiculo` - Buscar vehículo
- `novedad` - "si" o "no"

## 🎨 Diseño

### Paleta de colores

```css
--primary-color: #6366f1;    /* Índigo */
--secondary-color: #8b5cf6;  /* Violeta */
--success-color: #10b981;    /* Verde */
--warning-color: #f59e0b;    /* Ámbar */
--error-color: #ef4444;      /* Rojo */
--bg-primary: #0f0f23;       /* Fondo oscuro */
```

### Características de UI/UX

- **Glassmorphism**: Efecto de vidrio translúcido
- **Animaciones**: Transiciones suaves en hover, focus y submit
- **Responsive**: Adaptable a móvil, tablet y desktop
- **Accesibilidad**: Labels, focus states, ARIA

## 🔧 Personalización

### Agregar nueva empresa

1. En `database/schema.sql`:
```sql
INSERT INTO empresas (nombre, prefijo) VALUES ('Nueva Empresa', 'NE');
```

2. En `js/utils.js`:
```javascript
empresas: {
    // ... existentes
    'Nueva Empresa': 'NE'
}
```

3. En los HTML, agregar option en los select de empresa.

### Cambiar colores

Editar las variables CSS en `css/styles.css`:

```css
:root {
    --primary-color: #tu_color;
    /* ... */
}
```

## 📱 Compatibilidad

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📄 Licencia

MIT License - Libre para uso personal y comercial.
