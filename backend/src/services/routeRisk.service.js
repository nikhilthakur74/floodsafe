import { historicalEvents } from '../data/historicalEvents.js';
import { calculateRelativeElevationAnalysis } from './elevation.service.js';
import { getDelhiForecast } from './weather.service.js';
import { calculateRainfallIntensityRisk, calculateRainfallSimilarity, getSeverityLevel } from './risk.service.js';
import { getReplayEventById } from './replay.service.js';
import { getHistoricalIntelligence } from './historicalIntelligence.service.js';

/**
 * Route Risk Analysis & Recommendation Service
 * 
 * Computes explainable risk component averages, hotspot distance measurements,
 * historical rainfall intelligence integration, and human-readable risk explanations
 * for genuine routing choices.
 */

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Check nearby historical waterlogging evidence strictly against verified non-null coordinates.
 * Prototype Radius:
 * <= 250m: strong historical signal (100)
 * 250m-500m: weaker signal (50)
 * > 500m: 0
 */
function getNearbyHistoricalSignal(lat, lng, targetEvent = null) {
  let maxSignal = 0;
  let nearestSpot = null;
  let minDistance = Infinity;

  const eventsToInspect = targetEvent ? [targetEvent] : historicalEvents;

  eventsToInspect.forEach(event => {
    (event.waterloggingLocations || []).forEach(loc => {
      if (loc.latitude !== null && loc.longitude !== null && !isNaN(loc.latitude) && !isNaN(loc.longitude)) {
        const distance = haversineDistanceMeters(lat, lng, loc.latitude, loc.longitude);
        if (distance <= 500) {
          if (distance < minDistance) {
            minDistance = distance;
          }
          if (distance <= 250) {
            if (100 > maxSignal) {
              maxSignal = 100;
              nearestSpot = { ...loc, distanceMeters: distance };
            }
          } else if (distance <= 500) {
            if (50 > maxSignal) {
              maxSignal = 50;
              nearestSpot = { ...loc, distanceMeters: distance };
            }
          }
        }
      }
    });
  });

  return { signalScore: maxSignal, nearestSpot, minDistance: minDistance !== Infinity ? minDistance : null };
}

function sampleGeometryPoints(geometry, sampleCount = 10) {
  if (!geometry || geometry.length === 0) return [];
  if (geometry.length <= sampleCount) return geometry;

  const step = (geometry.length - 1) / (sampleCount - 1);
  const sampled = [];
  for (let i = 0; i < sampleCount; i++) {
    const idx = Math.round(i * step);
    sampled.push(geometry[idx]);
  }
  return sampled;
}

/**
 * Generate human-readable risk explanations from calculated component averages and historical intelligence
 */
function generateRiskExplanations({ rainfallRisk, historicalWaterloggingRisk, terrainRisk }, detectedHotspots = [], intel = null) {
  const explanations = [];

  // 1. Rainfall Explanation
  if (rainfallRisk >= 60) {
    explanations.push('Historical rainfall pattern indicates elevated rainfall intensity risk.');
  } else if (rainfallRisk > 0) {
    explanations.push('Rainfall intensity is low-to-moderate for this scenario.');
  } else {
    explanations.push('No significant rainfall intensity detected.');
  }

  // 2. Historical Waterlogging & Intelligence Explanation
  if (intel && !intel.isSignificant) {
    explanations.push('Current rainfall is below the significant-rainfall threshold. Heavy-rain historical flood evidence is not applied.');
  } else if (detectedHotspots.length > 0) {
    const primarySpot = detectedHotspots[0];
    const spotNames = detectedHotspots.map(h => `${h.name} (${h.distanceMeters}m away)`).join(', ');
    
    if (intel && intel.matchedEpisode) {
      explanations.push(`Current rainfall pattern resembles the July 8, 2023 rainfall pattern. ${primarySpot.name} was documented as waterlogged during that event and is approximately ${primarySpot.distanceMeters}m from this route.`);
    } else {
      explanations.push(`Route passes in direct geographic proximity to documented waterlogging location(s): ${spotNames}.`);
    }
  } else if (intel && intel.isSignificant) {
    explanations.push('Current rainfall pattern resembles a historical event, but no coordinate-backed documented waterlogging location was detected along this route.');
  } else {
    explanations.push('No coordinate-backed historical waterlogging hotspot was detected along this route.');
  }

  // 3. Terrain Explanation
  if (terrainRisk >= 50) {
    explanations.push('Terrain elevation profile indicates low-lying segments susceptible to water pooling.');
  } else {
    explanations.push('Terrain elevation profile contributed moderately to the estimated risk.');
  }

  return explanations;
}

/**
 * Analyze single route risk under specified mode ('live' or 'historical')
 */
export async function analyzeRouteRisk(route, modeOptions = {}) {
  const { mode = 'live', eventId = null } = modeOptions;
  
  let rainfallMm = 1.4;
  let targetEvent = null;
  let customFeatures = null;

  if (mode === 'historical' && eventId) {
    targetEvent = getReplayEventById(eventId);
    if (targetEvent && targetEvent.rainfallStations && targetEvent.rainfallStations.length > 0) {
      const stationValues = targetEvent.rainfallStations.map(s => s.rainfallMm).filter(v => v !== null && !isNaN(v));
      if (stationValues.length > 0) {
        rainfallMm = Math.max(...stationValues);
      }
    } else {
      rainfallMm = 50;
    }

    // Historical replay mode rainfall vectors
    if (eventId.includes('2023-07-08') || eventId.includes('delhi-july-08-2023') || eventId.includes('july-08-2023')) {
      customFeatures = {
        totalRainfall24h: 34.4,
        maxHourlyRainfall: 11.5,
        rainfall6h: 26.0,
        rainfall12h: 34.4
      };
    } else if (eventId.includes('2024-07-24') || eventId.includes('delhi-july-24-2024')) {
      customFeatures = {
        totalRainfall24h: 27.0,
        maxHourlyRainfall: 12.0,
        rainfall6h: 18.0,
        rainfall12h: 22.0
      };
    } else {
      customFeatures = {
        totalRainfall24h: rainfallMm,
        maxHourlyRainfall: Math.round(rainfallMm / 3),
        rainfall6h: Math.round(rainfallMm * 0.7),
        rainfall12h: Math.round(rainfallMm * 0.9)
      };
    }
  } else {
    try {
      const forecastData = await getDelhiForecast();
      if (forecastData && forecastData.forecast) {
        rainfallMm = forecastData.forecast.next24HoursMm || 1.4;
      }
    } catch (e) {
      console.warn('[Route Risk] Using baseline weather data');
    }
  }

  // Obtain Historical Event Intelligence
  const intelligence = await getHistoricalIntelligence(customFeatures, 5);
  const isSignificant = intelligence.isSignificant;

  const sampledPoints = sampleGeometryPoints(route.geometry, 10);
  const pointRainfallRisk = calculateRainfallIntensityRisk(rainfallMm) || 20;

  // Case A: If rainfall is NOT significant, rainfall similarity contribution = 0
  const topSimilarity = (isSignificant && intelligence.similarEpisodes.length > 0)
    ? (intelligence.similarEpisodes[0].similarity || 0.8)
    : 0;
  const pointSimilarityRisk = isSignificant ? Math.round(topSimilarity * 100) : 0;

  const pointScores = [];
  const pointRainfallRisks = [];
  const pointHistoricalRisks = [];
  const pointSimilarityRisks = [];
  const pointTerrainRisks = [];
  const detectedHotspotMap = new Map();

  for (const [lat, lng] of (route.geometry || [])) {
    const historicalInfo = getNearbyHistoricalSignal(lat, lng, targetEvent);
    if (historicalInfo.nearestSpot) {
      const spotName = historicalInfo.nearestSpot.name;
      if (!detectedHotspotMap.has(spotName) || historicalInfo.nearestSpot.distanceMeters < detectedHotspotMap.get(spotName).distanceMeters) {
        detectedHotspotMap.set(spotName, {
          name: spotName,
          distanceMeters: historicalInfo.nearestSpot.distanceMeters,
          severity: historicalInfo.nearestSpot.severity,
          source: historicalInfo.nearestSpot.source,
          coordinateSource: historicalInfo.nearestSpot.coordinateSource
        });
      }
    }
  }

  for (const [lat, lng] of sampledPoints) {
    const historicalInfo = getNearbyHistoricalSignal(lat, lng, targetEvent);

    // Case A: If rainfall is NOT significant, historical waterlogging contribution = 0
    const historicalSignalScore = isSignificant ? historicalInfo.signalScore : 0;

    const terrainAnalysis = await calculateRelativeElevationAnalysis(lat, lng);
    const terrainRisk = terrainAnalysis ? terrainAnalysis.riskScore : 30;

    // Component weighted score for segment:
    // Rainfall 30%, Historical 35%, Similarity 20%, Terrain 15%
    const segmentRisk = Math.round(
      pointRainfallRisk * 0.30 +
      historicalSignalScore * 0.35 +
      pointSimilarityRisk * 0.20 +
      terrainRisk * 0.15
    );

    pointScores.push(segmentRisk);
    pointRainfallRisks.push(pointRainfallRisk);
    pointHistoricalRisks.push(historicalSignalScore);
    pointSimilarityRisks.push(pointSimilarityRisk);
    pointTerrainRisks.push(terrainRisk);
  }

  const average = Math.round(pointScores.reduce((a, b) => a + b, 0) / pointScores.length);
  const maximum = Math.max(...pointScores);
  const highRiskPointCount = pointScores.filter(s => s >= 60).length;
  const highRiskPercentage = Math.round((highRiskPointCount / pointScores.length) * 100);

  const avgRainfallRisk = Math.round(pointRainfallRisks.reduce((a, b) => a + b, 0) / pointRainfallRisks.length);
  const avgHistoricalRisk = Math.round(pointHistoricalRisks.reduce((a, b) => a + b, 0) / pointHistoricalRisks.length);
  const avgSimilarityRisk = Math.round(pointSimilarityRisks.reduce((a, b) => a + b, 0) / pointSimilarityRisks.length);
  const avgTerrainRisk = Math.round(pointTerrainRisks.reduce((a, b) => a + b, 0) / pointTerrainRisks.length);

  const hotspotList = Array.from(detectedHotspotMap.values());

  // Historical intelligence object for route
  const topMatchedEpisode = (intelligence.similarEpisodes && intelligence.similarEpisodes.length > 0)
    ? intelligence.similarEpisodes[0]
    : null;

  const topEvidence = (intelligence.historicalEvidence && intelligence.historicalEvidence.length > 0)
    ? intelligence.historicalEvidence[0]
    : null;

  const textualEvidences = [];
  if (topEvidence && topEvidence.matchedIncidentEvent) {
    (topEvidence.matchedIncidentEvent.documentedWaterloggingLocations || []).forEach(loc => {
      if (loc.latitude === null || loc.longitude === null) {
        textualEvidences.push({
          name: loc.name,
          severity: loc.severity,
          source: loc.source
        });
      }
    });
  }

  const routeIntelligence = {
    isSignificant,
    status: intelligence.status,
    matchedEpisode: topMatchedEpisode ? topMatchedEpisode.episodeId : null,
    similarity: topMatchedEpisode ? topMatchedEpisode.similarity : 0,
    historicalWording: topEvidence ? topEvidence.historicalWording : intelligence.wordingNotice,
    detectedHotspots: hotspotList,
    textualEvidences
  };

  const riskExplanation = generateRiskExplanations({
    rainfallRisk: avgRainfallRisk,
    historicalWaterloggingRisk: avgHistoricalRisk,
    terrainRisk: avgTerrainRisk
  }, hotspotList, routeIntelligence);

  return {
    average,
    maximum,
    highRiskPointCount,
    highRiskPercentage,
    detectedHotspots: hotspotList,
    components: {
      rainfallRisk: avgRainfallRisk,
      historicalWaterloggingRisk: avgHistoricalRisk,
      rainfallSimilarityRisk: avgSimilarityRisk,
      terrainRisk: avgTerrainRisk
    },
    historicalIntelligence: routeIntelligence,
    riskExplanation
  };
}

/**
 * Analyze multiple routes independently and calculate balanced recommendations
 */
export async function analyzeAndRankRoutes(routes, modeOptions = {}) {
  const analyzedRoutes = [];
  for (const route of routes) {
    const riskData = await analyzeRouteRisk(route, modeOptions);
    analyzedRoutes.push({
      ...route,
      risk: {
        average: riskData.average,
        maximum: riskData.maximum,
        highRiskPointCount: riskData.highRiskPointCount,
        highRiskPercentage: riskData.highRiskPercentage,
        detectedHotspots: riskData.detectedHotspots,
        components: riskData.components,
        historicalIntelligence: riskData.historicalIntelligence
      },
      historicalIntelligence: riskData.historicalIntelligence,
      riskExplanation: riskData.riskExplanation
    });
  }

  const minDuration = Math.min(...analyzedRoutes.map(r => r.durationSeconds));
  const maxDuration = Math.max(...analyzedRoutes.map(r => r.durationSeconds));

  const rankedRoutes = analyzedRoutes.map(r => {
    const durationNorm = maxDuration > minDuration
      ? ((r.durationSeconds - minDuration) / (maxDuration - minDuration)) * 100
      : 0;
    
    const compositeFloodRisk = r.risk.average * 0.4 + r.risk.maximum * 0.6;
    const recommendationScore = Math.round(durationNorm * 0.35 + compositeFloodRisk * 0.65);

    return {
      ...r,
      recommendationScore,
      severityLevel: getSeverityLevel(r.risk.maximum)
    };
  });

  rankedRoutes.sort((a, b) => a.recommendationScore - b.recommendationScore);

  const recommendedId = rankedRoutes[0].id;
  
  const finalRoutes = rankedRoutes.map(r => ({
    ...r,
    isRecommended: r.id === recommendedId
  }));

  return {
    routes: finalRoutes,
    recommendedRouteId: recommendedId
  };
}

