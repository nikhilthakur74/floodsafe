import { Router } from 'express';
import { calculateReplayRisk } from '../services/risk.service.js';

const router = Router();

/**
 * POST /api/risk/calculate
 * Calculates explainable 4-component waterlogging risk score including terrain
 */
router.post('/calculate', async (req, res) => {
  const { eventId, latitude, longitude } = req.body;

  if (!eventId) {
    return res.status(400).json({
      error: 'Missing Parameter',
      message: "Please provide an 'eventId' in the request body."
    });
  }

  try {
    const lat = latitude !== undefined && latitude !== null ? parseFloat(latitude) : null;
    const lng = longitude !== undefined && longitude !== null ? parseFloat(longitude) : null;

    const result = await calculateReplayRisk(eventId, lat, lng);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      error: 'Risk Calculation Error',
      message: error.message
    });
  }
});

export default router;
