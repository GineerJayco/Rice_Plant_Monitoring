/**
 * Historical Data Routes
 * Provides endpoints for fetching stored sensor, image, and detection data
 */

import express from 'express';
import {
  getSensorReadings,
  getPlantImages,
  getPlantImage,
  getDetectionResults,
  getDetectionSummary,
  deletePlantSnapshot,
  deletePlantSnapshots,
  deleteAllPlantSnapshots,
} from '../db/supabase.js';

const router = express.Router();

/**
 * GET /api/history/sensors
 * Query sensor readings by date range
 * 
 * Query Parameters:
 *   startDate (required) - ISO 8601 format (e.g., 2024-01-01T00:00:00Z)
 *   endDate (required) - ISO 8601 format
 *   limit (optional) - max records to return (default: 100, max: 1000)
 */
router.get('/sensors', async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required query parameters: startDate, endDate',
        example: '/api/history/sensors?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z'
      });
    }

    // Validate date formats
    try {
      new Date(startDate);
      new Date(endDate);
    } catch {
      return res.status(400).json({
        error: 'Invalid date format. Use ISO 8601 (e.g., 2024-01-01T00:00:00Z)'
      });
    }

    const data = await getSensorReadings(startDate, endDate, Math.min(parseInt(limit) || 100, 1000));

    res.json({
      success: true,
      count: data.length,
      startDate,
      endDate,
      data,
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/history/images
 * Query plant images
 * 
 * Query Parameters:
 *   plant (required) - Plant ID (1-6)
 *   limit (optional) - max records to return (default: 50)
 */
router.get('/images', async (req, res, next) => {
  try {
    const { plant, limit = 50 } = req.query;

    if (!plant) {
      return res.status(400).json({
        error: 'Missing required query parameter: plant (1-6)',
        example: '/api/history/images?plant=1&limit=20'
      });
    }

    const plantId = parseInt(plant);
    if (isNaN(plantId) || plantId < 1 || plantId > 6) {
      return res.status(400).json({
        error: 'Invalid plant ID. Must be between 1 and 6'
      });
    }

    const data = await getPlantImages(plantId, Math.min(parseInt(limit) || 50, 500));

    res.json({
      success: true,
      plant: plantId,
      count: data.length,
      data,
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/history/images/:id
 * Get single image with full data (base64)
 */
router.get('/images/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await getPlantImage(id);

    if (!data) {
      return res.status(404).json({
        error: 'Image not found'
      });
    }

    res.json({
      success: true,
      data,
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/history/detections
 * Query plant detection results
 * 
 * Query Parameters:
 *   plant (required) - Plant ID (1-6)
 *   limit (optional) - max records to return (default: 50)
 */
router.get('/detections', async (req, res, next) => {
  try {
    const { plant, limit = 50 } = req.query;

    if (!plant) {
      return res.status(400).json({
        error: 'Missing required query parameter: plant (1-6)',
        example: '/api/history/detections?plant=1&limit=20'
      });
    }

    const plantId = parseInt(plant);
    if (isNaN(plantId) || plantId < 1 || plantId > 6) {
      return res.status(400).json({
        error: 'Invalid plant ID. Must be between 1 and 6'
      });
    }

    const data = await getDetectionResults(plantId, Math.min(parseInt(limit) || 50, 500));

    res.json({
      success: true,
      plant: plantId,
      count: data.length,
      data,
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/history/detections/summary
 * Get detection summary for a plant in date range
 * 
 * Query Parameters:
 *   plant (required) - Plant ID (1-6)
 *   startDate (required) - ISO 8601 format
 *   endDate (required) - ISO 8601 format
 */
router.get('/detections/summary/:plant', async (req, res, next) => {
  try {
    const { plant } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required query parameters: startDate, endDate',
        example: '/api/history/detections/summary/1?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z'
      });
    }

    const plantId = parseInt(plant);
    if (isNaN(plantId) || plantId < 1 || plantId > 6) {
      return res.status(400).json({
        error: 'Invalid plant ID. Must be between 1 and 6'
      });
    }

    const data = await getDetectionSummary(plantId, startDate, endDate);

    res.json({
      success: true,
      plant: plantId,
      startDate,
      endDate,
      summary: data,
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/history/snapshots/:id
 * Delete a single snapshot (image + detection)
 */
router.delete('/snapshots/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { timestamp } = req.query;

    if (!timestamp) {
      return res.status(400).json({ error: 'Missing required query parameter: timestamp' });
    }

    await deletePlantSnapshot(id, timestamp);
    res.json({ success: true, message: 'Snapshot deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/history/snapshots/bulk
 * Delete multiple snapshots
 */
router.delete('/snapshots/bulk', async (req, res, next) => {
  try {
    const { plantId, imageIds, timestamps } = req.body;

    if (!plantId || !imageIds || !timestamps) {
      return res.status(400).json({ error: 'Missing required fields: plantId, imageIds, timestamps' });
    }

    await deletePlantSnapshots(plantId, imageIds, timestamps);
    res.json({ success: true, message: `${imageIds.length} snapshots deleted successfully` });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/history/snapshots/all/:plantId
 * Delete all snapshots for a plant
 */
router.delete('/snapshots/all/:plantId', async (req, res, next) => {
  try {
    const { plantId } = req.params;
    
    await deleteAllPlantSnapshots(parseInt(plantId));
    res.json({ success: true, message: 'All snapshots for plant deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
