# Documentación de Arquitectura del Sistema (Admo Tech)

Este documento proporciona una visión general y técnica del sistema **Admo Tech**, detallando sus componentes principales, tecnologías utilizadas y el flujo de trabajo de procesamiento de datos. Puede ser utilizado como guía base para explicar la arquitectura a stakeholders técnicos o de negocio.

## 1. Visión General del Sistema

El sistema es una solución integral orientada al análisis de datos comerciales (Business Intelligence) y la gestión de ventas. Está compuesto por tres capas principales:

1. **Plataforma Web (Frontend/Backend):** Una aplicación moderna que sirve tanto de interfaz de usuario como de API, encargada de la autenticación, visualización de datos mediante dashboards (gráficos) e interacción directa con los usuarios.
2. **Motor ETL (Extract, Transform, Load):** Un conjunto de scripts robustos que automatizan la ingesta de archivos (CSV/Excel), validan y limpian la información bajo estrictas reglas de negocio, y la cargan en la base de datos principal.
3. **Base de Datos Centralizada:** Un repositorio relacional robusto que almacena los catálogos del sistema, las transacciones procesadas, datos para Business Intelligence (BI) y el registro de auditoría de todas las operaciones de carga.

---

## 2. Tecnologías Utilizadas

| Componente | Tecnologías Principales | Propósito |
| :--- | :--- | :--- |
| **Plataforma Web** | Next.js (React), Tailwind CSS, Recharts | Interfaz de usuario, enrutamiento, dashboards interactivos y estilos. |
| **Seguridad Web** | JWT (JSON Web Tokens), Bcryptjs | Autenticación basada en tokens y encriptado de contraseñas de usuarios. |
| **Motor ETL** | Python, Pandas, SQLAlchemy | Procesamiento masivo de datos tabulares y conexión a la base de datos. |
| **Base de Datos** | PostgreSQL (AWS RDS) | Almacenamiento seguro, escalable y relacional de toda la información. |

---

## 3. Arquitectura por Componentes

### 3.1. Plataforma Web (`back_admo_tech`)
Construida sobre **Next.js**, esta aplicación funge como la interfaz principal para los usuarios del sistema. 
* **Visualización de Datos:** Utiliza la librería **Recharts** para representar la información de las tablas especializadas (como `ventas_bi`) en gráficos dinámicos y KPIs (Key Performance Indicators).
* **Conexión Directa:** Se conecta directamente a PostgreSQL mediante el driver `pg` sin depender de ORMs pesados para consultas de solo lectura, logrando un alto rendimiento en la obtención de datos para los dashboards.
* **Seguridad:** Implementa protección de rutas y endpoints manejando de forma segura sesiones de usuario a través de JWT.

### 3.2. Motor de Procesamiento ETL (`etl_module`)
Es el corazón del procesamiento de datos que asegura la calidad e integridad de la información que ingresa al sistema (usualmente a través de exportaciones masivas). El ciclo del script principal (`main_etl.py`) se divide en tres fases:

1. **Extracción (Extract):** Lee de manera automática archivos en formatos estructurados (CSV, Excel) desde un directorio crudo (`data/raw`).
2. **Transformación y Limpieza (Transform):** Aplica reglas de negocio críticas para garantizar datos perfectos:
   * **Control de Nulos:** Evita que campos obligatorios (como `id_venta`, `id_cliente`) lleguen vacíos.
   * **Validación Lógica:** Bloquea valores negativos donde no corresponden (ej. precios o cantidades en el detalle de ventas).
   * **Integridad Referencial (Llaves Foráneas):** Se conecta a PostgreSQL en tiempo real para verificar que los IDs (clientes, sucursales, empleados, productos) referenciados en el archivo **existan realmente** en los catálogos de la base de datos.
   * **Control de Duplicados & Rango:** Remueve registros repetidos o fechas futuras irreales.
   > [!IMPORTANT]
   > Cualquier registro que falle una de estas validaciones no detiene el proceso; es automáticamente derivado a un log forense en formato CSV dentro del directorio `data/rejected/`, indicando el motivo exacto del rechazo para su posterior corrección y auditoría.
3. **Carga (Load):** Los registros "limpios" se insertan en PostgreSQL utilizando técnicas de carga en bloque optimizadas (chunks) para soportar altos volúmenes de transacciones sin impactar el rendimiento de la red.

### 3.3. Base de Datos Central y Auditoría
La estructura relacional incluye:
* **Catálogos Maestros:** `clientes`, `sucursales`, `empleados`, `productos`.
* **Transaccionales:** `ventas` (Cabecera) y `detalle_ventas` (Líneas de la factura).
* **Tablas Analíticas (BI):** Tablas optimizadas para el Dashboard (ej. `ventas_bi`), donde los ingresos totales son calculados a nivel de motor de base de datos (`ingreso_total = precio * cantidad`).
* **Auditoría (`auditoria_cargas`):** Cada vez que se ejecuta el motor ETL, se inserta automáticamente un registro que identifica qué archivo se procesó, quién fue el usuario responsable, cuántos registros fueron insertados con éxito, cuántos fueron rechazados y el estado final del proceso.

---

## 4. Flujo de Trabajo Resumido (Ejemplo de Ingesta)

1. El usuario deposita un nuevo archivo `.csv` (ej. reporte de ventas del mes) en la carpeta designada (`data/raw`).
2. Se lanza el comando de procesamiento referenciando el archivo y el ID del responsable.
3. **ETL** carga el archivo, se conecta a la base de datos para descargar temporalmente los catálogos válidos.
4. **ETL** procesa línea por línea. De 100,000 registros, determina que 99,500 son perfectos y 500 tienen errores (clientes inexistentes, cantidades negativas).
5. **ETL** inserta los 99,500 registros en la base de datos y guarda un archivo con los 500 fallidos en la carpeta de rechazados.
6. **ETL** guarda el registro en la tabla de auditoría con la firma del evento.
7. Los **Dashboards en Next.js** se actualizan automáticamente al consultar la base de datos y muestran las nuevas métricas a los directivos.
