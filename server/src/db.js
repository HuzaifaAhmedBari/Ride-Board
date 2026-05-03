const { createClient } = require('@supabase/supabase-js');

// Singleton Supabase admin client shared across all route modules
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
