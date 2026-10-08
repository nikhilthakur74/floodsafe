import { historicalEvents } from '../data/historicalEvents.js';
import { findSimilarSignificantEpisodes, getLiveRainfallSimilarity } from './historicalRainfall.service.js';

/**
 * Relation mapping associating meteorological rainfall episodes to verified historical flood incident IDs
 */
const EPISODE_INCIDENT_RELATIONS = [
  {
    dateMatch: '2023-07-08',
    incidentEventId: 'delhi-july-08-2023'
  },
  {
    dateMatch: '2024-07-24',
    incidentEventId: 'delhi-july-24-2024'
  },
  {
    dateMatch: '2025-07',
    incidentEventId: 'delhi-july-2025'
  }
];

/**
 * Retrieve verified historical incident event associated with a meteorological rainfall episode
 */
export function getAssociatedIncidentEvent(episode) {
  if (!episode) return null;

  const relation = EPISODE_INCIDENT_RELATIONS.find(rel => {
    if (episode.episodeId && episode.episodeId.includes(rel.dateMatch)) return true;
    if (episode.id && episode.id.includes(rel.dateMatch)) return true;
    if (episode.startDate && episode.endDate) {
      const matchLen = rel.dateMatch.length;
      if (episode.startDate.slice(0, matchLen) <= rel.dateMatch && episode.endDate.slice(0, matchLen) >= rel.dateMatch) return true;
    }
    return false;
  });

  if (!relation) return null;

  return historicalEvents.find(ev => ev.id === relation.incidentEventId) || null;
}

/**
 * Generate location-specific historical flood intelligence connecting rainfall similarity to documented incident evidence.
 * 
 * Preserves mandatory safety wording:
 * - "historically associated with waterlogging"
 * - "similar historical rainfall pattern"
 * - "estimated risk"
 * - "historical evidence"
 */
export async function getHistoricalIntelligence(customFeatures = null, limit = 5) {
  let features = customFeatures;

  // If no custom features provided, fetch live weather forecast
  if (!features) {
    const liveRes = await getLiveRainfallSimilarity(limit, 'significant-events');
    features = liveRes.currentRainfallFeatures;
  }

  const similarityRes = findSimilarSignificantEpisodes(features, limit);

  if (!similarityRes.isSignificant) {
    return {
      status: 'low-rainfall',
      isSignificant: false,
      message: 'Current rainfall conditions are below the significant-rainfall threshold.',
      dataSource: similarityRes.dataSource,
      historicalPeriod: similarityRes.historicalPeriod,
      candidateEventCount: similarityRes.candidateEventCount,
      significantRainfallThreshold: similarityRes.significantRainfallThreshold,
      currentRainfallFeatures: similarityRes.currentRainfallFeatures,
      similarEpisodes: [],
      historicalEvidence: [],
      wordingNotice: 'FloodSafe expresses estimated waterlogging risk based on historically documented evidence. Low-rainfall conditions do not indicate significant flood risk.'
    };
  }

  // Map significant similar episodes to source-backed incident evidence
  const historicalEvidence = similarityRes.similarEvents.map(ep => {
    const incident = getAssociatedIncidentEvent(ep);

    if (incident) {
      return {
        episodeId: ep.episodeId,
        startDate: ep.startDate,
        endDate: ep.endDate,
        durationDays: ep.durationDays,
        similarity: ep.similarity,
        distance: ep.distance,
        matchedIncidentEvent: {
          incidentId: incident.id,
          title: incident.title,
          date: incident.date,
          description: incident.description,
          source: incident.source,
          documentedWaterloggingLocations: incident.waterloggingLocations.map(loc => ({
            name: loc.name,
            latitude: loc.latitude,
            longitude: loc.longitude,
            severity: loc.severity,
            source: loc.source,
            coordinateSource: loc.coordinateSource
          }))
        },
        historicalFeatures: ep.historicalFeatures,
        historicalWording: `This current rainfall pattern resembles a historical event (${incident.title}) that was historically associated with documented waterlogging.`
      };
    }

    return {
      episodeId: ep.episodeId,
      startDate: ep.startDate,
      endDate: ep.endDate,
      durationDays: ep.durationDays,
      similarity: ep.similarity,
      distance: ep.distance,
      matchedIncidentEvent: null,
      historicalFeatures: ep.historicalFeatures,
      historicalWording: 'Meteorological rainfall episode similarity match without separate verified flood incident report.'
    };
  });

  return {
    status: 'significant-rainfall',
    isSignificant: true,
    message: 'Significant rainfall detected. Documented historical flood evidence retrieved for meteorologically similar historical events.',
    dataSource: similarityRes.dataSource,
    historicalPeriod: similarityRes.historicalPeriod,
    candidateEventCount: similarityRes.candidateEventCount,
    significantRainfallThreshold: similarityRes.significantRainfallThreshold,
    currentRainfallFeatures: similarityRes.currentRainfallFeatures,
    similarEpisodes: similarityRes.similarEvents,
    historicalEvidence,
    wordingNotice: 'FloodSafe risk indicators express estimated waterlogging probability based on historically documented evidence and elevation profiles.'
  };
}

/**
 * Haversine formula to compute distance in meters between two lat/lng coordinates
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
 * Filter and annotate historical incident evidence with geometric route proximity.
 * Proximity threshold default: 250 meters.
 */
export function matchIncidentsToRoute(routeGeometry, historicalEvidenceList, proximityThresholdMeters = 250) {
  if (!routeGeometry || routeGeometry.length === 0 || !historicalEvidenceList) {
    return [];
  }

  const proximityResults = [];

  for (const item of historicalEvidenceList) {
    if (!item.matchedIncidentEvent) continue;

    const event = item.matchedIncidentEvent;
    const coordinateHotspots = [];
    const textualEvidences = [];

    for (const loc of event.documentedWaterloggingLocations || []) {
      if (loc.latitude !== null && loc.longitude !== null && !isNaN(loc.latitude) && !isNaN(loc.longitude)) {
        let minDistanceMeters = Infinity;
        for (const [rLat, rLon] of routeGeometry) {
          const dist = haversineDistanceMeters(rLat, rLon, loc.latitude, loc.longitude);
          if (dist < minDistanceMeters) {
            minDistanceMeters = dist;
          }
        }

        if (minDistanceMeters <= proximityThresholdMeters) {
          coordinateHotspots.push({
            name: loc.name,
            latitude: loc.latitude,
            longitude: loc.longitude,
            distanceMeters: minDistanceMeters,
            severity: loc.severity,
            source: loc.source,
            coordinateSource: loc.coordinateSource,
            isWithinProximityThreshold: true
          });
        }
      } else {
        textualEvidences.push({
          name: loc.name,
          severity: loc.severity,
          source: loc.source,
          note: 'Documented waterlogging location retained as textual evidence (no reliable coordinate).'
        });
      }
    }

    proximityResults.push({
      episodeId: item.episodeId,
      similarity: item.similarity,
      incidentTitle: event.title,
      incidentDate: event.date,
      nearbyCoordinateHotspots: coordinateHotspots,
      textualEvidences,
      historicalWording: item.historicalWording
    });
  }

  return proximityResults;
}

