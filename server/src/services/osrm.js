const axios = require('axios');

// Returns a GeoJSON LineString for the road-accurate path between two points
// Returns null on failure — polyline is optional, ride still posts without it
async function getPolyline(originLng, originLat, destLng, destLat) {
  try {
    const coords = `${originLng},${originLat};${destLng},${destLat}`;
    const { data } = await axios.get(
      `${process.env.OSRM_BASE_URL}/route/v1/driving/${coords}`,
      { params: { overview: 'full', geometries: 'geojson' }, timeout: 5000 }
    );
    if (data.code !== 'Ok') return null;
    return data.routes[0].geometry;
  } catch {
    return null;
  }
}

module.exports = { getPolyline };
