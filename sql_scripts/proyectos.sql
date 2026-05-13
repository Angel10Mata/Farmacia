-- Creación de la tabla de proyectos
CREATE TABLE IF NOT EXISTS public.proyectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    cliente_nombre TEXT,
    cliente_telefono TEXT,
    cliente_correo TEXT,
    vendedor_nombre TEXT,
    otros_campos JSONB DEFAULT '{}'::jsonb,
    fecha_entrega DATE,
    precio NUMERIC(15,2) DEFAULT 0,
    aplica_vendedor BOOLEAN DEFAULT true,
    porcentaje_vendedor NUMERIC(5,2) DEFAULT 10,
    aplica_iva BOOLEAN DEFAULT true,
    porcentaje_iva NUMERIC(5,2) DEFAULT 12,
    aplica_doc BOOLEAN DEFAULT true,
    porcentaje_doc NUMERIC(5,2) DEFAULT 10,
    mantenimiento_fecha DATE,
    mantenimiento_categoria TEXT,
    resto_desarrollo NUMERIC(15,2) GENERATED ALWAYS AS (
        precio 
        - (CASE WHEN aplica_vendedor THEN (precio * porcentaje_vendedor / 100) ELSE 0 END)
        - (CASE WHEN aplica_iva THEN (precio * porcentaje_iva / 100) ELSE 0 END)
        - (CASE WHEN aplica_doc THEN (precio * porcentaje_doc / 100) ELSE 0 END)
    ) STORED,
    activo BOOLEAN DEFAULT true,
    estado TEXT DEFAULT 'En Progreso',
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios con rol 'super', 'admin' o 'proyectos' pueden ver todos los proyectos
CREATE POLICY "Ver proyectos para usuarios autorizados"
    ON public.proyectos
    FOR SELECT
    USING (
        auth.jwt() ->> 'rol' IN ('super', 'admin', 'proyectos')
    );

-- Política: Insertar proyectos
CREATE POLICY "Insertar proyectos"
    ON public.proyectos
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'rol' IN ('super', 'admin', 'proyectos')
    );

-- Política: Actualizar proyectos
CREATE POLICY "Actualizar proyectos"
    ON public.proyectos
    FOR UPDATE
    USING (
        auth.jwt() ->> 'rol' IN ('super', 'admin', 'proyectos')
    )
    WITH CHECK (
        auth.jwt() ->> 'rol' IN ('super', 'admin', 'proyectos')
    );

-- Política: Eliminar proyectos (opcional, si decides borrar en lugar de usar el booleano 'activo')
CREATE POLICY "Eliminar proyectos"
    ON public.proyectos
    FOR DELETE
    USING (
        auth.jwt() ->> 'rol' IN ('super', 'admin', 'proyectos')
    );
