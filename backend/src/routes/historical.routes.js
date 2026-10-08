import { Router } from 'express';
import { getHistoricalDataset, findSimilarHistoricalEvents } from '../services/historical.service.js';

const router = Router();

/**
 * GET /api/historical/delhi
 * Returns the current historical waterlogging dataset for Delhi
 */
router.get('/delhi', (req, res) => {
  const datasetInfo = getHistoricalDataset();
  res.status(200).json(datasetInfo);
});

/**
 * GET /api/historical/similarity
 * Query similarity for given rainfall parameters
 * Example: /api/historical/similarity?rainfall6hMm=15&rainfall24hMm=40
 */
router.get('/similarity', (req, res) => {
  const rainfall6hMm = parseFloat(req.query.rainfall6hMm) || 0;
  const rainfall24hMm = parseFloat(req.query.rainfall24hMm) || 0;

  const result = findSimilarHistoricalEvents({ rainfall6hMm, rainfall24hMm });
  res.status(200).json(result);
});

export default router;
