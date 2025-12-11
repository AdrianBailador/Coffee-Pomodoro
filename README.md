# ☕ Coffee Pomodoro

A productivity application that combines the Pomodoro technique with a unique visual experience: a coffee cup that fills up as you work.

## 🎯 Features

- **Visual Pomodoro Timer**: An animated coffee cup that fills during each session
- **Task List**: Manage your tasks with an integrated To-Do list
- **Dark/Light Mode**: Switch between themes according to your preference
- **Google Authentication**: Secure login via Supabase Auth
- **Cloud Synchronisation**: Your data always available

## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│                    (React + TypeScript)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Pomodoro   │  │   To-Do     │  │   Theme Provider    │  │
│  │   Timer     │  │   List      │  │   (Dark/Light)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (.NET 8)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Auth      │  │   Tasks     │  │    Pomodoro         │  │
│  │  Controller │  │  Controller │  │    Sessions         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                              │                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Services Layer                     │  │
│  │  ┌─────────────┐ ┌───────────────┐ ┌───────────────┐  │  │
│  │  │ TaskService │ │SessionService │ │SupabaseService│  │  │
│  │  └─────────────┘ └───────────────┘ └───────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Supabase                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Auth     │  │  Database   │  │    Storage          │  │
│  │   (Google)  │  │ (PostgreSQL)│  │   (Avatars)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure
```
coffee-pomodoro/
├── backend/                    # .NET 8 API
│   ├── CaffePomodoro.Api/      # Main project
│   │   ├── Controllers/        # REST endpoints
│   │   ├── Services/           # Business logic
│   │   ├── Models/             # Entities and DTOs
│   │   └── Infrastructure/     # Supabase configuration
│   └── CaffePomodoro.sln       # Solution
│
├── frontend/                   # React App
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── contexts/           # React Contexts
│   │   ├── hooks/              # Custom Hooks
│   │   ├── services/           # API calls
│   │   └── styles/             # CSS/Themes
│   └── package.json
│
└── README.md
```

## 🚀 Setup

### 1. Supabase Setup

1. Create a project on [Supabase](https://supabase.com)
2. Run the SQL from `database/schema.sql`
3. Configure Google OAuth in Authentication > Providers
4. Copy the credentials

### 2. Backend (.NET)
```bash
cd backend/CaffePomodoro.Api
# Configure appsettings.json with your credentials
dotnet restore
dotnet run
```

### 3. Frontend (React)
```bash
cd frontend
npm install
# Configure .env with your credentials
npm run dev
```

## 🔑 Environment Variables

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

## 🌐 Live Demo

- **Frontend**: https://adrianbailador.github.io/Coffee-Pomodoro/
- **Backend**: https://coffee-pomodoro.onrender.com

## 📝 Licence

MIT
