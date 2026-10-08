import { Router } from 'express';
import { getHistoricalRainfallIndex, getLiveRainfallSimilarity, findSimilarSignificantEpisodes } from '../services/historicalRainfall.service.js';
import { getHistoricalIntelligence } from '../services/historicalIntelligence.service.js';

const router = Router();

/**
 * GET /api/history/rainfall/summary
 * Exposes 10-year historical rainfall dataset metadata, quality validation, distribution statistics, and episode counts.
 */
router.get('/rainfall/summary', (req, res) => {
  try {
    const indexData = getHistoricalRainfallIndex();
    
    res.status(200).json({
      location: indexData.metadata.location,
      coordinates: indexData.metadata.coordinates,
      coverage: {
        startDate: indexData.metadata.startDate,
        endDate: indexData.metadata.endDate,
        totalHourlyRecords: indexData.metadata.totalHourlyRecords,
        totalDailyRecords: indexData.metadata.totalDailyRecords,
        expectedDailyRecords: indexData.metadata.expectedDailyRecords,
        missingHours: indexData.metadata.missingHours
      },
      dataQualityValidation: indexData.qualityValidation,
      rainfallDistributionStats: indexData.distributionStats,
      episodeDetection: {
        thresholds: indexData.episodeThresholds,
        totalSignificantEpisodes: indexData.totalSignificantEpisodes
      },
      storage: {
        format: 'JSON Index (offline fast lookup)',
        path: 'src/data/historicalRainfallIndex.json'
      },
      dataSource: 'Open-Meteo Historical Weather API (https://archive-api.open-meteo.com/v1/archive)'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve historical rainfall summary',
      message: error.message
    });
  }
});

/**
 * GET /api/history/rainfall/similar
 * Compares precipitation features against 10-year historical rainfall index.
 */
router.get('/rainfall/similar', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const mode = req.query.mode || 'significant-events';

    if (req.query.totalRainfall24h !== undefined || req.query.maxHourlyRainfall !== undefined) {
      const customFeatures = {
        totalRainfall24h: parseFloat(req.query.totalRainfall24h) || 0,
        maxHourlyRainfall: parseFloat(req.query.maxHourlyRainfall) || 0,
        rainfall6h: parseFloat(req.query.rainfall6h) || 0,
        rainfall12h: parseFloat(req.query.rainfall12h) || 0
      };

      const result = findSimilarSignificantEpisodes(customFeatures, limit);
      return res.status(200).json({
        liveLocation: 'Delhi',
        coordinates: { latitude: 28.6139, longitude: 77.2090 },
        weatherSource: 'Test Input Parameters',
        ...result
      });
    }

    const result = await getLiveRainfallSimilarity(limit, mode);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to execute historical rainfall similarity search',
      message: error.message
    });
  }
});

/**
 * GET /api/history/intelligence
 * Connects rainfall similarity to verified historical waterlogging incident evidence.
 * Query Parameters:
 * - limit: number of results (default 5)
 * - totalRainfall24h, maxHourlyRainfall, rainfall6h, rainfall12h (optional test overrides)
 */
router.get('/intelligence', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    let customFeatures = null;

    if (req.query.totalRainfall24h !== undefined || req.query.maxHourlyRainfall !== undefined) {
      customFeatures = {
        totalRainfall24h: parseFloat(req.query.totalRainfall24h) || 0,
        maxHourlyRainfall: parseFloat(req.query.maxHourlyRainfall) || 0,
        rainfall6h: parseFloat(req.query.rainfall6h) || 0,
        rainfall12h: parseFloat(req.query.rainfall12h) || 0
      };
    }

    const intelligence = await getHistoricalIntelligence(customFeatures, limit);
    res.status(200).json(intelligence);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve historical flood intelligence',
      message: error.message
    });
  }
});

export default router;
