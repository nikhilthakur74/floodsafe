import { Router } from 'express';
import { geocodeLocation } from '../services/geocoding.service.js';
import { getRoutes } from '../services/routing.service.js';
import { analyzeAndRankRoutes } from '../services/routeRisk.service.js';

const router = Router();

/**
 * POST /api/routes/analyze
 * Accepts start/destination coordinates (or text locations), mode ('live' | 'historical'),
 * and optional eventId for historical replay analysis.
 */
router.post('/analyze', async (req, res) => {
  let { start, destination, startLocation, destinationLocation, mode = 'live', eventId = null } = req.body;

  try {
    // Handle text location geocoding if lat/lng not directly provided
    if ((!start || !start.latitude) && startLocation) {
      const geoStart = await geocodeLocation(startLocation);
      start = { latitude: geoStart.latitude, longitude: geoStart.longitude };
    }

    if ((!destination || !destination.latitude) && destinationLocation) {
      const geoDest = await geocodeLocation(destinationLocation);
      destination = { latitude: geoDest.latitude, longitude: geoDest.longitude };
    }

    // Default fallback coordinates for Delhi Connaught Place -> Airport if missing
    if (!start || !start.latitude) {
      start = { latitude: 28.6318, longitude: 77.2194 };
    }
    if (!destination || !destination.latitude) {
      destination = { latitude: 28.5554, longitude: 77.0848 };
    }

    // 1. Retrieve route geometry & alternatives using provider abstraction (ORS / OSRM)
    const routingResult = await getRoutes(start, destination);

    // 2. Sample, analyze risk under specified mode ('live' or 'historical'), and rank routes
    const analysisResult = await analyzeAndRankRoutes(routingResult.routes, { mode, eventId });

    res.status(200).json({
      provider: routingResult.provider,
      mode,
      eventId: mode === 'historical' ? eventId : null,
      startCoordinates: start,
      destinationCoordinates: destination,
      alternativesAvailable: routingResult.alternativesAvailable,
      count: analysisResult.routes.length,
      recommendedRouteId: analysisResult.recommendedRouteId,
      routes: analysisResult.routes
    });
  } catch (error) {
    console.error('[Route Analyze Endpoint Error]:', error.message);
    res.status(500).json({
      error: 'Route Analysis Failed',
      message: error.message
    });
  }
});

export default router;
