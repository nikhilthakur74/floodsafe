import { Router } from 'express';
import { getAllReplayEvents, getReplayEventById } from '../services/replay.service.js';

const router = Router();

/**
 * GET /api/replay/events
 * Returns all documented historical Delhi replay events.
 */
router.get('/events', (req, res) => {
  const events = getAllReplayEvents();
  res.status(200).json({
    count: events.length,
    events
  });
});

/**
 * GET /api/replay/events/:id
 * Returns a single documented historical replay event by ID.
 */
router.get('/events/:id', (req, res) => {
  const { id } = req.params;
  const event = getReplayEventById(id);

  if (!event) {
    return res.status(404).json({
      error: 'Event Not Found',
      message: `No historical replay event found with ID '${id}'`
    });
  }

  res.status(200).json(event);
});

export default router;
