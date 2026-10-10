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

// Configure CORS for local dev and CloudFront frontend production domain
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins === '*' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy violation: origin '${origin}' is not allowed.`));
    },
    credentials: true
  })
);

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
    status: 'online',
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

// JSON 404 Catch-All Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Global Error Handler (Log full error server-side, return clean JSON to client)
app.use((err, req, res, next) => {
  console.error('[Global App Error]:', err);

  const statusCode = typeof err.status === 'number' ? err.status : (typeof err.statusCode === 'number' ? err.statusCode : 500);

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : (err.name || 'Bad Request'),
    message: statusCode >= 500 ? 'An unexpected server error occurred.' : err.message
  });
});

export default app;
