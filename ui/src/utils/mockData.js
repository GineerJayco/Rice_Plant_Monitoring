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

/**
 * Generate realistic mock data for all 6 plants at once
 */
export const mockDataGenerator = () => {
  const plantsData = plantProfiles.map((profile, index) => {
    const activePlant = index + 1;
    
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
      disease: isHealthy ? 'Negative' : 'Positive',
      disease_type: isHealthy ? null : ['Powdery Mildew', 'Leaf Spot', 'Root Rot', 'Blight'][Math.floor(Math.random() * 4)],
      image_url: `/images/plant${activePlant}.svg`,
      timestamp: new Date().toLocaleString(),
      last_watered: new Date(Date.now() - Math.random() * 86400000).toLocaleTimeString(),
      signal_strength: Math.floor(60 + Math.random() * 40), // WiFi signal %
    };
  });

  return {
    plants: plantsData
  };
};

/**
 * Generate mock historical data for the charts
 */
export const generateHistoricalData = (plantId) => {
  const profile = plantProfiles[plantId - 1] || plantProfiles[0];
  const history = [];
  const now = new Date();

  // Generate data for the last 24 hours (one point per hour)
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    
    // Add slight random walk to data
    const tempVariation = Math.sin(i / 3) * 5 + (Math.random() - 0.5) * 2;
    const humVariation = Math.cos(i / 4) * 10 + (Math.random() - 0.5) * 5;
    const moistVariation = (i % 8 === 0 ? 20 : 0) - (i % 8) * 2 + (Math.random() - 0.5) * 5; // Simulating watering spikes

    history.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: parseFloat((profile.optimalTemp + tempVariation).toFixed(1)),
      humidity: Math.floor(profile.optimalHumidity + humVariation),
      soil_moisture: Math.floor(Math.max(10, Math.min(100, profile.optimalMoisture - 10 + moistVariation))),
    });
  }

  return history;
};

export const getAllPlantProfiles = () => plantProfiles;
export const getPlantProfile = (plantId) => {
  if (plantId < 1 || plantId > 6) return null;
  return plantProfiles[plantId - 1];
};
