import { historicalEvents } from '../data/historicalEvents.js';

/**
 * Replay Service for FloodSafe
 * Handles fetching documented historical rainfall/waterlogging replay events.
 */

/**
 * Retrieve all documented historical replay events
 */
export function getAllReplayEvents() {
  return historicalEvents;
}

/**
 * Retrieve a specific historical replay event by ID
 * @param {string} id - Event ID
 */
export function getReplayEventById(id) {
  return historicalEvents.find(event => event.id === id) || null;
}
