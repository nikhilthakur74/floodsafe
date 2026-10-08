/**
 * Weather Service for FloodSafe
 * Fetches real-time precipitation forecast data from Open-Meteo API
 */

const DELHI_LAT = 28.6139;
const DELHI_LON = 77.2090;
const OPEN_METEO_URL = `https://api.open-meteo.com/v1/forecast?latitude=${DELHI_LAT}&longitude=${DELHI_LON}&hourly=precipitation`;

/**
 * Helper to sum precipitation values over a given slice of hours
 */
function sumPrecipitation(hourlyArray, startIndex, hours) {
  if (!hourlyArray || hourlyArray.length === 0) return 0;
  const slice = hourlyArray.slice(startIndex, startIndex + hours);
  const sum = slice.reduce((acc, val) => acc + (val || 0), 0);
  return Number(sum.toFixed(2));
}

/**
 * Helper to find max hourly precipitation over a given slice of hours
 */
function maxPrecipitation(hourlyArray, startIndex, hours) {
  if (!hourlyArray || hourlyArray.length === 0) return 0;
  const slice = hourlyArray.slice(startIndex, startIndex + hours);
  const max = Math.max(...slice.map(v => v || 0));
  return Number(max.toFixed(2));
}

/**
 * Fetch and calculate Delhi precipitation forecast from Open-Meteo API
 */
export async function getDelhiForecast() {
  try {
    const response = await fetch(OPEN_METEO_URL);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API request failed with status: ${response.status}`);
    }

    const rawData = await response.json();

    const hourlyTime = rawData.hourly?.time || [];
    const hourlyPrecip = rawData.hourly?.precipitation || [];

    // Find starting hour index matching current time (or fallback to index 0)
    const now = new Date();
    let currentIndex = 0;

    const foundIndex = hourlyTime.findIndex(t => {
      const timeDate = new Date(t);
      return timeDate.getTime() >= now.getTime() - (60 * 60 * 1000);
    });

    if (foundIndex !== -1) {
      currentIndex = foundIndex;
    }

    const forecast = {
      next1HourMm: sumPrecipitation(hourlyPrecip, currentIndex, 1),
      next3HoursMm: sumPrecipitation(hourlyPrecip, currentIndex, 3),
      next6HoursMm: sumPrecipitation(hourlyPrecip, currentIndex, 6),
      next12HoursMm: sumPrecipitation(hourlyPrecip, currentIndex, 12),
      next24HoursMm: sumPrecipitation(hourlyPrecip, currentIndex, 24),
      maxHourlyMm: maxPrecipitation(hourlyPrecip, currentIndex, 24),
    };

    return {
      location: 'Delhi',
      coordinates: {
        latitude: DELHI_LAT,
        longitude: DELHI_LON,
      },
      forecast,
      source: 'Open-Meteo',
      rawOpenMeteo: rawData // Kept for raw inspection/verification
    };
  } catch (error) {
    console.error('[Weather Service Error]:', error.message);
    throw error;
  }
}
