import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const { data: d1, error: e1 } = await supabase.from('transacciones').select('*').limit(1);
  console.log('transacciones:', d1 ? 'exists' : 'does not exist or error', e1 ? e1.message : '');
  
  const { data: d2, error: e2 } = await supabase.from('movimientos').select('*').limit(1);
  console.log('movimientos:', d2 ? 'exists' : 'does not exist or error', e2 ? e2.message : '');

  const { data: d3, error: e3 } = await supabase.from('abonos').select('*').limit(1);
  console.log('abonos:', d3 ? 'exists' : 'does not exist or error', e3 ? e3.message : '');
}

checkTables();
