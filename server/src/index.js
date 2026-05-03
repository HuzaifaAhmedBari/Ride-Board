require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// In production on Vercel, the frontend and backend share the same domain, 
// so we can be more flexible with CORS.
app.use(cors({ 
  origin: process.env.CLIENT_ORIGIN || true,
  credentials: true
}));
app.use(express.json());

// Health check to verify deployment
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/rides',    require('./routes/rides'));
app.use('/api/search',   require('./routes/search'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/reviews',  require('./routes/reviews'));

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
