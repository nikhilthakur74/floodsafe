import { getReplayEventById } from './replay.service.js';
import { calculateRelativeElevationAnalysis } from './elevation.service.js';

/**
 * Risk Calculation Service for FloodSafe - Milestone 5 Terrain Integration
 * 
 * Prototype Weights:
 * - Rainfall Intensity Risk: 30% (0.30)
 * - Historical Waterlogging Risk: 35% (0.35)
 * - Rainfall Pattern Similarity: 20% (0.20)
 * - Terrain Elevation Risk: 15% (0.15)
 * 
 * Note: Prototype parameters for hackathon demonstration. Not scientifically validated.
 */

export function calculateRainfallIntensityRisk(maxRainfallMm) {
  if (maxRainfallMm === null || maxRainfallMm === undefined || isNaN(maxRainfallMm)) {
    return null;
  }

  const mm = Math.max(0, maxRainfallMm);

  if (mm <= 25) {
    return Math.round((mm / 25) * 33);
  } else if (mm <= 50) {
    return Math.round(33 + ((mm - 25) / 25) * 33);
  } else if (mm <= 75) {
    return Math.round(66 + ((mm - 50) / 25) * 19);
  } else {
    return Math.min(100, Math.round(85 + ((mm - 75) / 25) * 15));
  }
}

export function calculateHistoricalWaterloggingRisk(locations = []) {
  if (!locations || locations.length === 0) {
    return 0;
  }

  let totalPoints = 0;
  locations.forEach(loc => {
    if (loc.severity === 'high') {
      totalPoints += 25;
    } else if (loc.severity === 'medium') {
      totalPoints += 15;
    } else {
      totalPoints += 10;
    }
  });

  return Math.min(100, totalPoints);
}

export function calculateRainfallSimilarity(maxRainfallMm, benchmarkMm = 90) {
  if (maxRainfallMm === null || maxRainfallMm === undefined) {
    return null;
  }

  const diff = Math.abs(maxRainfallMm - benchmarkMm);
  return Math.max(0, 100 - Math.round(diff * 1.2));
}

export function getSeverityLevel(score) {
  if (score <= 25) return 'LOW';
  if (score <= 50) return 'MODERATE';
  if (score <= 75) return 'HIGH';
  return 'SEVERE';
}

/**
 * Calculate combined 4-component risk score for an event or specific location
 */
export async function calculateReplayRisk(eventId, overrideLat = null, overrideLng = null) {
  const event = getReplayEventById(eventId);
  if (!event) {
    throw new Error(`Event with ID '${eventId}' not found.`);
  }

  // 1. Max documented rainfall
  let maxRainfallMm = null;
  if (event.rainfallStations && event.rainfallStations.length > 0) {
    const values = event.rainfallStations.map(s => s.rainfallMm).filter(v => v !== null && v !== undefined);
    if (values.length > 0) {
      maxRainfallMm = Math.max(...values);
    }
  }

  // 2. Compute components
  const rainfallRisk = calculateRainfallIntensityRisk(maxRainfallMm);
  const historicalWaterloggingRisk = calculateHistoricalWaterloggingRisk(event.waterloggingLocations);
  const rainfallSimilarityRisk = calculateRainfallSimilarity(maxRainfallMm, 90);

  // 3. Terrain elevation analysis (if coordinates available or provided)
  let terrainAnalysis = null;
  let terrainRisk = null;

  // Use Delhi default center (28.6139, 77.2090) if event locations have null coordinates
  const targetLat = overrideLat !== null ? overrideLat : (event.latitude || 28.6139);
  const targetLng = overrideLng !== null ? overrideLng : (event.longitude || 77.2090);

  if (targetLat !== null && targetLng !== null) {
    terrainAnalysis = await calculateRelativeElevationAnalysis(targetLat, targetLng);
    if (terrainAnalysis) {
      terrainRisk = terrainAnalysis.riskScore;
    }
  }

  // 4. Weighted combination (Rainfall: 30%, Historical: 35%, Similarity: 20%, Terrain: 15%)
  const weights = {
    rainfallRisk: 0.30,
    historicalWaterloggingRisk: 0.35,
    rainfallSimilarityRisk: 0.20,
    terrainRisk: 0.15
  };

  let weightedSum = 0;
  let totalWeight = 0;

  if (rainfallRisk !== null) {
    weightedSum += rainfallRisk * weights.rainfallRisk;
    totalWeight += weights.rainfallRisk;
  }

  if (historicalWaterloggingRisk !== null) {
    weightedSum += historicalWaterloggingRisk * weights.historicalWaterloggingRisk;
    totalWeight += weights.historicalWaterloggingRisk;
  }

  if (rainfallSimilarityRisk !== null) {
    weightedSum += rainfallSimilarityRisk * weights.rainfallSimilarityRisk;
    totalWeight += weights.rainfallSimilarityRisk;
  }

  if (terrainRisk !== null) {
    weightedSum += terrainRisk * weights.terrainRisk;
    totalWeight += weights.terrainRisk;
  }

  const finalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const level = getSeverityLevel(finalScore);

  return {
    eventId: event.id,
    eventTitle: event.title,
    eventDate: event.date,
    maxRainfallObservedMm: maxRainfallMm,
    score: finalScore,
    level,
    components: {
      rainfallRisk,
      historicalWaterloggingRisk,
      rainfallSimilarityRisk,
      terrainRisk
    },
    terrain: terrainAnalysis ? {
      targetElevationMeters: terrainAnalysis.targetElevationMeters,
      surroundingAverageMeters: terrainAnalysis.surroundingAverageMeters,
      relativeElevationMeters: terrainAnalysis.relativeElevationMeters,
      explanation: terrainAnalysis.explanation
    } : null,
    weightsUsed: weights,
    disclaimer: 'Estimate based on documented historical events, terrain elevation heuristics, and prototype scoring. Not an official flood warning.'
  };
}
