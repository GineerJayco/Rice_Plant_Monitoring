/**
 * API Service for Smart Irrigation System
 * Handles all HTTP requests to the Raspberry Pi backend
 */

import axios from 'axios';
import { mockDataGenerator } from '../utils/mockData';

// Configure API base URL
// Replace with your actual Raspberry Pi IP address if not using localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const USE_MOCK = String(import.meta.env.VITE_USE_MOCK || '').toLowerCase() === 'true';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch current plant monitoring data from API
 * Returns real-time sensor data for the active plant
 * @returns {Promise<Object>} Plant data object with temperature, humidity, soil moisture, etc.
 */
export const fetchCurrentPlantData = async () => {
  try {
    const response = await apiClient.get('/api/current-data');
    return response.data;
  } catch (error) {
    console.error('Error fetching plant data:', error);
    throw error;
  }
};

/**
 * Normalize/resolve image URL from backend responses.
 * - If image_url is absolute (http/https), keep it.
 * - If image_url is relative and VITE_IMAGE_BASE_URL is set, prefix it.
 * - Otherwise, prefix with VITE_API_URL (assumes backend serves images).
 */
export const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return imageUrl;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  const base = import.meta.env.VITE_IMAGE_BASE_URL || API_BASE_URL;
  if (imageUrl.startsWith('/')) return `${base}${imageUrl}`;
  return `${base}/${imageUrl}`;
};

/**
 * Get current plant data with safe fallback to mock data.
 * Uses `VITE_USE_MOCK=true` to force mock mode.
 */
export const getCurrentPlantData = async () => {
  // Force mock mode (useful during UI development / demos)
  if (USE_MOCK) {
    return { data: mockDataGenerator(), source: 'mock', error: null };
  }

  try {
    const data = await fetchCurrentPlantData();

    // If your backend returns "/images/...", prefix it so the browser loads it from the Pi server.
    // For arrays, we map over the plants
    const normalizedPlants = data.plants?.map(plant => ({
      ...plant,
      image_url: plant.image_url?.startsWith('/')
        ? resolveImageUrl(plant.image_url)
        : plant.image_url,
    })) || [];

    const normalizedData = {
      ...data,
      plants: normalizedPlants
    };

    return { data: normalizedData, source: 'api', error: null };
  } catch (error) {
    // Graceful fallback for thesis demos when backend is offline.
    return { data: mockDataGenerator(), source: 'mock', error };
  }
};

/**
 * Fetch all plants data (historical or status)
 * @returns {Promise<Array>} Array of plant data objects
 */
export const fetchAllPlantsData = async () => {
  try {
    const response = await apiClient.get('/api/plants');
    return response.data;
  } catch (error) {
    console.error('Error fetching all plants data:', error);
    throw error;
  }
};

// ============================================================
//  HISTORICAL DATA API (Backend Server at VITE_BACKEND_URL)
// ============================================================

// Separate client for backend server (Render, Railway, etc.)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const backendClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch sensor readings for a date range
 * @param {string} startDate - ISO 8601 format (e.g., 2024-01-01T00:00:00Z)
 * @param {string} endDate - ISO 8601 format
 * @param {number} limit - max records to return (default: 100)
 * @returns {Promise<Object>} { success, count, data: [...] }
 */
export const fetchSensorHistory = async (startDate, endDate, limit = 100) => {
  try {
    const response = await backendClient.get('/api/history/sensors', {
      params: { startDate, endDate, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching sensor history:', error);
    throw error;
  }
};

/**
 * Fetch plant images
 * @param {number} plant - Plant ID (1-6)
 * @param {number} limit - max records (default: 50)
 * @returns {Promise<Object>} { success, count, data: [...] }
 */
export const fetchPlantImages = async (plant, limit = 50) => {
  try {
    const response = await backendClient.get('/api/history/images', {
      params: { plant, limit }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching images for plant ${plant}:`, error);
    throw error;
  }
};

/**
 * Fetch single plant image with base64 data
 * @param {string} imageId - Image ID from database
 * @returns {Promise<Object>} { success, data: { id, plant_id, image_data, timestamp } }
 */
export const fetchPlantImage = async (imageId) => {
  try {
    const response = await backendClient.get(`/api/history/images/${imageId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching image ${imageId}:`, error);
    throw error;
  }
};

/**
 * Fetch detection results for a plant
 * @param {number} plant - Plant ID (1-6)
 * @param {number} limit - max records (default: 50)
 * @returns {Promise<Object>} { success, count, data: [...] }
 */
export const fetchDetectionHistory = async (plant, limit = 50) => {
  try {
    const response = await backendClient.get('/api/history/detections', {
      params: { plant, limit }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching detections for plant ${plant}:`, error);
    throw error;
  }
};

/**
 * Fetch detection summary for a plant in date range
 * @param {number} plant - Plant ID (1-6)
 * @param {string} startDate - ISO 8601 format
 * @param {string} endDate - ISO 8601 format
 * @returns {Promise<Object>} { success, summary: { total_healthy, total_sheath_blight, detection_count, avg_inference_ms } }
 */
export const fetchDetectionSummary = async (plant, startDate, endDate) => {
  try {
    const response = await backendClient.get(`/api/history/detections/summary/${plant}`, {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching detection summary for plant ${plant}:`, error);
    throw error;
  }
};

/**
 * Check backend health status
 * @returns {Promise<Object>} { status, mqtt: { connected }, uptime }
 */
export const checkBackendHealth = async () => {
  try {
    const response = await backendClient.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('Error checking backend health:', error);
    throw error;
  }
};

/**
 * Fetch historical data for a specific plant
 * @param {number} plantId - Plant ID (1-6)
 * @returns {Promise<Object>} Historical data for the plant
 */
export const fetchPlantHistory = async (plantId) => {
  try {
    const response = await apiClient.get(`/api/plant/${plantId}/history`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching history for plant ${plantId}:`, error);
    throw error;
  }
};

/**
 * Get API health status
 * @returns {Promise<Object>} API status information
 */
export const checkApiHealth = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
};

/**
 * Delete a single snapshot
 * @param {string} id - Image ID
 * @param {string} timestamp - Timestamp of the snapshot
 */
export const deleteSnapshot = async (id, timestamp) => {
  try {
    const response = await backendClient.delete(`/api/history/snapshots/${id}`, {
      params: { timestamp }
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting snapshot ${id}:`, error);
    throw error;
  }
};

/**
 * Delete multiple snapshots
 * @param {number} plantId 
 * @param {string[]} imageIds 
 * @param {string[]} timestamps 
 */
export const deleteSnapshotsBulk = async (plantId, imageIds, timestamps) => {
  try {
    const response = await backendClient.delete('/api/history/snapshots/bulk', {
      data: { plantId, imageIds, timestamps }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting snapshots bulk:', error);
    throw error;
  }
};

/**
 * Delete all snapshots for a plant
 * @param {number} plantId 
 */
export const deleteAllSnapshots = async (plantId) => {
  try {
    const response = await backendClient.delete(`/api/history/snapshots/all/${plantId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting all snapshots for plant ${plantId}:`, error);
    throw error;
  }
};

export default apiClient;
