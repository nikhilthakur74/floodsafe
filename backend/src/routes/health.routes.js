import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint for FloodSafe backend
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'FloodSafe API',
    message: 'Backend is running smoothly',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
