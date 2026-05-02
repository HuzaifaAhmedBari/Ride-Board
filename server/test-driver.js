const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  try {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    if (!users.length) return console.log('No users found');
    const driverId = users[0].id;
    console.log('Driver ID:', driverId);

    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'driver@rideboard.com',
      password: 'password123'
    });
    const token = authData.session.access_token;

    console.log('Fetching driver profile...');
    const res = await axios.get(`http://localhost:4000/api/users/${driverId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Driver Profile Loaded:', res.data.profile.name);
  } catch (err) {
    console.error('❌ Error:', err.response ? err.response.data : err.message);
  }
}
test();
