/**
 * Health Check Routes
 * Provides status endpoints for monitoring
 */

import express from 'express';
import { isConnected } from '../services/mqtt.js';

const router = express.Router();

/**
 * GET /api/health
 * Returns server and MQTT connection status
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mqtt: {
      connected: isConnected(),
      broker: process.env.MQTT_BROKER,
    },
    uptime: process.uptime(),
  });
});

export default router;
