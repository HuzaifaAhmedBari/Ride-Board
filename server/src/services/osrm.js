const axios = require('axios');

const MAX_POLYLINE_POINTS = 30;

/**
 * Reduce an array of [lng,lat] coordinates to at most maxPoints
 * using uniform stride sampling, preserving start and end points.
 */
function decimateCoords(coords, maxPoints) {
  if (coords.length <= maxPoints) return coords;
  const step = Math.ceil(coords.length / maxPoints);
  const out = [];
  for (let i = 0; i < coords.length; i += step) out.push(coords[i]);
  if (out[out.length - 1] !== coords[coords.length - 1]) {
    out.push(coords[coords.length - 1]);
  }
  return out;
}

/**
 * Returns a decimated GeoJSON LineString for the road-accurate path between two
 * coordinate pairs. Returns null on failure — polyline is optional, the ride
 * is still created without it.
 */
async function getPolyline(originLng, originLat, destLng, destLat) {
  try {
    const coords = `${originLng},${originLat};${destLng},${destLat}`;
    const { data } = await axios.get(
      `${process.env.OSRM_BASE_URL}/route/v1/driving/${coords}`,
      { params: { overview: 'full', geometries: 'geojson' }, timeout: 5000 }
    );
    if (data.code !== 'Ok') return null;
    const raw = data.routes[0].geometry.coordinates;
    return {
      type: 'LineString',
      coordinates: decimateCoords(raw, MAX_POLYLINE_POINTS)
    };
  } catch {
    return null;
  }
}

module.exports = { getPolyline };
