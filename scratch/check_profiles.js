const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProfiles() {
  try {
    const { data, count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      console.log('Total profiles:', count);
      console.log('Profiles:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkProfiles();
