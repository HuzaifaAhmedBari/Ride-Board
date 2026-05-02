const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  try {
    console.log('1. Logging in as the dummy driver to get an auth token...');
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: 'driver@rideboard.com',
      password: 'password123'
    });

    if (error) throw error;
    const token = authData.session.access_token;
    
    console.log('2. Testing the /api/search endpoint with auth token...');
    const res = await axios.post('http://localhost:4000/api/search', {
      pickup_lat: 24.9180, 
      pickup_lng: 67.0971,
      dropoff_lat: 24.8138, 
      dropoff_lng: 67.0325
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.data.length > 0) {
      console.log(`✅ Success! Found ${res.data.length} ride(s).`);
      console.log('\nMatched Ride Details:');
      console.log(`- Driver: ${res.data[0].poster.name}`);
      console.log(`- From: ${res.data[0].origin_address}`);
      console.log(`- To: ${res.data[0].destination_address}`);
      console.log(`- Seats: ${res.data[0].seats_remaining} available`);
    } else {
      console.log('❌ Failed: Search returned 0 rides (expected 1).');
    }
  } catch(e) {
    console.error('❌ Error:', e.response ? e.response.data : e.message);
  }
}

test();
