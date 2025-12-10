# ☕ Coffee Pomodoro

Una aplicación de productividad que combina la técnica Pomodoro con una experiencia visual única: una taza de café que se llena mientras trabajas.

## 🎯 Características

- **Timer Pomodoro Visual**: Una taza de café animada que se llena durante cada sesión
- **Lista de Tareas**: Gestiona tus tareas con un To-Do integrado
- **Modo Oscuro/Claro**: Cambia entre temas según tu preferencia
- **Autenticación con Google**: Login seguro via Supabase Auth
- **Sincronización en la nube**: Tus datos siempre disponibles

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (React + TypeScript)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Pomodoro   │  │   To-Do     │  │   Theme Provider    │  │
│  │   Timer     │  │   List      │  │   (Dark/Light)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (.NET 8)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Auth      │  │   Tasks     │  │    Pomodoro         │  │
│  │  Controller │  │  Controller │  │    Sessions         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                              │                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Services Layer                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │  │
│  │  │TaskService  │  │SessionService│  │SupabaseService│  │  │
│  │  └─────────────┘  └─────────────┘  └───────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Supabase                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Auth     │  │  Database   │  │    Storage          │  │
│  │   (Google)  │  │ (PostgreSQL)│  │   (Avatars)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estructura del Proyecto

```
caffe-pomodoro/
├── backend/                    # API .NET 8
│   ├── CaffePomodoro.Api/      # Proyecto principal
│   │   ├── Controllers/        # Endpoints REST
│   │   ├── Services/           # Lógica de negocio
│   │   ├── Models/             # Entidades y DTOs
│   │   └── Infrastructure/     # Configuración Supabase
│   └── CaffePomodoro.sln       # Solución
│
├── frontend/                   # App React
│   ├── src/
│   │   ├── components/         # Componentes UI
│   │   ├── contexts/           # React Contexts
│   │   ├── hooks/              # Custom Hooks
│   │   ├── services/           # API calls
│   │   └── styles/             # CSS/Themes
│   └── package.json
│
└── README.md
```

## 🚀 Configuración

### 1. Supabase Setup

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el SQL de `database/schema.sql`
3. Configura Google OAuth en Authentication > Providers
4. Copia las credenciales

### 2. Backend (.NET)

```bash
cd backend/CaffePomodoro.Api
# Configura appsettings.json con tus credenciales
dotnet restore
dotnet run
```

### 3. Frontend (React)

```bash
cd frontend
npm install
# Configura .env con tus credenciales
npm run dev
```

## 🔑 Variables de Entorno

### Backend (appsettings.json)
```json
{
  "Supabase": {
    "Url": "https://your-project.supabase.co",
    "Key": "your-anon-key",
    "ServiceKey": "your-service-key"
  }
}
```

### Frontend (.env)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5000
```

## 📝 Licencia

MIT
