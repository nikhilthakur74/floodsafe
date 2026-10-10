import { getVerifiedHistoricalReplayRoutes } from '../data/verifiedReplayRoutes.js';

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

const routingCacheMap = new Map();

const DEMO_START = { latitude: 28.6435, longitude: 77.2215 };
const DEMO_DEST = { latitude: 28.5562, longitude: 77.1000 };
const REPLAY_COORDINATE_TOLERANCE_DEG = 0.008; // ~800m coordinate tolerance for historical replay endpoint matching

/**
 * Helper to test if coordinates match the specific historical replay journey (within 0.008 deg tolerance)
 */
function isMatchingReplayEndpoints(start, dest) {
  if (!start || !dest || start.latitude == null || start.longitude == null || dest.latitude == null || dest.longitude == null) {
    return false;
  }

  const startLatDiff = Math.abs(Number(start.latitude) - DEMO_START.latitude);
  const startLngDiff = Math.abs(Number(start.longitude) - DEMO_START.longitude);
  const destLatDiff = Math.abs(Number(dest.latitude) - DEMO_DEST.latitude);
  const destLngDiff = Math.abs(Number(dest.longitude) - DEMO_DEST.longitude);

  return (
    startLatDiff <= REPLAY_COORDINATE_TOLERANCE_DEG &&
    startLngDiff <= REPLAY_COORDINATE_TOLERANCE_DEG &&
    destLatDiff <= REPLAY_COORDINATE_TOLERANCE_DEG &&
    destLngDiff <= REPLAY_COORDINATE_TOLERANCE_DEG
  );
}

/**
 * Unified Provider Abstraction method for retrieving driving routes
 */
export async function getRoutes(start, destination, options = {}) {
  const { mode = 'live' } = options;

  if (!start || !destination || !start.latitude || !start.longitude || !destination.latitude || !destination.longitude) {
    throw new Error('Valid start and destination coordinates (latitude and longitude) are required.');
  }

  // Historical Replay mode directly uses verified precomputed route geometries for its specific journey
  if (mode === 'historical' && isMatchingReplayEndpoints(start, destination)) {
    return getVerifiedHistoricalReplayRoutes();
  }

  const cacheKey = `${Number(start.latitude).toFixed(4)},${Number(start.longitude).toFixed(4)}-${Number(destination.latitude).toFixed(4)},${Number(destination.longitude).toFixed(4)}`;
  const orsKey = process.env.OPENROUTESERVICE_API_KEY;

  // Try OpenRouteService if API key is configured
  if (orsKey && orsKey.trim() !== '') {
    const orsResult = await fetchOpenRouteServiceRoutes(start, destination, orsKey.trim());
    if (orsResult && orsResult.routes.length > 0) {
      routingCacheMap.set(cacheKey, orsResult);
      return orsResult;
    }
  }

  // Fallback to OSRM
  try {
    const osrmResult = await fetchOsrmRoutes(start, destination);
    if (osrmResult && osrmResult.routes.length > 0) {
      routingCacheMap.set(cacheKey, osrmResult);
      return osrmResult;
    }
  } catch (osrmError) {
    console.warn('[OSRM Fallback Error]:', osrmError.message);
  }

  // If network providers fail, check in-memory routing cache for previously retrieved real network route
  if (routingCacheMap.has(cacheKey)) {
    const cachedResult = routingCacheMap.get(cacheKey);
    return {
      ...cachedResult,
      isCached: true,
      statusMessage: `${cachedResult.provider} (Cached real route geometry; network offline).`
    };
  }

  // Fallback for historical replay if network failed and endpoints match replay journey
  if (mode === 'historical' && isMatchingReplayEndpoints(start, destination)) {
    return getVerifiedHistoricalReplayRoutes();
  }

  // In Live Mode (or unmatched historical endpoints when network fails):
  // Return an honest unavailable status (never synthetic fake routes or unrelated replay routes)
  return {
    provider: 'Unavailable',
    statusMessage: 'External routing providers (OpenRouteService and OSRM) are unreachable. Driving route geometries are unavailable.',
    count: 0,
    alternativesAvailable: false,
    isUnavailable: true,
    routes: []
  };
}
