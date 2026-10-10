/**
 * Elevation Service for FloodSafe
 * Queries elevation data from Open-Meteo Elevation API
 */

const OPEN_METEO_ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation';
const elevationCacheMap = new Map();

export function clearElevationCache() {
  elevationCacheMap.clear();
}

/**
 * Get elevation (in meters) for a single lat/lng point
 */
export async function getElevation(latitude, longitude) {
  if (latitude === null || longitude === null || latitude === undefined || longitude === undefined) {
    return null;
  }

  try {
    const response = await fetch(`${OPEN_METEO_ELEVATION_URL}?latitude=${latitude}&longitude=${longitude}`);
    if (!response.ok) {
      throw new Error(`Elevation API returned status: ${response.status}`);
    }

    const data = await response.json();
    const elevation = data.elevation && data.elevation.length > 0 ? data.elevation[0] : null;

    if (elevation === null) return null;

    return {
      latitude: Number(latitude),
      longitude: Number(longitude),
      elevationMeters: Number(elevation.toFixed(1)),
      source: 'Open-Meteo Elevation API'
    };
  } catch (error) {
    console.warn('[Elevation Service Error]:', error.message);
    return null;
  }
}

/**
 * Get elevations for target location + 4 surrounding compass cardinal points (N, S, E, W)
 */
export async function calculateRelativeElevationAnalysis(latitude, longitude) {
  if (latitude === null || longitude === null || latitude === undefined || longitude === undefined) {
    return null;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

  if (elevationCacheMap.has(cacheKey)) {
    return elevationCacheMap.get(cacheKey);
  }

  const offset = 0.005; // ~500m offset for local terrain comparison

  const points = [
    { name: 'target', lat, lng },
    { name: 'north', lat: lat + offset, lng },
    { name: 'south', lat: lat - offset, lng },
    { name: 'east', lat, lng: lng + offset },
    { name: 'west', lat, lng: lng - offset }
  ];

  try {
    const lats = points.map(p => p.lat).join(',');
    const lngs = points.map(p => p.lng).join(',');

    const response = await fetch(`${OPEN_METEO_ELEVATION_URL}?latitude=${lats}&longitude=${lngs}`);
    if (!response.ok) {
      throw new Error(`Batch elevation query failed: ${response.status}`);
    }

    const data = await response.json();
    const elevations = data.elevation || [];

    if (elevations.length < 5) {
      return null;
    }

    const targetElevation = Number(elevations[0].toFixed(1));
    const surroundingElevations = elevations.slice(1, 5);
    const surroundingAvg = Number((surroundingElevations.reduce((a, b) => a + b, 0) / 4).toFixed(1));
    const relativeElevation = Number((targetElevation - surroundingAvg).toFixed(1));

    const riskScore = calculateTerrainRisk(relativeElevation);

    let explanation = '';
    if (relativeElevation < 0) {
      explanation = `${Math.abs(relativeElevation)} m lower than nearby terrain`;
    } else if (relativeElevation > 0) {
      explanation = `${relativeElevation} m higher than nearby terrain`;
    } else {
      explanation = 'Level with nearby terrain';
    }

    const result = {
      targetElevationMeters: targetElevation,
      surroundingAverageMeters: surroundingAvg,
      relativeElevationMeters: relativeElevation,
      explanation,
      riskScore
    };
    elevationCacheMap.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn('[Relative Elevation Calculation Error]:', error.message);
    return null;
  }
}

/**
 * Convert relative elevation to a 0-100 prototype terrain risk score
 * Lower target terrain relative to surroundings = higher water pooling risk
 */
export function calculateTerrainRisk(relativeElevationMeters) {
  if (relativeElevationMeters === null || relativeElevationMeters === undefined) {
    return null;
  }

  const rel = relativeElevationMeters;

  if (rel <= -5) {
    return Math.min(100, Math.round(86 + Math.abs(rel + 5) * 2)); // 86-100 (Very High)
  } else if (rel <= -2) {
    return Math.round(66 + ((Math.abs(rel) - 2) / 3) * 19); // 66-85 (High)
  } else if (rel <= 0) {
    return Math.round(36 + (Math.abs(rel) / 2) * 29); // 36-65 (Moderate)
  } else if (rel <= 2) {
    return Math.round(16 + ((2 - rel) / 2) * 19); // 16-35 (Low)
  } else {
    return Math.max(0, Math.round(15 - (rel - 2) * 3)); // 0-15 (Very Low)
  }
}
