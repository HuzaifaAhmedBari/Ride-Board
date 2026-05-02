require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seed() {
  console.log('Starting seed process...');

  // 1. Create a dummy driver
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'driver@rideboard.com',
    password: 'password123',
    email_confirm: true
  });

  if (authError) {
    console.error('Error creating auth user. (They might already exist!)', authError.message);
  }
  
  const userId = authData?.user?.id;
  
  if (userId) {
    console.log('Created auth user:', userId);

    // 2. Create public profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        name: 'Ali Khan',
        phone: '03001234567'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError.message);
    } else {
      console.log('Created public profile for Ali Khan');
    }

    // 3. Create a sample ride (from Gulshan to Clifton, Karachi)
    const { data: rideData, error: rideError } = await supabase
      .from('rides')
      .insert({
        poster_id: userId,
        origin_address: 'Gulshan-e-Iqbal, Karachi',
        origin_lat: 24.9180,
        origin_lng: 67.0971,
        destination_address: 'Clifton, Karachi',
        destination_lat: 24.8138,
        destination_lng: 67.0325,
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        total_seats: 4,
        seats_remaining: 4,
        fare_per_seat: 500,
        status: 'active'
      })
      .select()
      .single();

    if (rideError) {
      console.error('Error creating ride:', rideError.message);
    } else {
      console.log('✅ Created sample ride: Gulshan-e-Iqbal -> Clifton');
    }
  }

  console.log('\n--- Seed Completed ---');
  console.log('You can log in with:');
  console.log('Email: driver@rideboard.com');
  console.log('Password: password123');
}

seed();
