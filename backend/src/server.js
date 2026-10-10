import app from './app.js';

const PORT = process.env.PORT || 5000;

// Start standalone HTTP server for local development & traditional node deployment
app.listen(PORT, () => {
  console.log(`🌊 FloodSafe Backend API server running on port ${PORT}`);
  console.log(`📍 Route Analyzer: http://localhost:${PORT}/api/routes/analyze`);
});
