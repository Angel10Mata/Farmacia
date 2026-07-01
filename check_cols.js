const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  "https://lummydhbopboatrepubp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1bW15ZGhib3Bib2F0cmVwdWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNTI4MDUsImV4cCI6MjA5NzYyODgwNX0.rev5sKEI61cOpklCjtFcpsMmUyD8sJPPV4ud46Ga57Q"
);
async function run() {
  const { data, error } = await supabase.from('inv_productos').select('*').limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log(data.length > 0 ? Object.keys(data[0]) : "Empty table");
  }
}
run();
