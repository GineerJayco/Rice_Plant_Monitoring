/**
 * Supabase Database Connection & Schema
 * Handles all database operations
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
}

// Use service role key if available (for admin operations), otherwise use anon key
const client = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
);

/**
 * Initialize database connection and create tables if they don't exist
 */
export const initializeSupabase = async () => {
  try {
    // Test connection
    const { data, error } = await client
      .from('sensor_readings')
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table doesn't exist (we'll create it)
      throw error;
    }

    console.log('[DB] Connection test passed ✅');
    return client;
  } catch (error) {
    console.error('[DB] Connection error:', error.message);
    throw error;
  }
};

/**
 * Store sensor reading
 */
export const storeSensorReading = async (sensorData) => {
  try {
    const { data, error } = await client
      .from('sensor_readings')
      .insert([{
        timestamp: new Date().toISOString(),
        temp: sensorData.temp,
        humidity: sensorData.hum,
        soil_1: sensorData.soil_1,
        soil_2: sensorData.soil_2,
        soil_3: sensorData.soil_3,
        soil_4: sensorData.soil_4,
        soil_5: sensorData.soil_5,
        soil_6: sensorData.soil_6,
        water_level_healthy: sensorData.water_level_healthy,
        water_level_diseased: sensorData.water_level_diseased,
      }]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[DB] Error storing sensor reading:', error.message);
    throw error;
  }
};

/**
 * Store plant image
 */
export const storePlantImage = async (plantId, imageBase64, timestamp = null) => {
  try {
    const { data, error } = await client
      .from('plant_images')
      .insert([{
        plant_id: plantId,
        image_data: imageBase64,
        timestamp: timestamp || new Date().toISOString(),
      }]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[DB] Error storing plant image:', error.message);
    throw error;
  }
};

/**
 * Store detection result
 */
export const storeDetectionResult = async (plantId, detectionData, timestamp = null) => {
  try {
    const { data, error } = await client
      .from('plant_detections')
      .insert([{
        plant_id: plantId,
        healthy_count: Math.round(detectionData.healthy || 0),
        sheath_blight_count: Math.round(detectionData.sheath_blight || 0),
        detection_data: detectionData.detections || [],
        inference_ms: Math.round(detectionData.inference_ms || 0),
        error_message: detectionData.error || null,
        timestamp: timestamp || new Date().toISOString(),
      }]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[DB] Error storing detection result:', error.message);
    throw error;
  }
};

/**
 * Query sensor readings by date range
 */
export const getSensorReadings = async (startDate, endDate, limit = 100) => {
  try {
    let query = client
      .from('sensor_readings')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false })
      .limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[DB] Error querying sensor readings:', error.message);
    throw error;
  }
};

/**
 * Query plant images
 */
export const getPlantImages = async (plantId, limit = 20) => {
  try {
    const { data, error } = await client
      .from('plant_images')
      .select('id, plant_id, image_data, timestamp')
      .eq('plant_id', plantId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[DB] Error querying plant images:', error.message);
    throw error;
  }
};

/**
 * Get single plant image with full data
 */
export const getPlantImage = async (imageId) => {
  try {
    const { data, error } = await client
      .from('plant_images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[DB] Error querying plant image:', error.message);
    throw error;
  }
};

/**
 * Query detection results
 */
export const getDetectionResults = async (plantId, limit = 50) => {
  try {
    const { data, error } = await client
      .from('plant_detections')
      .select('*')
      .eq('plant_id', plantId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[DB] Error querying detection results:', error.message);
    throw error;
  }
};

/**
 * Get detection summary for date range
 */
export const getDetectionSummary = async (plantId, startDate, endDate) => {
  try {
    const { data, error } = await client
      .from('plant_detections')
      .select('*')
      .eq('plant_id', plantId)
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        total_healthy: 0,
        total_sheath_blight: 0,
        detection_count: 0,
        avg_inference_ms: 0,
      };
    }

    const summary = {
      total_healthy: data.reduce((sum, d) => sum + (d.healthy_count || 0), 0),
      total_sheath_blight: data.reduce((sum, d) => sum + (d.sheath_blight_count || 0), 0),
      detection_count: data.length,
      avg_inference_ms: Math.round(
        data.reduce((sum, d) => sum + (d.inference_ms || 0), 0) / data.length
      ),
    };

    return summary;
  } catch (error) {
    console.error('[DB] Error getting detection summary:', error.message);
    throw error;
  }
};

/**
 * Delete a single plant snapshot (image and associated detection)
 */
export const deletePlantSnapshot = async (imageId, timestamp) => {
  try {
    // Delete image
    const imagePromise = client
      .from('plant_images')
      .delete()
      .eq('id', imageId);

    // Delete sensor reading (matching timestamp)
    const sensorPromise = client
      .from('sensor_readings')
      .delete()
      .eq('timestamp', timestamp);

    const [imgRes, detRes, sensRes] = await Promise.all([imagePromise, detectionPromise, sensorPromise]);

    if (imgRes.error) throw imgRes.error;
    if (detRes.error) throw detRes.error;
    if (sensRes.error) throw sensRes.error;

    return { success: true };
  } catch (error) {
    console.error('[DB] Error deleting snapshot:', error.message);
    throw error;
  }
};

/**
 * Delete multiple snapshots for a plant
 */
export const deletePlantSnapshots = async (plantId, imageIds, timestamps) => {
  try {
    // Delete images
    const imagePromise = client
      .from('plant_images')
      .delete()
      .in('id', imageIds);

    // Delete detections
    const detectionPromise = client
      .from('plant_detections')
      .delete()
      .eq('plant_id', plantId)
      .in('timestamp', timestamps);

    // Delete sensor readings
    const sensorPromise = client
      .from('sensor_readings')
      .delete()
      .in('timestamp', timestamps);

    const [imgRes, detRes, sensRes] = await Promise.all([imagePromise, detectionPromise, sensorPromise]);

    if (imgRes.error) throw imgRes.error;
    if (detRes.error) throw detRes.error;
    if (sensRes.error) throw sensRes.error;

    return { success: true };
  } catch (error) {
    console.error('[DB] Error deleting multiple snapshots:', error.message);
    throw error;
  }
};

/**
 * Delete all snapshots for a plant
 */
export const deleteAllPlantSnapshots = async (plantId) => {
  try {
    // Delete images
    const imagePromise = client
      .from('plant_images')
      .delete()
      .eq('plant_id', plantId);

    // Delete detections
    const detectionPromise = client
      .from('plant_detections')
      .delete()
      .eq('plant_id', plantId);

    const [imgRes, detRes] = await Promise.all([imagePromise, detectionPromise]);

    if (imgRes.error) throw imgRes.error;
    if (detRes.error) throw detRes.error;

    return { success: true };
  } catch (error) {
    console.error('[DB] Error deleting all snapshots:', error.message);
    throw error;
  }
};

/**
 * Delete a specific sensor reading by timestamp
 */
export const deleteSensorReading = async (timestamp) => {
  try {
    const { error } = await client
      .from('sensor_readings')
      .delete()
      .eq('timestamp', timestamp);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[DB] Error deleting sensor reading:', error.message);
    throw error;
  }
};

/**
 * Delete all sensor readings
 */
export const deleteAllSensorReadings = async () => {
  try {
    const { error } = await client
      .from('sensor_readings')
      .delete()
      .neq('timestamp', '1970-01-01T00:00:00Z'); // Delete all records

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[DB] Error deleting all sensor readings:', error.message);
    throw error;
  }
};

export default client;
