/**
 * Authentic Historical Replay Route Geometries for FloodSafe Demo Corridor
 *
 * Geometries, distances, and durations are loaded directly from authentic OSRM GeoJSON response
 * recorded in `osrmReplayRoutes.json` with full provenance metadata.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let cachedReplayData = null;

function loadAuthenticReplayData() {
  if (cachedReplayData) return cachedReplayData;

  const candidatePaths = [
    path.resolve(__dirname, 'osrmReplayRoutes.json'),
    path.resolve(__dirname, '../data/osrmReplayRoutes.json'),
    path.resolve(process.cwd(), 'backend/src/data/osrmReplayRoutes.json'),
    path.resolve(process.cwd(), 'src/data/osrmReplayRoutes.json'),
    path.resolve(process.cwd(), 'osrmReplayRoutes.json')
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        cachedReplayData = JSON.parse(raw);
        return cachedReplayData;
      } catch (err) {
        console.warn(`[Replay Data Loader]: Error reading ${p}:`, err.message);
      }
    }
  }

  return null;
}

/**
 * Retrieve authentic recorded historical replay routes for demo corridor
 */
export function getVerifiedHistoricalReplayRoutes() {
  const replayData = loadAuthenticReplayData();

  if (!replayData || !replayData.routes || replayData.routes.length === 0) {
    return {
      provider: 'Unavailable',
      statusMessage: 'Authentic historical replay route dataset is unavailable.',
      count: 0,
      alternativesAvailable: false,
      isUnavailable: true,
      routes: []
    };
  }

  return {
    provider: replayData.provenance.provider || 'OSRM',
    statusMessage: `Historical Replay Mode — Authentic route geometry from ${replayData.provenance.provider} (${replayData.provenance.fetchedAt}).`,
    count: replayData.routes.length,
    alternativesAvailable: replayData.routes.length > 1,
    isAuthenticReplay: true,
    provenance: replayData.provenance,
    routes: JSON.parse(JSON.stringify(replayData.routes))
  };
}
