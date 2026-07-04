const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  "https://lummydhbopboatrepubp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1bW15ZGhib3Bib2F0cmVwdWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNTI4MDUsImV4cCI6MjA5NzYyODgwNX0.rev5sKEI61cOpklCjtFcpsMmUyD8sJPPV4ud46Ga57Q"
);
async function run() {
  const tables = ['inv_compras', 'inv_compras_detalles', 'inv_compras_pagos', 'inv_pagos', 'inv_proveedores_pagos', 'inv_pagos_compras'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`${table}: NOT FOUND OR ERROR (${error.message})`);
      } else {
        console.log(`${table}: EXISTS! Keys:`, data.length > 0 ? Object.keys(data[0]) : 'Empty');
      }
    } catch (e) {
      console.log(`${table}: ERROR (${e.message})`);
    }
  }
}
run();
