/**
 * FloodSafe Frontend API Client Service
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Check backend API health status
 */
export async function fetchHealthStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.warn('Backend API connection check failed:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Fetch Live Delhi Weather Forecast
 */
export async function fetchDelhiWeather() {
  try {
    const response = await fetch(`${API_BASE_URL}/weather/delhi`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.warn('Failed to fetch Delhi weather forecast:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Fetch all documented Historical Replay Events
 */
export async function fetchReplayEvents() {
  try {
    const response = await fetch(`${API_BASE_URL}/replay/events`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { ok: true, data: data.events || [] };
  } catch (error) {
    console.warn('Failed to fetch replay events:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Calculate Risk Score for a given historical event
 */
export async function calculateRiskScore(eventId) {
  try {
    const response = await fetch(`${API_BASE_URL}/risk/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.warn('Failed to calculate risk score:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Analyze Risk-Aware Routes between Start and Destination
 * Options: { mode: 'live' | 'historical', eventId: 'delhi-july-08-2023', startCoords, destCoords }
 */
export async function analyzeRoutes(startInput, destinationInput, options = {}) {
  const { mode = 'historical', eventId = 'delhi-july-08-2023', startCoords = null, destCoords = null } = options;

  const payload = {
    mode,
    eventId: mode === 'historical' ? eventId : null
  };

  if (startCoords && startCoords.latitude && startCoords.longitude) {
    payload.start = startCoords;
  } else {
    payload.startLocation = startInput;
  }

  if (destCoords && destCoords.latitude && destCoords.longitude) {
    payload.destination = destCoords;
  } else {
    payload.destinationLocation = destinationInput;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/routes/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.warn('Failed to analyze routes:', error);
    return { ok: false, error: error.message };
  }
}
