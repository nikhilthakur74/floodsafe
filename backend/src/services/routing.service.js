/**
 * Routing Service for FloodSafe
 * Provider abstraction supporting OpenRouteService (via HeiGIT) with fallback to OSRM.
 */

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';
const ORS_BASE_URL = 'https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson';

/**
 * Fetch routes using OpenRouteService GeoJSON endpoint if API key is configured
 */
async function fetchOpenRouteServiceRoutes(start, destination, apiKey) {
  try {
    const body = {
      coordinates: [
        [start.longitude, start.latitude],
        [destination.longitude, destination.latitude]
      ],
      alternative_routes: {
        target_count: 3,
        weight_factor: 2.0,
        share_factor: 0.7
      }
    };

    const response = await fetch(ORS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`OpenRouteService HTTP error: ${response.status}`);
    }

    const geoJsonData = await response.json();
    const features = geoJsonData.features || [];

    if (features.length === 0) {
      throw new Error('No features returned from OpenRouteService GeoJSON endpoint');
    }

    const normalized = features.map((feature, idx) => {
      const summary = feature.properties?.summary || {};
      const rawCoords = feature.geometry?.coordinates || [];
      // GeoJSON coordinates are [lng, lat]. Convert to [lat, lng] for Leaflet
      const latLngGeometry = rawCoords.map(([lng, lat]) => [lat, lng]);

      return {
        id: `route-${idx + 1}`,
        name: idx === 0 ? 'Primary Route (ORS)' : `Alternative Route ${idx} (ORS)`,
        distanceMeters: Math.round(summary.distance || 0),
        durationSeconds: Math.round(summary.duration || 0),
        geometry: latLngGeometry,
        provider: 'OpenRouteService'
      };
    });

    return {
      provider: 'OpenRouteService',
      statusMessage: 'Routes retrieved successfully via OpenRouteService.',
      count: normalized.length,
      alternativesAvailable: normalized.length > 1,
      routes: normalized
    };
  } catch (error) {
    console.warn('[OpenRouteService Fallback]:', error.message);
    return null;
  }
}

/**
 * Fetch routes using OSRM API (Fallback provider)
 */
async function fetchOsrmRoutes(start, destination) {
  const startCoords = `${start.longitude},${start.latitude}`;
  const destCoords = `${destination.longitude},${destination.latitude}`;
  const url = `${OSRM_BASE_URL}/${startCoords};${destCoords}?overview=full&geometries=geojson&alternatives=true`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OSRM Routing API returned status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No routes found between specified coordinates.');
  }

  const normalizedRoutes = data.routes.map((route, index) => {
    const rawCoords = route.geometry?.coordinates || [];
    const latLngGeometry = rawCoords.map(([lng, lat]) => [lat, lng]);

    return {
      id: `route-${index + 1}`,
      name: index === 0 ? 'Primary Route' : `Alternative Route ${index}`,
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      geometry: latLngGeometry,
      provider: 'OSRM'
    };
  });

  return {
    provider: 'OSRM',
    statusMessage: 'OpenRouteService unavailable; using OSRM fallback.',
    count: normalizedRoutes.length,
    alternativesAvailable: normalizedRoutes.length > 1,
    routes: normalizedRoutes
  };
}

/**
 * Unified Provider Abstraction method for retrieving driving routes
 */
export async function getRoutes(start, destination, options = {}) {
  if (!start || !destination || !start.latitude || !start.longitude || !destination.latitude || !destination.longitude) {
    throw new Error('Valid start and destination coordinates (latitude and longitude) are required.');
  }

  const orsKey = process.env.OPENROUTESERVICE_API_KEY;

  // Try OpenRouteService if API key is configured
  if (orsKey && orsKey.trim() !== '') {
    const orsResult = await fetchOpenRouteServiceRoutes(start, destination, orsKey.trim());
    if (orsResult && orsResult.routes.length > 0) {
      return orsResult;
    }
  }

  // Fallback to OSRM
  return await fetchOsrmRoutes(start, destination);
}
