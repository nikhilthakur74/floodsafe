import { Router } from 'express';
import { getElevation, calculateRelativeElevationAnalysis } from '../services/elevation.service.js';

const router = Router();

/**
 * GET /api/elevation
 * Query elevation for given lat/lng
 * Example: /api/elevation?lat=28.6139&lng=77.2090
 */
router.get('/', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      error: 'Invalid Parameters',
      message: "Please provide valid numeric 'lat' and 'lng' query parameters."
    });
  }

  const elevationData = await getElevation(lat, lng);
  if (!elevationData) {
    return res.status(502).json({
      error: 'Elevation Unavailable',
      message: 'Failed to fetch elevation from Open-Meteo.'
    });
  }

  res.status(200).json(elevationData);
});

/**
 * GET /api/elevation/relative
 * Query relative terrain elevation analysis
 */
router.get('/relative', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      error: 'Invalid Parameters',
      message: "Please provide valid numeric 'lat' and 'lng' query parameters."
    });
  }

  const analysis = await calculateRelativeElevationAnalysis(lat, lng);
  if (!analysis) {
    return res.status(502).json({
      error: 'Analysis Unavailable',
      message: 'Failed to compute relative elevation analysis.'
    });
  }

  res.status(200).json(analysis);
});

export default router;
