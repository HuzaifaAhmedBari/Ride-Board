const axios = require('axios');

// Free geocoding via OpenStreetMap Nominatim — no API key required
async function geocode(address) {
  const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: address, format: 'json', limit: 1 },
    headers: { 'User-Agent': 'RideBoard/1.0' },
    timeout: 5000
  });
  if (!data.length) throw new Error(`Could not geocode: ${address}`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

module.exports = { geocode };
