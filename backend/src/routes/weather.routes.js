import { Router } from 'express';
import { getDelhiForecast } from '../services/weather.service.js';

const router = Router();

/**
 * GET /api/weather/delhi
 * Returns clean hourly precipitation forecast for Delhi sourced from Open-Meteo API.
 */
router.get('/delhi', async (req, res) => {
  try {
    const data = await getDelhiForecast();

    // Omit internal rawOpenMeteo object for clean API response standard
    const responsePayload = {
      location: data.location,
      coordinates: data.coordinates,
      forecast: data.forecast,
      source: data.source
    };

    res.status(200).json(responsePayload);
  } catch (error) {
    res.status(502).json({
      error: 'Weather Service Unavailable',
      message: 'Failed to retrieve rainfall forecast from Open-Meteo.',
      details: error.message
    });
  }
});

export default router;
