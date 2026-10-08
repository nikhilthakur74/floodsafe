/**
 * Geocoding Service for FloodSafe
 * Converts place names to latitude/longitude coordinates using Nominatim API
 * with fallback presets for major Delhi landmarks.
 */

const PRESET_COORDINATES = {
  'connaught place, delhi': { latitude: 28.6318, longitude: 77.2194, displayName: 'Connaught Place, New Delhi' },
  'connaught place': { latitude: 28.6318, longitude: 77.2194, displayName: 'Connaught Place, New Delhi' },
  'indira gandhi international airport, delhi': { latitude: 28.5554, longitude: 77.0848, displayName: 'Indira Gandhi International Airport, Delhi' },
  'indira gandhi international airport': { latitude: 28.5554, longitude: 77.0848, displayName: 'Indira Gandhi International Airport, Delhi' },
  'airport': { latitude: 28.5554, longitude: 77.0848, displayName: 'Indira Gandhi International Airport, Delhi' },
  'minto bridge': { latitude: 28.6327, longitude: 77.2215, displayName: 'Minto Bridge Underpass, New Delhi' },
  'rohtak road': { latitude: 28.6742, longitude: 77.1511, displayName: 'Rohtak Road, Delhi' },
  'central station': { latitude: 28.6430, longitude: 77.2194, displayName: 'New Delhi Railway Station' },
  'riverfront park': { latitude: 28.6655, longitude: 77.2345, displayName: 'Yashwant Place / Riverfront' }
};

export async function geocodeLocation(query) {
  if (!query || typeof query !== 'string') {
    return null;
  }

  const normalized = query.trim().toLowerCase();
  if (PRESET_COORDINATES[normalized]) {
    return PRESET_COORDINATES[normalized];
  }

  try {
    const encoded = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FloodSafeHackathon/1.0 (environmental-risk-app)'
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding HTTP error: ${response.status}`);
    }

    const results = await response.json();
    if (results && results.length > 0) {
      return {
        latitude: parseFloat(results[0].lat),
        longitude: parseFloat(results[0].lon),
        displayName: results[0].display_name
      };
    }
  } catch (error) {
    console.warn('[Geocoding Service Warning]:', error.message);
  }

  // Fallback if not found or network error
  return {
    latitude: 28.6318,
    longitude: 77.2194,
    displayName: query
  };
}
