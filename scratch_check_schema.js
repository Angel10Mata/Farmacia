const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://lummydhbopboatrepubp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1bW15ZGhib3Bib2F0cmVwdWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNTI4MDUsImV4cCI6MjA5NzYyODgwNX0.rev5sKEI61cOpklCjtFcpsMmUyD8sJPPV4ud46Ga57Q"
);

async function run() {
  const { data, error } = await supabase.from('inv_productos').select('proveedor_id').limit(1);
  if (error) {
    console.log("Column check failed:", error.message);
  } else {
    console.log("Column check succeeded! proveedor_id column exists now.");
  }
}
run();
