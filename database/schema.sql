-- =============================================
-- Coffee Pomodoro - Database Schema for Supabase
-- =============================================

-- Habilitar UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: users
-- Información del perfil y configuración del usuario
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    
    -- Configuración de Pomodoro
    work_duration_minutes INTEGER NOT NULL DEFAULT 25,
    short_break_minutes INTEGER NOT NULL DEFAULT 5,
    long_break_minutes INTEGER NOT NULL DEFAULT 15,
    sessions_before_long_break INTEGER NOT NULL DEFAULT 4,
    dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLA: todo_tasks
-- Tareas del usuario
-- =============================================
CREATE TABLE IF NOT EXISTS todo_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    estimated_pomodoros INTEGER NOT NULL DEFAULT 1,
    completed_pomodoros INTEGER NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 0, -- 0: Normal, 1: Alta, 2: Urgente
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Índices para tareas
CREATE INDEX IF NOT EXISTS idx_todo_tasks_user_id ON todo_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_display_order ON todo_tasks(user_id, display_order);

-- =============================================
-- TABLA: pomodoro_sessions
-- Historial de sesiones de pomodoro
-- =============================================
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES todo_tasks(id) ON DELETE SET NULL,
    
    type INTEGER NOT NULL DEFAULT 0, -- 0: Work, 1: ShortBreak, 2: LongBreak
    duration_minutes INTEGER NOT NULL,
    was_completed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Índices para sesiones
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_started_at ON pomodoro_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task_id ON pomodoro_sessions(task_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Políticas para todo_tasks
CREATE POLICY "Users can view their own tasks"
    ON todo_tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
    ON todo_tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON todo_tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
    ON todo_tasks FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para pomodoro_sessions
CREATE POLICY "Users can view their own sessions"
    ON pomodoro_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
    ON pomodoro_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON pomodoro_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para todo_tasks
DROP TRIGGER IF EXISTS update_todo_tasks_updated_at ON todo_tasks;
CREATE TRIGGER update_todo_tasks_updated_at
    BEFORE UPDATE ON todo_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCIÓN: Crear perfil de usuario automáticamente
-- Se ejecuta cuando un usuario se registra
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil cuando se registra un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista de estadísticas diarias
CREATE OR REPLACE VIEW daily_stats AS
SELECT 
    user_id,
    DATE(started_at) as date,
    COUNT(*) FILTER (WHERE type = 0) as work_sessions,
    COUNT(*) FILTER (WHERE type = 0 AND was_completed) as completed_work_sessions,
    SUM(duration_minutes) FILTER (WHERE type = 0 AND was_completed) as total_work_minutes
FROM pomodoro_sessions
GROUP BY user_id, DATE(started_at);

-- =============================================
-- DATOS DE EJEMPLO (opcional, comentar en producción)
-- =============================================

-- Para insertar datos de ejemplo, primero necesitas un usuario autenticado
-- Estos son solo ejemplos de la estructura

/*
-- Ejemplo de tarea
INSERT INTO todo_tasks (user_id, title, description, estimated_pomodoros, priority)
VALUES 
    ('user-uuid-here', 'Completar documentación', 'Escribir README y guías', 3, 1);

-- Ejemplo de sesión
INSERT INTO pomodoro_sessions (user_id, task_id, type, duration_minutes, was_completed)
VALUES 
    ('user-uuid-here', 'task-uuid-here', 0, 25, true);
*/
