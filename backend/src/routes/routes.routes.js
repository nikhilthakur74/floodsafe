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
    const routingResult = await getRoutes(start, destination, { mode, eventId });

    if (routingResult.isUnavailable || !routingResult.routes || routingResult.routes.length === 0) {
      return res.status(503).json({
        provider: 'Unavailable',
        mode,
        eventId: mode === 'historical' ? eventId : null,
        scenarioMode: mode,
        scenarioLabel: mode === 'historical' ? 'Historical Replay — 8 July 2023' : 'Live Conditions',
        coverageDisclosure: 'Historical coverage: 1 of 12 recorded waterlogging locations has coordinates.',
        recommendationRationale: 'Routing service unavailable. Live route geometry could not be fetched.',
        routeFlip: { flipped: false },
        startCoordinates: start,
        destinationCoordinates: destination,
        alternativesAvailable: false,
        count: 0,
        recommendedRouteId: null,
        dataStatus: {
          routing: {
            provider: 'Unavailable',
            status: 'unavailable',
            isUnavailable: true,
            message: routingResult.statusMessage || 'External routing providers are unreachable.'
          },
          weather: { status: 'unavailable', isUnavailable: true },
          elevation: { status: 'unavailable', isUnavailable: true }
        },
        routes: [],
        error: 'Routing Unavailable',
        message: routingResult.statusMessage || 'External routing services (OpenRouteService and OSRM) are unreachable.'
      });
    }

    // 2. Sample, analyze risk under specified mode ('live' or 'historical'), and rank routes
    const analysisResult = await analyzeAndRankRoutes(routingResult.routes, { mode, eventId });

    const firstRoute = analysisResult.routes[0];
    const dataStatus = {
      routing: {
        provider: routingResult.provider,
        status: routingResult.provider === 'OpenRouteService' ? 'ok' : (routingResult.provider === 'Unavailable' ? 'unavailable' : 'fallback'),
        isFallback: routingResult.provider !== 'OpenRouteService' && routingResult.provider !== 'Unavailable',
        message: routingResult.statusMessage || `Routes retrieved via ${routingResult.provider}.`
      },
      weather: analysisResult.dataStatus?.weather || firstRoute?.risk?.dataStatus?.weather || firstRoute?.dataStatus?.weather || { status: 'ok', source: 'Open-Meteo' },
      elevation: analysisResult.dataStatus?.elevation || firstRoute?.risk?.dataStatus?.elevation || firstRoute?.dataStatus?.elevation || { status: 'ok', source: 'Open-Meteo Elevation API' }
    };

    res.status(200).json({
      provider: routingResult.provider,
      mode,
      eventId: mode === 'historical' ? eventId : null,
      scenarioMode: analysisResult.scenarioMode,
      scenarioLabel: analysisResult.scenarioLabel,
      coverageDisclosure: analysisResult.coverageDisclosure,
      recommendationRationale: analysisResult.recommendationRationale,
      routeFlip: analysisResult.routeFlip,
      startCoordinates: start,
      destinationCoordinates: destination,
      alternativesAvailable: routingResult.alternativesAvailable,
      count: analysisResult.routes.length,
      recommendedRouteId: analysisResult.recommendedRouteId,
      liveRiskAssessed: analysisResult.liveRiskAssessed !== undefined ? analysisResult.liveRiskAssessed : (mode !== 'live'),
      dataStatus,
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
