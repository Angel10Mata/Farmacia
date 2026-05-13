-- ============================================
-- FIX: Corregir las políticas RLS de proyectos
-- El rol se guarda en user_metadata, no en la raíz del JWT
-- ============================================

-- Eliminar las políticas actuales (con ruta incorrecta)
DROP POLICY IF EXISTS "Ver proyectos para usuarios autorizados" ON public.proyectos;
DROP POLICY IF EXISTS "Insertar proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Actualizar proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Eliminar proyectos" ON public.proyectos;

-- Recrear con la ruta correcta: auth.jwt() -> 'user_metadata' ->> 'rol'

CREATE POLICY "Ver proyectos para usuarios autorizados"
    ON public.proyectos
    FOR SELECT
    USING (
        auth.jwt() -> 'user_metadata' ->> 'rol' IN ('super', 'admin', 'proyectos')
    );

CREATE POLICY "Insertar proyectos"
    ON public.proyectos
    FOR INSERT
    WITH CHECK (
        auth.jwt() -> 'user_metadata' ->> 'rol' IN ('super', 'admin', 'proyectos')
    );

CREATE POLICY "Actualizar proyectos"
    ON public.proyectos
    FOR UPDATE
    USING (
        auth.jwt() -> 'user_metadata' ->> 'rol' IN ('super', 'admin', 'proyectos')
    )
    WITH CHECK (
        auth.jwt() -> 'user_metadata' ->> 'rol' IN ('super', 'admin', 'proyectos')
    );

CREATE POLICY "Eliminar proyectos"
    ON public.proyectos
    FOR DELETE
    USING (
        auth.jwt() -> 'user_metadata' ->> 'rol' IN ('super', 'admin', 'proyectos')
    );
