import { historicalEvents } from '../data/historicalEvents.js';

/**
 * Historical Similarity Service
 * 
 * Compares current rainfall metrics against historical records using 
 * normalized Manhattan/Euclidean distance heuristics.
 * 
 * Note: Similarity scores represent relative pattern proximity for research 
 * reference and are not scientifically validated predictions.
 */

/**
 * Find similar historical events based on 6-hour and 24-hour rainfall conditions
 * 
 * @param {Object} currentRainfall - Current rainfall conditions
 * @param {number} currentRainfall.rainfall6hMm - 6-hour rainfall in mm
 * @param {number} currentRainfall.rainfall24hMm - 24-hour rainfall in mm
 * @param {number} [limit=5] - Maximum number of similar events to return
 */
export function findSimilarHistoricalEvents({ rainfall6hMm = 0, rainfall24hMm = 0 }, limit = 5) {
  const totalEvents = historicalEvents.length;

  if (totalEvents === 0) {
    return {
      similarEvents: [],
      waterloggingEvents: 0,
      totalEvents: 0,
      disclaimer: 'Distance-heuristic comparison model. Dataset currently unpopulated; no verified historical events recorded yet.'
    };
  }

  // Calculate distance metric for each recorded event
  const scoredEvents = historicalEvents.map((event) => {
    const difference6h = Math.abs(rainfall6hMm - event.rainfall6hMm);
    const difference24h = Math.abs(rainfall24hMm - event.rainfall24hMm);

    // Simple normalized distance heuristic (lower distance = higher similarity)
    const distanceScore = Number((difference6h * 1.5 + difference24h).toFixed(2));

    return {
      ...event,
      similarityDistance: distanceScore,
    };
  });

  // Sort by lowest distance score (closest match first)
  scoredEvents.sort((a, b) => a.similarityDistance - b.similarityDistance);

  const topSimilar = scoredEvents.slice(0, limit);
  const waterloggingCount = topSimilar.filter(e => e.waterlogging).length;

  return {
    similarEvents: topSimilar,
    waterloggingEvents: waterloggingCount,
    totalEvents: totalEvents,
    disclaimer: 'Distance-heuristic comparison model; not scientifically validated.'
  };
}

/**
 * Get all historical dataset entries for Delhi
 */
export function getHistoricalDataset() {
  const totalEvents = historicalEvents.length;
  const waterloggingEvents = historicalEvents.filter(e => e.waterlogging).length;

  return {
    location: 'Delhi',
    totalEvents,
    waterloggingEvents,
    events: historicalEvents,
    isPopulated: totalEvents > 0,
    message: totalEvents === 0
      ? 'Verified historical waterlogging events for Delhi have not yet been populated in the dataset.'
      : 'Historical waterlogging events dataset loaded.'
  };
}
