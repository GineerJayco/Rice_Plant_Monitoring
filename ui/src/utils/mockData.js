/**
 * Mock data for testing when backend is not available
 * Replace with real API calls once Raspberry Pi backend is set up
 */

// Plant-specific data for more realistic simulation
const plantProfiles = [
  { name: 'Tomato', optimalTemp: 25, optimalHumidity: 65, optimalMoisture: 60 },
  { name: 'Lettuce', optimalTemp: 18, optimalHumidity: 70, optimalMoisture: 70 },
  { name: 'Pepper', optimalTemp: 26, optimalHumidity: 70, optimalMoisture: 55 },
  { name: 'Cucumber', optimalTemp: 24, optimalHumidity: 75, optimalMoisture: 65 },
  { name: 'Basil', optimalTemp: 22, optimalHumidity: 60, optimalMoisture: 50 },
  { name: 'Spinach', optimalTemp: 19, optimalHumidity: 65, optimalMoisture: 65 },
];

export const mockPlantData = {
  active_plant: 1,
  temperature: 28.5,
  humidity: 72,
  soil_moisture: 55,
  water_level: 85,
  disease: 'Negative',
  image_url: '/images/plant1.svg',
  timestamp: new Date().toISOString(),
};

/**
 * Generate realistic mock data for a specific plant
 * Simulates sensor data with slight variations
 */
export const mockDataGenerator = () => {
  // Simulate the rotating camera by cycling plants 1 → 6
  mockDataGenerator._plantCursor = (mockDataGenerator._plantCursor || 0) + 1;
  const activePlant = ((mockDataGenerator._plantCursor - 1) % 6) + 1;
  const profile = plantProfiles[activePlant - 1];
  
  // Add some realistic variation around optimal values
  const tempVariation = (Math.random() - 0.5) * 6;
  const humidityVariation = Math.floor((Math.random() - 0.5) * 20);
  const moistureVariation = Math.floor((Math.random() - 0.5) * 20);

  // 85% chance of healthy plant
  const isHealthy = Math.random() > 0.15;
  
  return {
    active_plant: activePlant,
    plant_name: profile.name,
    temperature: parseFloat((profile.optimalTemp + tempVariation).toFixed(1)),
    humidity: Math.max(30, Math.min(100, profile.optimalHumidity + humidityVariation)),
    soil_moisture: Math.max(20, Math.min(100, profile.optimalMoisture + moistureVariation)),
    water_level: Math.floor(70 + Math.random() * 30),
    disease: isHealthy ? 'Negative' : 'Positive',
    disease_type: isHealthy ? null : ['Powdery Mildew', 'Leaf Spot', 'Root Rot', 'Blight'][Math.floor(Math.random() * 4)],
    image_url: `/images/plant${activePlant}.svg`,
    timestamp: new Date().toLocaleString(),
    last_watered: new Date(Date.now() - Math.random() * 86400000).toLocaleTimeString(),
    signal_strength: Math.floor(60 + Math.random() * 40), // WiFi signal %
  };
};

/**
 * Get all plant profiles
 */
export const getAllPlantProfiles = () => plantProfiles;

/**
 * Get plant profile by ID
 */
export const getPlantProfile = (plantId) => {
  if (plantId < 1 || plantId > 6) return null;
  return plantProfiles[plantId - 1];
};
