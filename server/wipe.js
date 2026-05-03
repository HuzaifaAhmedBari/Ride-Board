require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function wipe() {
  console.log('Wiping all data...');
  
  // Wipe application tables
  await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('rides').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Wipe all auth users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (users) {
    for (const u of users) {
      await supabase.auth.admin.deleteUser(u.id);
    }
  }
  
  console.log('Database wiped completely.');
}

wipe().catch(console.error);
