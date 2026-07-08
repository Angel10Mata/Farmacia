El Control Financiero en tu aplicación (ubicado en VerFinanzas.tsx y gestionado mediante actions.ts) funciona como un libro mayor donde se registran y consultan todos los movimientos de dinero de la farmacia.

Aquí te detallo cómo está estructurado su funcionamiento principal:

1. Tipos de Movimiento
Todo el dinero que se mueve se clasifica estrictamente en dos tipos:

Ingresos (Entradas): Dinero que entra a la caja o a la empresa.
Egresos (Salidas): Dinero que sale por pagos, compras o gastos.
2. Categorización
Para tener un mejor análisis, cada movimiento (sea ingreso o egreso) pertenece a una Categoría específica:

Venta Directa (venta): Ingresos generados por las ventas en el mostrador.
Abono de Cliente (abono_cliente): Pagos que hacen los clientes para saldar o abonar a créditos.
Compra / Surtido (compra): Egresos realizados al comprar mercadería para el inventario.
Pago a Proveedor (pago_proveedor): Dinero que sale para pagar facturas o deudas pendientes con los proveedores.
Gasto Fijo (gasto_fijo): Salidas constantes como luz, agua, renta, internet.
Gasto Vario (gasto_vario): Cualquier otro gasto inesperado o menor (papelería, limpieza, etc.).
3. Registro de Datos
Por cada transacción que se guarda en la base de datos (fin_transacciones), el sistema registra:

El Monto exacto.
Una Descripción (para saber a qué correspondía exactamente).
El Usuario que registró el movimiento (para auditoría).
La Fecha y Hora exacta.
Una Referencia ID (Opcional): Esto es clave porque sirve para enlazar el movimiento financiero directamente con el ID de una venta o una compra específica en sus respectivos módulos.
4. Cálculos y Resumen en Tiempo Real
En la vista principal, el sistema suma todos los ingresos, suma todos los egresos y realiza la resta para mostrarte tu Balance Actual. Puedes usar la barra de búsqueda y los filtros para ver solo las entradas, solo las salidas, o buscar gastos específicos por su nombre o categoría.

En resumen: Funciona como el "centro nervioso" financiero. Algunos movimientos (como las Ventas) pueden llegar a registrarse automáticamente cuando se concreta una transacción en sus módulos, mientras que gastos específicos (como la luz, o un pago de emergencia) se pueden registrar manualmente usando los botones de Nuevo Ingreso y Nuevo Egreso.

