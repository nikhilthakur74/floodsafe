import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DELHI_LAT = 28.6139;
const DELHI_LON = 77.2090;
const START_DATE = '2016-01-01';
// Use today's date dynamically (YYYY-MM-DD)
const END_DATE = new Date().toISOString().split('T')[0];

const OPEN_METEO_ARCHIVE_URL = `https://archive-api.open-meteo.com/v1/archive?latitude=${DELHI_LAT}&longitude=${DELHI_LON}&start_date=${START_DATE}&end_date=${END_DATE}&hourly=precipitation&timezone=Asia%2FKolkata`;

const INDEX_FILE_PATH = path.resolve(__dirname, '../data/historicalRainfallIndex.json');

/**
 * Calculate percentile value from a sorted array of numbers
 */
function calculatePercentile(sortedArray, percentile) {
  if (!sortedArray || sortedArray.length === 0) return 0;
  const index = (percentile / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  if (upper >= sortedArray.length) return Number(sortedArray[sortedArray.length - 1].toFixed(2));
  const val = sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  return Number(val.toFixed(2));
}

/**
 * Main Ingestion & Processing Pipeline
 */
export async function ingestAndProcessHistoricalWeather() {
  const startTime = Date.now();
  console.log(`[Historical Ingestion] Requesting Open-Meteo archive from ${START_DATE} to ${END_DATE}...`);

  const response = await fetch(OPEN_METEO_ARCHIVE_URL);
  if (!response.ok) {
    throw new Error(`Open-Meteo Archive API request failed with status: ${response.status}`);
  }

  const fetchEndTime = Date.now();
  const rawData = await response.json();
  const hourlyTime = rawData.hourly?.time || [];
  const hourlyPrecip = rawData.hourly?.precipitation || [];

  console.log(`[Historical Ingestion] Downloaded ${hourlyTime.length} hourly records in ${fetchEndTime - startTime}ms.`);

  // 1. Data Quality Validation
  let nullPrecipCount = 0;
  const duplicateTimestamps = new Set();
  const seenTimestamps = new Set();

  for (let i = 0; i < hourlyTime.length; i++) {
    const t = hourlyTime[i];
    if (seenTimestamps.has(t)) {
      duplicateTimestamps.add(t);
    } else {
      seenTimestamps.add(t);
    }

    const val = hourlyPrecip[i];
    if (val === null || val === undefined || isNaN(val)) {
      nullPrecipCount++;
    }
  }

  // 2. Group hourly data by calendar date (YYYY-MM-DD)
  const daysMap = new Map();

  for (let i = 0; i < hourlyTime.length; i++) {
    const timeStr = hourlyTime[i];
    const dateStr = timeStr.split('T')[0];
    const precipVal = hourlyPrecip[i] || 0;

    if (!daysMap.has(dateStr)) {
      daysMap.set(dateStr, []);
    }
    daysMap.get(dateStr).push(precipVal);
  }

  // Calculate expected days count between START_DATE and END_DATE
  const startDateObj = new Date(START_DATE);
  const endDateObj = new Date(END_DATE);
  const expectedDaysCount = Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const expectedHourlyCount = expectedDaysCount * 24;

  const missingHoursCount = expectedHourlyCount - hourlyTime.length;

  // 3. Process Daily Features
  const dailyRecords = [];
  const totalRainfall24hList = [];

  for (const [date, hoursArray] of daysMap.entries()) {
    const totalRainfall24h = Number(hoursArray.reduce((sum, v) => sum + v, 0).toFixed(2));
    const maxHourlyRainfall = Number(Math.max(...hoursArray).toFixed(2));

    // Calculate max 6h rolling window sum in the day
    let max6h = 0;
    for (let i = 0; i <= hoursArray.length - 6; i++) {
      const windowSum = hoursArray.slice(i, i + 6).reduce((a, b) => a + b, 0);
      if (windowSum > max6h) max6h = windowSum;
    }

    // Calculate max 12h rolling window sum in the day
    let max12h = 0;
    for (let i = 0; i <= hoursArray.length - 12; i++) {
      const windowSum = hoursArray.slice(i, i + 12).reduce((a, b) => a + b, 0);
      if (windowSum > max12h) max12h = windowSum;
    }

    const record = {
      date,
      totalRainfall24h,
      maxHourlyRainfall,
      rainfall6h: Number(max6h.toFixed(2)),
      rainfall12h: Number(max12h.toFixed(2)),
      rainfall24h: totalRainfall24h,
      hourlyCount: hoursArray.length
    };

    dailyRecords.push(record);
    totalRainfall24hList.push(totalRainfall24h);
  }

  // 4. Calculate Distribution Statistics for 24h rainfall
  const sorted24h = [...totalRainfall24hList].sort((a, b) => a - b);
  const distributionStats = {
    minimum: sorted24h[0] || 0,
    median: calculatePercentile(sorted24h, 50),
    p75: calculatePercentile(sorted24h, 75),
    p90: calculatePercentile(sorted24h, 90),
    p95: calculatePercentile(sorted24h, 95),
    p99: calculatePercentile(sorted24h, 99),
    maximum: sorted24h[sorted24h.length - 1] || 0
  };

  // 5. Heuristic Episode Detector
  // Benchmark heuristic threshold for "significant rainfall day" in Delhi:
  // totalRainfall24h >= 25.0 mm OR maxHourlyRainfall >= 10.0 mm
  const SIGNIFICANT_DAILY_THRESHOLD_MM = 25.0;
  const SIGNIFICANT_HOURLY_THRESHOLD_MM = 10.0;

  const significantDays = dailyRecords.filter(
    d => d.totalRainfall24h >= SIGNIFICANT_DAILY_THRESHOLD_MM || d.maxHourlyRainfall >= SIGNIFICANT_HOURLY_THRESHOLD_MM
  );

  // Group consecutive heavy-rain days into Episodes
  const episodes = [];
  let currentEpisodeDays = [];

  for (let i = 0; i < dailyRecords.length; i++) {
    const day = dailyRecords[i];
    const isSig = day.totalRainfall24h >= SIGNIFICANT_DAILY_THRESHOLD_MM || day.maxHourlyRainfall >= SIGNIFICANT_HOURLY_THRESHOLD_MM;

    if (isSig) {
      currentEpisodeDays.push(day);
    } else {
      if (currentEpisodeDays.length > 0) {
        episodes.push(createEpisodeSummary(currentEpisodeDays));
        currentEpisodeDays = [];
      }
    }
  }
  if (currentEpisodeDays.length > 0) {
    episodes.push(createEpisodeSummary(currentEpisodeDays));
  }

  // Map episode ID back onto daily records
  const episodeMap = new Map();
  episodes.forEach(ep => {
    ep.dayDates.forEach(dStr => {
      episodeMap.set(dStr, ep.id);
    });
  });

  const processedDailyRecords = dailyRecords.map(r => ({
    date: r.date,
    totalRainfall24h: r.totalRainfall24h,
    maxHourlyRainfall: r.maxHourlyRainfall,
    rainfall6h: r.rainfall6h,
    rainfall12h: r.rainfall12h,
    episodeId: episodeMap.get(r.date) || null
  }));

  const processEndTime = Date.now();

  const finalDataset = {
    metadata: {
      location: 'Delhi',
      coordinates: { latitude: DELHI_LAT, longitude: DELHI_LON },
      startDate: START_DATE,
      endDate: END_DATE,
      totalHourlyRecords: hourlyTime.length,
      totalDailyRecords: dailyRecords.length,
      expectedDailyRecords: expectedDaysCount,
      missingHours: Math.max(0, missingHoursCount),
      missingValuesCount: nullPrecipCount,
      duplicateTimestampsCount: duplicateTimestamps.size,
      ingestionTimeMs: fetchEndTime - startTime,
      processingTimeMs: processEndTime - fetchEndTime,
      generatedAt: new Date().toISOString()
    },
    qualityValidation: {
      status: nullPrecipCount === 0 && duplicateTimestamps.size === 0 ? 'CLEAN' : 'WARNINGS_DETECTED',
      nullPrecipCount,
      duplicateTimestampsCount: duplicateTimestamps.size,
      missingHoursCount: Math.max(0, missingHoursCount)
    },
    distributionStats,
    episodeThresholds: {
      significantDailyThresholdMm: SIGNIFICANT_DAILY_THRESHOLD_MM,
      significantHourlyThresholdMm: SIGNIFICANT_HOURLY_THRESHOLD_MM,
      description: 'Prototype heuristic: 24h rainfall >= 25mm OR max 1h rainfall >= 10mm'
    },
    totalSignificantEpisodes: episodes.length,
    episodes: episodes.map(ep => {
      const { dayDates, ...rest } = ep;
      return rest;
    }),
    dailyRecords: processedDailyRecords
  };

  // Write dataset to file
  const jsonStr = JSON.stringify(finalDataset, null, 2);
  fs.mkdirSync(path.dirname(INDEX_FILE_PATH), { recursive: true });
  fs.writeFileSync(INDEX_FILE_PATH, jsonStr, 'utf-8');

  const fileSizeKB = (fs.statSync(INDEX_FILE_PATH).size / 1024).toFixed(2);
  console.log(`[Historical Ingestion] Complete! Processed ${processedDailyRecords.length} daily records, ${episodes.length} episodes. Saved index to ${INDEX_FILE_PATH} (${fileSizeKB} KB).`);

  return finalDataset;
}

function createEpisodeSummary(daysArray) {
  const startDate = daysArray[0].date;
  const endDate = daysArray[daysArray.length - 1].date;
  const durationDays = daysArray.length;

  const totalRainfall = Number(daysArray.reduce((sum, d) => sum + d.totalRainfall24h, 0).toFixed(2));
  const peak24hRainfall = Number(Math.max(...daysArray.map(d => d.totalRainfall24h)).toFixed(2));
  const peakHourlyRainfall = Number(Math.max(...daysArray.map(d => d.maxHourlyRainfall)).toFixed(2));
  const peak6hRainfall = Number(Math.max(...daysArray.map(d => d.rainfall6h)).toFixed(2));

  return {
    id: `episode-${startDate}${startDate !== endDate ? '-to-' + endDate : ''}`,
    startDate,
    endDate,
    durationDays,
    totalRainfall,
    peak24hRainfall,
    peakHourlyRainfall,
    peak6hRainfall,
    dayDates: daysArray.map(d => d.date)
  };
}

// Execute directly if called from command line
if (process.argv[1] && process.argv[1].endsWith('ingestHistoricalWeather.js')) {
  ingestAndProcessHistoricalWeather().catch(err => {
    console.error('[Ingestion Failed]:', err);
    process.exit(1);
  });
}
