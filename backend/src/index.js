/**
 * Rice Plant Monitoring Backend
 * 
 * Subscribes to MQTT topics and stores sensor data in Supabase PostgreSQL
 * Provides REST API for frontend to fetch historical data
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeSupabase } from './db/supabase.js';
import { connectMqtt } from './services/mqtt.js';
import historyRoutes from './routes/history.js';
import healthRoutes from './routes/health.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
//  MIDDLEWARE
// ============================================================

app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

// ============================================================
//  ROUTES
// ============================================================

app.use('/api/health', healthRoutes);
app.use('/api/history', historyRoutes);

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Rice Plant Monitoring Backend',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      history: '/api/history/sensors',
      historySensors: '/api/history/sensors?startDate=2024-01-01&endDate=2024-01-31&plant=1',
      historyImages: '/api/history/images?plant=1&limit=10',
      historyDetections: '/api/history/detections?plant=1&limit=10',
    }
  });
});

// ============================================================
//  ERROR HANDLING
// ============================================================

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message,
    status: err.status || 500
  });
});

// ============================================================
//  STARTUP
// ============================================================

const startServer = async () => {
  try {
    console.log('🚀 Rice Plant Monitoring Backend Starting...\n');

    // Initialize Supabase connection
    console.log('[DB] Initializing Supabase connection...');
    await initializeSupabase();
    console.log('[DB] ✅ Supabase connected\n');

    // Connect to MQTT broker
    console.log('[MQTT] Connecting to broker...');
    await connectMqtt();
    console.log('[MQTT] ✅ Connected to MQTT\n');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`[SERVER] ✅ Listening on port ${PORT}`);
      console.log(`[SERVER] 🌐 http://localhost:${PORT}`);
      console.log(`[SERVER] 📊 Dashboard: http://localhost:5173`);
      console.log('\n[INFO] System ready. Collecting and storing sensor data...\n');
    });

  } catch (error) {
    console.error('\n[FATAL ERROR] Failed to start server:');
    console.error(error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] Gracefully shutting down...');
  process.exit(0);
});

// Start the server
startServer();

export default app;
