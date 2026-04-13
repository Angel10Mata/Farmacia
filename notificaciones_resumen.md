# RESUMEN DE IMPLEMENTACION: NOTIFICACIONES PUSH

# Este documento sirve como hoja de ruta para habilitar el sistema de notificaciones web push en la aplicación CERMAD.

#
# 1. INSTALACION DE DEPENDENCIAS
#

# Ejecutar el siguiente comando para instalar las librerías necesarias:

pnpm install web-push lucide-react next-themes

- web-push: Motor del servidor para enviar las alertas.
- lucide-react: Iconos de la campana y checkmark.
- next-themes: Detección de tema oscuro/claro para el icono.

#
# 2. ESTRUCTURA DE ARCHIVOS
#

# Lista de archivos a crear y su ubicación exacta:

- public/sw.js: Service Worker (agente de notificaciones en el navegador).

- src/utils/vapid.ts: Utilidad de conversión de llaves para el cliente.

- src/utils/push-utils.ts: Utilidades de servidor para envío masivo o selectivo.

- src/app/manifest.ts: Configuración PWA (obligatorio para móviles).

- src/app/api/push/route.ts: Endpoint para activar notificaciones.

- src/app/api/push/subscribe/route.ts: Endpoint para registrar/borrar suscripciones.

- src/components/ui/PushNotificationToggle.tsx: Componente visual del botón.

#
# 3. VARIABLES DE ENTORNO Y LLAVES VAPID
#

# Para generar las llaves necesarias, ejecuta este comando en tu terminal:

npx web-push generate-vapid-keys

Luego, configura los resultados en tu archivo .env.local:

- NEXT_PUBLIC_VAPID_PUBLIC_KEY: Llave de identificación pública para el navegador.

- VAPID_PRIVATE_KEY: Llave de firma secreta para el servidor.

#
# 4. ESQUEMA SQL (BASE DE DATOS)
#

# Copia y ejecuta este script en tu consola de SQL de #Supabase para crear la tabla de almacenamiento necesaria:

# Tabla para almacenar las suscripciones de notificaciones push

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

# Habilitar RLS (Row Level Security)

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

# Política para que los usuarios solo puedan gestionar sus propias suscripciones

CREATE POLICY "Usuarios pueden gestionar sus propias suscripciones" 
ON public.push_subscriptions 
FOR ALL 
USING (auth.uid() = user_id);
