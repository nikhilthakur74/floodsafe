import { historicalEvents } from '../data/historicalEvents.js';
import { calculateRelativeElevationAnalysis } from './elevation.service.js';
import { getDelhiForecast } from './weather.service.js';
import { calculateRainfallIntensityRisk, calculateRainfallSimilarity, getSeverityLevel } from './risk.service.js';
import { getReplayEventById } from './replay.service.js';
import { getHistoricalIntelligence } from './historicalIntelligence.service.js';

/**
 * Route Risk Analysis & Recommendation Service
 *
 * Computes explainable risk component averages, full-geometry hotspot distance measurements,
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
function generateRiskExplanations({ rainfallRisk, historicalWaterloggingRisk, terrainRisk }, detectedHotspots = [], intel = null, dataStatus = {}) {
  const explanations = [];

  // 1. Rainfall / Weather Explanation
  if (dataStatus.weather && dataStatus.weather.status === 'unavailable') {
    explanations.push('Live weather forecast data is currently unavailable (HTTP 429). Live flood risk could not be assessed.');
  } else if (rainfallRisk !== null && rainfallRisk >= 60) {
    explanations.push('Historical rainfall pattern indicates elevated rainfall intensity risk.');
  } else if (rainfallRisk !== null && rainfallRisk > 0) {
    explanations.push('Rainfall intensity is low-to-moderate for this scenario.');
  } else if (rainfallRisk !== null) {
    explanations.push('No significant rainfall intensity detected.');
  } else {
    explanations.push('Live weather forecast data is currently unavailable.');
  }

  // 2. Historical Waterlogging & Intelligence Explanation
  if (intel && !intel.isSignificant) {
    explanations.push('Current rainfall is below the significant-rainfall threshold. Heavy-rain historical flood evidence is not applied.');
  } else if (intel && intel.isSignificant) {
    const hasLinkedIncident = !!intel.hasLinkedIncident;
    const incidentTitle = intel.matchedIncidentTitle;
    const episodeLabel = incidentTitle || (intel.matchedEpisode ? `historical episode (${intel.matchedEpisode})` : 'a historical rainfall episode');

    if (hasLinkedIncident && detectedHotspots.length > 0) {
      const primarySpot = detectedHotspots[0];
      const spotNames = detectedHotspots.map(h => `${h.name} (${h.distanceMeters}m away)`).join(', ');

      const incidentLocations = intel.matchedIncidentEvent?.documentedWaterloggingLocations || intel.matchedIncidentEvent?.waterloggingLocations || [];
      const spotInIncident = incidentLocations.some(l => l.name === primarySpot.name);

      if (spotInIncident) {
        explanations.push(`Current rainfall pattern resembles ${incidentTitle}. ${primarySpot.name} was documented as waterlogged during that event and is approximately ${primarySpot.distanceMeters}m from this route.`);
      } else {
        explanations.push(`Current rainfall pattern resembles ${incidentTitle}, but ${primarySpot.name} was not documented as waterlogged during that specific event. Route passes in direct geographic proximity to documented waterlogging location(s): ${spotNames}.`);
      }
    } else if (hasLinkedIncident && detectedHotspots.length === 0) {
      explanations.push(`Current rainfall pattern resembles ${incidentTitle}, but No coordinate-backed hotspot detected on this route.`);
    } else if (!hasLinkedIncident) {
      // Episode has NO linked incident (e.g. episode-2021-08-02)
      if (detectedHotspots.length > 0) {
        const spotNames = detectedHotspots.map(h => `${h.name} (${h.distanceMeters}m away)`).join(', ');
        explanations.push(`Current rainfall pattern resembles ${episodeLabel}, but linked waterlogging evidence is unavailable. Route passes in direct geographic proximity to documented waterlogging location(s): ${spotNames}.`);
      } else {
        explanations.push(`Current rainfall pattern resembles ${episodeLabel}, but linked waterlogging evidence is unavailable. No coordinate-backed hotspot detected on this route.`);
      }
    }
  } else if (detectedHotspots.length > 0) {
    const spotNames = detectedHotspots.map(h => `${h.name} (${h.distanceMeters}m away)`).join(', ');
    explanations.push(`Route passes in direct geographic proximity to documented waterlogging location(s): ${spotNames}.`);
  } else {
    explanations.push('No coordinate-backed hotspot detected on this route.');
  }

  // 3. Terrain Explanation
  if (dataStatus.elevation && (dataStatus.elevation.status === 'unavailable' || dataStatus.elevation.isDegraded)) {
    explanations.push('Elevation data is currently unavailable. Terrain assessment is excluded from the risk index.');
  } else if (terrainRisk !== null && terrainRisk >= 50) {
    explanations.push('Terrain elevation profile indicates low-lying segments susceptible to water pooling.');
  } else if (terrainRisk !== null) {
    explanations.push('Terrain elevation profile contributed moderately to the estimated risk.');
  } else {
    explanations.push('Elevation data is currently unavailable. Terrain assessment is excluded from the risk index.');
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
  let weatherStatus = { status: 'ok', source: 'Open-Meteo', isFallback: false };

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

    weatherStatus = {
      status: 'ok',
      source: `Historical Replay Dataset (${targetEvent ? targetEvent.title : eventId})`,
      isFallback: false,
      message: 'Using historical event rainfall dataset.'
    };

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
      if (forecastData && forecastData.forecast && forecastData.status !== 'unavailable') {
        rainfallMm = forecastData.forecast.next24HoursMm || 0;
        weatherStatus = {
          status: forecastData.status || 'ok',
          source: forecastData.source || 'Open-Meteo',
          isFallback: !!forecastData.isFallback,
          isCached: !!forecastData.isCached
        };
      } else {
        weatherStatus = {
          status: 'unavailable',
          source: forecastData?.source || 'Open-Meteo (Unavailable)',
          isFallback: true,
          isUnavailable: true,
          message: 'Live weather forecast data is currently unavailable (HTTP 429). Live flood risk could not be assessed.'
        };
      }
    } catch (e) {
      weatherStatus = {
        status: 'unavailable',
        source: 'Open-Meteo (Unavailable)',
        isFallback: true,
        isUnavailable: true,
        message: 'Live weather forecast data is currently unavailable. Live flood risk could not be assessed.'
      };
    }
  }

  // Obtain Historical Event Intelligence
  const intelligence = await getHistoricalIntelligence(customFeatures, 5);
  const isSignificant = intelligence.isSignificant;

  const sampledPoints = sampleGeometryPoints(route.geometry, 10);
  const isLiveWeatherUnavailable = (mode === 'live' && weatherStatus.status === 'unavailable');

  const pointRainfallRisk = isLiveWeatherUnavailable ? null : (calculateRainfallIntensityRisk(rainfallMm) || 20);

  // Case A: If rainfall is NOT significant or live weather unavailable, similarity contribution = 0 or null
  const topSimilarity = (isSignificant && intelligence.similarEpisodes.length > 0)
    ? (intelligence.similarEpisodes[0].similarity || 0.8)
    : 0;
  const pointSimilarityRisk = isLiveWeatherUnavailable ? null : (isSignificant ? Math.round(topSimilarity * 100) : 0);

  const pointScores = [];
  const pointRainfallRisks = [];
  const pointHistoricalRisks = [];
  const pointSimilarityRisks = [];
  const pointTerrainRisks = [];
  const detectedHotspotMap = new Map();

  // Full-geometry hotspot detection and peak historical signal evaluation
  let maxFullGeometrySignalScore = 0;
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
    if (historicalInfo.signalScore > maxFullGeometrySignalScore) {
      maxFullGeometrySignalScore = historicalInfo.signalScore;
    }
  }

  // Route-level historical waterlogging signal score derived from full route geometry
  const routeHistoricalSignalScore = (isSignificant && !isLiveWeatherUnavailable) ? maxFullGeometrySignalScore : 0;

  let elevationSuccessCount = 0;
  for (const [lat, lng] of sampledPoints) {
    const terrainAnalysis = await calculateRelativeElevationAnalysis(lat, lng);
    let terrainRisk = null;
    if (terrainAnalysis) {
      elevationSuccessCount++;
      terrainRisk = terrainAnalysis.riskScore;
    }
    pointTerrainRisks.push(terrainRisk);

    if (!isLiveWeatherUnavailable) {
      let weightSum = 0;
      let totalW = 0;

      if (pointRainfallRisk !== null) {
        weightSum += pointRainfallRisk * 0.30;
        totalW += 0.30;
      }
      if (routeHistoricalSignalScore !== null) {
        weightSum += routeHistoricalSignalScore * 0.35;
        totalW += 0.35;
      }
      if (pointSimilarityRisk !== null) {
        weightSum += pointSimilarityRisk * 0.20;
        totalW += 0.20;
      }
      if (terrainRisk !== null) {
        weightSum += terrainRisk * 0.15;
        totalW += 0.15;
      }

      const segmentRisk = totalW > 0 ? Math.round(weightSum / totalW) : 0;
      pointScores.push(segmentRisk);
      pointRainfallRisks.push(pointRainfallRisk);
      pointHistoricalRisks.push(routeHistoricalSignalScore);
      pointSimilarityRisks.push(pointSimilarityRisk);
    }
  }

  let elevationStatus = { status: 'ok', isDegraded: false, source: 'Open-Meteo Elevation API' };
  if (elevationSuccessCount === 0) {
    elevationStatus = {
      status: 'unavailable',
      isDegraded: true,
      isUnavailable: true,
      source: 'Open-Meteo Elevation API (Unavailable)',
      message: 'Elevation API request failed. Terrain assessment is unavailable.'
    };
  } else if (elevationSuccessCount < sampledPoints.length) {
    elevationStatus = {
      status: 'degraded',
      isDegraded: true,
      source: 'Open-Meteo Elevation API (Partial)',
      message: 'Partial elevation data retrieved. Terrain assessment is degraded.'
    };
  }

  const dataStatus = {
    weather: weatherStatus,
    elevation: elevationStatus
  };

  let average = null;
  let maximum = null;
  let highRiskPointCount = 0;
  let highRiskPercentage = 0;

  if (!isLiveWeatherUnavailable && pointScores.length > 0) {
    average = Math.round(pointScores.reduce((a, b) => a + b, 0) / pointScores.length);
    maximum = Math.max(...pointScores);
    highRiskPointCount = pointScores.filter(s => s >= 60).length;
    highRiskPercentage = Math.round((highRiskPointCount / pointScores.length) * 100);
  }

  const avgRainfallRisk = pointRainfallRisks.length > 0 ? Math.round(pointRainfallRisks.reduce((a, b) => a + b, 0) / pointRainfallRisks.length) : null;
  const avgHistoricalRisk = pointHistoricalRisks.length > 0 ? Math.round(pointHistoricalRisks.reduce((a, b) => a + b, 0) / pointHistoricalRisks.length) : null;
  const avgSimilarityRisk = pointSimilarityRisks.length > 0 ? Math.round(pointSimilarityRisks.reduce((a, b) => a + b, 0) / pointSimilarityRisks.length) : null;

  const validTerrainRisks = pointTerrainRisks.filter(r => r !== null);
  const avgTerrainRisk = validTerrainRisks.length > 0 ? Math.round(validTerrainRisks.reduce((a, b) => a + b, 0) / validTerrainRisks.length) : null;

  const hotspotList = Array.from(detectedHotspotMap.values());

  // Historical intelligence object for route
  const topMatchedEpisode = (intelligence.similarEpisodes && intelligence.similarEpisodes.length > 0)
    ? intelligence.similarEpisodes[0]
    : null;

  const topEvidence = (intelligence.historicalEvidence && intelligence.historicalEvidence.length > 0)
    ? intelligence.historicalEvidence[0]
    : null;

  const matchedIncidentTitle = targetEvent ? targetEvent.title : (topEvidence && topEvidence.matchedIncidentEvent ? topEvidence.matchedIncidentEvent.title : null);
  const matchedIncidentEvent = targetEvent ? targetEvent : (topEvidence ? topEvidence.matchedIncidentEvent : null);
  const hasLinkedIncident = !!matchedIncidentTitle;

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
    matchedEpisode: targetEvent ? targetEvent.id : (topMatchedEpisode ? topMatchedEpisode.episodeId : null),
    matchedIncidentTitle,
    matchedIncidentEvent,
    hasLinkedIncident,
    similarity: topMatchedEpisode ? topMatchedEpisode.similarity : (targetEvent ? 1.0 : 0),
    historicalWording: topEvidence ? topEvidence.historicalWording : intelligence.wordingNotice,
    detectedHotspots: hotspotList,
    textualEvidences
  };

  const riskExplanation = generateRiskExplanations({
    rainfallRisk: avgRainfallRisk,
    historicalWaterloggingRisk: avgHistoricalRisk,
    terrainRisk: avgTerrainRisk
  }, hotspotList, routeIntelligence, dataStatus);

  return {
    average,
    maximum,
    highRiskPointCount,
    highRiskPercentage,
    liveRiskAssessed: !isLiveWeatherUnavailable,
    detectedHotspots: hotspotList,
    dataStatus,
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
  const { mode = 'live', eventId = null } = modeOptions;
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
        liveRiskAssessed: riskData.liveRiskAssessed,
        dataStatus: riskData.dataStatus,
        detectedHotspots: riskData.detectedHotspots,
        components: riskData.components,
        historicalIntelligence: riskData.historicalIntelligence
      },
      liveRiskAssessed: riskData.liveRiskAssessed,
      dataStatus: riskData.dataStatus,
      historicalIntelligence: riskData.historicalIntelligence,
      riskExplanation: riskData.riskExplanation
    });
  }

  const minDuration = Math.min(...analyzedRoutes.map(r => r.durationSeconds));
  const maxDuration = Math.max(...analyzedRoutes.map(r => r.durationSeconds));
  // Establish a minimum 5-minute (300s) normalization window to prevent sub-minute duration noise from artificially dominating flood risk
  const durationWindow = Math.max(maxDuration - minDuration, 300);

  const isLiveWeatherUnavailable = (mode === 'live' && analyzedRoutes.some(r => !r.liveRiskAssessed || r.dataStatus?.weather?.status === 'unavailable'));

  const rankedRoutes = analyzedRoutes.map(r => {
    const durationNorm = ((r.durationSeconds - minDuration) / durationWindow) * 100;

    let recommendationScore;
    if (isLiveWeatherUnavailable || r.risk.average === null || r.risk.maximum === null) {
      recommendationScore = Math.round(durationNorm);
    } else {
      const compositeFloodRisk = r.risk.average * 0.4 + r.risk.maximum * 0.6;
      recommendationScore = Math.round(durationNorm * 0.35 + compositeFloodRisk * 0.65);
    }

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

  // Route-flip evaluation: Compare fastest route vs recommended route
  const fastestRoute = finalRoutes.reduce((prev, curr) => curr.durationSeconds < prev.durationSeconds ? curr : prev);
  const recommendedRoute = finalRoutes.find(r => r.id === recommendedId);

  let routeFlip = { flipped: false, fastestRouteId: null, recommendedRouteId: null, hotspotName: null, message: null };
  if (!isLiveWeatherUnavailable && fastestRoute && recommendedRoute && fastestRoute.id !== recommendedRoute.id) {
    const fastestHotspots = fastestRoute.risk?.detectedHotspots || [];
    const hotspotName = fastestHotspots.length > 0 ? fastestHotspots[0].name : null;

    routeFlip = {
      flipped: true,
      fastestRouteId: fastestRoute.id,
      recommendedRouteId: recommendedRoute.id,
      hotspotName: hotspotName,
      message: hotspotName
        ? `Fastest route passes through documented waterlogging location (${hotspotName}). Recommended alternative route to reduce risk.`
        : `Fastest route has elevated prototype risk index (${fastestRoute.risk.maximum || fastestRoute.risk.average}). Recommended alternative route to reduce risk.`
    };
  }

  let scenarioLabel = 'Live Conditions';
  if (mode === 'historical') {
    scenarioLabel = (eventId === 'delhi-july-08-2023' || !eventId)
      ? 'Historical Replay — 8 July 2023'
      : `Historical Replay — ${eventId}`;
  }

  const coverageDisclosure = 'Historical coverage: 1 of 12 recorded waterlogging locations has coordinates.';

  let recommendationRationale;
  if (isLiveWeatherUnavailable) {
    recommendationRationale = `Live flood risk could not be assessed due to weather service unavailability (HTTP 429 / Network Error). Route "${recommendedRoute.name}" is selected based on estimated travel time only.`;
  } else {
    recommendationRationale = `Route "${recommendedRoute.name}" is comparatively preferable among the alternatives based on prototype risk index (${recommendedRoute.risk.maximum || recommendedRoute.risk.average}) and estimated travel time.`;
  }

  const firstRoute = finalRoutes[0];
  const aggregateDataStatus = firstRoute ? firstRoute.dataStatus : {
    weather: { status: mode === 'live' ? 'unavailable' : 'ok' },
    elevation: { status: 'ok' }
  };

  return {
    routes: finalRoutes,
    recommendedRouteId: recommendedId,
    scenarioMode: mode,
    scenarioLabel,
    coverageDisclosure,
    recommendationRationale,
    routeFlip,
    liveRiskAssessed: !isLiveWeatherUnavailable,
    dataStatus: aggregateDataStatus
  };
}
