import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.routes.js';
import weatherRoutes from './routes/weather.routes.js';
import historicalRoutes from './routes/historical.routes.js';
import replayRoutes from './routes/replay.routes.js';
import riskRoutes from './routes/risk.routes.js';
import elevationRoutes from './routes/elevation.routes.js';
import routesRoutes from './routes/routes.routes.js';
import historyRoutes from './routes/history.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/historical', historicalRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/replay', replayRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/elevation', elevationRoutes);
app.use('/api/routes', routesRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FloodSafe API - Know the risk before you travel.',
    endpoints: {
      health: '/api/health',
      weatherDelhi: '/api/weather/delhi',
      historicalDelhi: '/api/historical/delhi',
      replayEvents: '/api/replay/events',
      calculateRisk: '/api/risk/calculate (POST)',
      elevation: '/api/elevation?lat=28.6139&lng=77.2090',
      analyzeRoutes: '/api/routes/analyze (POST)'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌊 FloodSafe Backend API server running on port ${PORT}`);
  console.log(`📍 Route Analyzer: http://localhost:${PORT}/api/routes/analyze`);
});
