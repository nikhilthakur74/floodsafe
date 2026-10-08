import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDelhiForecast } from './weather.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_FILE_PATH = path.resolve(__dirname, '../data/historicalRainfallIndex.json');

let cachedDataset = null;

const SIGNIFICANT_DAILY_THRESHOLD_MM = 25.0;
const SIGNIFICANT_HOURLY_THRESHOLD_MM = 10.0;

/**
 * Load or read historical dataset index from file
 */
export function getHistoricalRainfallIndex() {
  if (cachedDataset) return cachedDataset;

  if (fs.existsSync(INDEX_FILE_PATH)) {
    const raw = fs.readFileSync(INDEX_FILE_PATH, 'utf-8');
    cachedDataset = JSON.parse(raw);
    return cachedDataset;
  }

  throw new Error(`Historical rainfall index file not found at ${INDEX_FILE_PATH}. Run ingestion script first.`);
}

/**
 * Check if a rainfall feature vector meets the significant rainfall threshold
 */
export function isSignificantRainfall(features) {
  const c24h = features.totalRainfall24h || features.next24HoursMm || 0;
  const c1h = features.maxHourlyRainfall || features.maxHourlyMm || 0;
  return c24h >= SIGNIFICANT_DAILY_THRESHOLD_MM || c1h >= SIGNIFICANT_HOURLY_THRESHOLD_MM;
}

/**
 * Pure utility function to calculate explainable normalized distance and similarity
 * between current rainfall features and historical rainfall features/episodes.
 */
export function calculateRainfallSimilarity(currentFeatures, historicalFeatures) {
  const c24h = currentFeatures.totalRainfall24h || currentFeatures.next24HoursMm || 0;
  const c1h = currentFeatures.maxHourlyRainfall || currentFeatures.maxHourlyMm || 0;
  const c6h = currentFeatures.rainfall6h || currentFeatures.next6HoursMm || 0;
  const c12h = currentFeatures.rainfall12h || currentFeatures.next12HoursMm || 0;

  const h24h = historicalFeatures.totalRainfall24h || historicalFeatures.peak24hRainfall || 0;
  const h1h = historicalFeatures.maxHourlyRainfall || historicalFeatures.peakHourlyRainfall || 0;
  const h6h = historicalFeatures.rainfall6h || historicalFeatures.peak6hRainfall || 0;
  const h12h = historicalFeatures.rainfall12h || historicalFeatures.peak6hRainfall || 0;

  // Normalized Euclidean distance across feature metrics
  const d24 = (c24h - h24h) / 50.0;
  const d1 = (c1h - h1h) / 15.0;
  const d6 = (c6h - h6h) / 35.0;
  const d12 = (c12h - h12h) / 45.0;

  const distanceVal = Math.sqrt(d24 * d24 + d1 * d1 + d6 * d6 + d12 * d12);
  const distance = Number(distanceVal.toFixed(4));
  const similarity = Number((1 / (1 + distanceVal)).toFixed(4));

  return {
    similarity,
    distance
  };
}

/**
 * RAW SIMILARITY ENGINE (Preserved for general weather similarity)
 * Compares current features against all daily records in the 10-year dataset.
 */
export function findTopSimilarHistoricalRainfall(currentFeatures, limit = 5) {
  const searchStartTime = Date.now();
  const indexData = getHistoricalRainfallIndex();
  const dailyRecords = indexData.dailyRecords || [];
  const episodesMap = new Map((indexData.episodes || []).map(ep => [ep.id, ep]));

  const scoredRecords = dailyRecords.map(record => {
    const simResult = calculateRainfallSimilarity(currentFeatures, record);
    return {
      date: record.date,
      similarity: simResult.similarity,
      distance: simResult.distance,
      historicalRainfall: {
        totalRainfall24h: record.totalRainfall24h,
        maxHourlyRainfall: record.maxHourlyRainfall,
        rainfall6h: record.rainfall6h,
        rainfall12h: record.rainfall12h
      },
      currentRainfall: {
        totalRainfall24h: currentFeatures.totalRainfall24h || currentFeatures.next24HoursMm || 0,
        maxHourlyRainfall: currentFeatures.maxHourlyRainfall || currentFeatures.maxHourlyMm || 0,
        rainfall6h: currentFeatures.rainfall6h || currentFeatures.next6HoursMm || 0,
        rainfall12h: currentFeatures.rainfall12h || currentFeatures.next12HoursMm || 0
      },
      associatedEpisode: record.episodeId ? episodesMap.get(record.episodeId) || null : null
    };
  });

  scoredRecords.sort((a, b) => b.similarity - a.similarity);

  const searchEndTime = Date.now();

  return {
    similarityMode: 'raw-daily-all',
    searchTimeMs: searchEndTime - searchStartTime,
    currentRainfallFeatures: {
      totalRainfall24h: currentFeatures.totalRainfall24h || currentFeatures.next24HoursMm || 0,
      maxHourlyRainfall: currentFeatures.maxHourlyRainfall || currentFeatures.maxHourlyMm || 0,
      rainfall6h: currentFeatures.rainfall6h || currentFeatures.next6HoursMm || 0,
      rainfall12h: currentFeatures.rainfall12h || currentFeatures.next12HoursMm || 0
    },
    topSimilar: scoredRecords.slice(0, limit)
  };
}

/**
 * SIGNIFICANT EVENT-ORIENTED SIMILARITY ENGINE
 * 
 * Filters candidates to ONLY significant historical rainfall episodes
 * (24h rainfall >= 25mm OR max 1h rainfall >= 10mm).
 * 
 * If current rainfall is not significant, returns status: 'low-rainfall' with similarEvents: [].
 */
export function findSimilarSignificantEpisodes(currentFeatures, limit = 5) {
  const searchStartTime = Date.now();
  const indexData = getHistoricalRainfallIndex();
  const significantEpisodes = indexData.episodes || [];

  const c24h = currentFeatures.totalRainfall24h || currentFeatures.next24HoursMm || 0;
  const c1h = currentFeatures.maxHourlyRainfall || currentFeatures.maxHourlyMm || 0;
  const c6h = currentFeatures.rainfall6h || currentFeatures.next6HoursMm || 0;
  const c12h = currentFeatures.rainfall12h || currentFeatures.next12HoursMm || 0;

  const normalizedCurrent = {
    totalRainfall24h: c24h,
    maxHourlyRainfall: c1h,
    rainfall6h: c6h,
    rainfall12h: c12h
  };

  const isSig = isSignificantRainfall(normalizedCurrent);

  if (!isSig) {
    const searchEndTime = Date.now();
    return {
      status: 'low-rainfall',
      isSignificant: false,
      message: 'Current rainfall conditions are below the significant-rainfall threshold.',
      similarityMode: 'significant-events',
      dataSource: 'Open-Meteo Historical Weather API (https://archive-api.open-meteo.com/v1/archive)',
      historicalPeriod: {
        startDate: indexData.metadata.startDate,
        endDate: indexData.metadata.endDate
      },
      candidateEventCount: significantEpisodes.length,
      significantRainfallThreshold: {
        daily24hMm: SIGNIFICANT_DAILY_THRESHOLD_MM,
        hourlyMaxMm: SIGNIFICANT_HOURLY_THRESHOLD_MM
      },
      currentRainfallFeatures: normalizedCurrent,
      similarityMethod: 'Normalized Euclidean distance across peak episode rainfall metrics',
      searchTimeMs: searchEndTime - searchStartTime,
      similarEvents: []
    };
  }

  // Compare normalizedCurrent against 50 significant historical episodes
  const scoredEpisodes = significantEpisodes.map(ep => {
    const simResult = calculateRainfallSimilarity(normalizedCurrent, ep);
    return {
      episodeId: ep.id,
      startDate: ep.startDate,
      endDate: ep.endDate,
      durationDays: ep.durationDays,
      similarity: simResult.similarity,
      distance: simResult.distance,
      historicalFeatures: {
        totalRainfall: ep.totalRainfall,
        peak24hRainfall: ep.peak24hRainfall,
        peakHourlyRainfall: ep.peakHourlyRainfall,
        peak6hRainfall: ep.peak6hRainfall
      },
      currentFeatures: normalizedCurrent
    };
  });

  scoredEpisodes.sort((a, b) => b.similarity - a.similarity);

  const searchEndTime = Date.now();

  return {
    status: 'significant-rainfall',
    isSignificant: true,
    message: `Significant rainfall detected. Top ${limit} comparable historical rainfall episodes returned.`,
    similarityMode: 'significant-events',
    dataSource: 'Open-Meteo Historical Weather API (https://archive-api.open-meteo.com/v1/archive)',
    historicalPeriod: {
      startDate: indexData.metadata.startDate,
      endDate: indexData.metadata.endDate
    },
    candidateEventCount: significantEpisodes.length,
    significantRainfallThreshold: {
      daily24hMm: SIGNIFICANT_DAILY_THRESHOLD_MM,
      hourlyMaxMm: SIGNIFICANT_HOURLY_THRESHOLD_MM
    },
    currentRainfallFeatures: normalizedCurrent,
    similarityMethod: 'Normalized Euclidean distance across peak episode rainfall metrics',
    searchTimeMs: searchEndTime - searchStartTime,
    similarEvents: scoredEpisodes.slice(0, limit)
  };
}

/**
 * Service function to compare live weather forecast using event-oriented similarity
 */
export async function getLiveRainfallSimilarity(limit = 5, mode = 'significant-events') {
  const forecastData = await getDelhiForecast();
  const forecast = forecastData.forecast || {};

  const currentFeatures = {
    totalRainfall24h: forecast.next24HoursMm || 0,
    maxHourlyRainfall: forecast.maxHourlyMm || 0,
    rainfall6h: forecast.next6HoursMm || 0,
    rainfall12h: forecast.next12HoursMm || 0
  };

  if (mode === 'raw-daily-all') {
    return {
      liveLocation: forecastData.location,
      coordinates: forecastData.coordinates,
      weatherSource: forecastData.source,
      ...findTopSimilarHistoricalRainfall(currentFeatures, limit)
    };
  }

  const sigResult = findSimilarSignificantEpisodes(currentFeatures, limit);

  return {
    liveLocation: forecastData.location,
    coordinates: forecastData.coordinates,
    weatherSource: forecastData.source,
    ...sigResult,
    disclaimer: 'Pure weather-pattern similarity model. Does NOT infer flooding unless backed by separate verified incident reports.'
  };
}
