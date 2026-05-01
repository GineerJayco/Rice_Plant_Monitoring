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

export default apiClient;
