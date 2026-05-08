import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  fetchSensorHistory,
  fetchDetectionHistory,
  fetchDetectionSummary,
  checkBackendHealth,
} from '../services/api';

/**
 * StoredData Component
 * Displays historical sensor data, images, and disease detection results
 */
const StoredData = () => {
  const [activeTab, setActiveTab] = useState('sensors');
  const [selectedPlant, setSelectedPlant] = useState(1);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const [sensorData, setSensorData] = useState([]);
  const [detectionData, setDetectionData] = useState([]);
  const [detectionSummary, setDetectionSummary] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch backend health on mount
  useEffect(() => {
    checkBackendHealth()
      .then(setBackendHealth)
      .catch(err => console.error('Backend health check failed:', err));
  }, []);

  // Fetch historical data when tab, plant, or date range changes
  useEffect(() => {
    if (!backendHealth?.mqtt?.connected) {
      setError('Backend not connected to MQTT. Data may be incomplete.');
      return;
    }

    fetchHistoricalData();
  }, [activeTab, selectedPlant, dateRange]);

  const fetchHistoricalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = new Date(`${dateRange.start}T00:00:00Z`).toISOString();
      const endDate = new Date(`${dateRange.end}T23:59:59Z`).toISOString();

      if (activeTab === 'sensors') {
        const result = await fetchSensorHistory(startDate, endDate, 1000);
        setSensorData(result.data || []);
      } else if (activeTab === 'detections') {
        // Fetch both detection history and summary
        const [historyResult, summaryResult] = await Promise.all([
          fetchDetectionHistory(selectedPlant, 100),
          fetchDetectionSummary(selectedPlant, startDate, endDate),
        ]);
        setDetectionData(historyResult.data || []);
        setDetectionSummary(summaryResult.summary || null);
      }
    } catch (err) {
      setError(`Failed to fetch ${activeTab} data: ${err.message}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format sensor data for charts
  const chartData = sensorData.map(reading => ({
    timestamp: new Date(reading.timestamp).toLocaleDateString(),
    temp: reading.temp,
    humidity: reading.humidity,
    soil_avg: (
      (reading.soil_1 || 0) +
      (reading.soil_2 || 0) +
      (reading.soil_3 || 0) +
      (reading.soil_4 || 0) +
      (reading.soil_5 || 0) +
      (reading.soil_6 || 0)
    ) / 6,
    water_healthy: reading.water_level_healthy,
    water_diseased: reading.water_level_diseased,
  }));

  if (!backendHealth) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <div className="text-yellow-400 mb-4">⚙️</div>
        <p className="text-gray-400">Connecting to backend...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 overflow-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">
          📊 Historical Data
        </h1>
        <p className="text-gray-400 text-sm">
          {backendHealth?.mqtt?.connected ? '✅ Connected to data backend' : '⚠️ Backend disconnected'}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">⚠️ {error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tab Selection */}
        <div className="flex gap-2">
          {['sensors', 'detections'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === tab
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab === 'sensors' ? '📈 Sensors' : '🎯 Detections'}
            </button>
          ))}
        </div>

        {/* Plant Selector (for detections) */}
        {activeTab === 'detections' && (
          <select
            value={selectedPlant}
            onChange={e => setSelectedPlant(Number(e.target.value))}
            className="px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600"
          >
            {[1, 2, 3, 4, 5, 6].map(p => (
              <option key={p} value={p}>
                Plant {p}
              </option>
            ))}
          </select>
        )}

        {/* Date Range */}
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 text-sm"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 text-sm"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin text-emerald-400">
            <span className="text-3xl">⟳</span>
          </div>
          <span className="ml-3 text-gray-400">Loading data...</span>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {activeTab === 'sensors' && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-bold mb-4">Temperature & Humidity</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="timestamp" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#444' }} />
                    <Legend />
                    <Line type="monotone" dataKey="temp" stroke="#ff6b6b" name="Temperature (°C)" />
                    <Line type="monotone" dataKey="humidity" stroke="#4dabf7" name="Humidity (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-bold mb-4">Soil Moisture (Average)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="timestamp" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#444' }} />
                    <Legend />
                    <Line type="monotone" dataKey="soil_avg" stroke="#51cf66" name="Avg Soil Moisture (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-bold mb-4">Water Levels</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="timestamp" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#444' }} />
                    <Legend />
                    <Line type="monotone" dataKey="water_healthy" stroke="#51cf66" name="Healthy Tank (cm)" />
                    <Line type="monotone" dataKey="water_diseased" stroke="#ff8787" name="Diseased Tank (cm)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="text-gray-400 text-sm text-center">
                {sensorData.length > 0 ? `${sensorData.length} readings` : 'No data available'}
              </div>
            </div>
          )}

          {activeTab === 'detections' && (
            <div className="space-y-6">
              {/* Detection Summary */}
              {detectionSummary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Healthy Detections</p>
                    <p className="text-3xl font-black text-emerald-400">{detectionSummary.total_healthy}</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Sheath Blight</p>
                    <p className="text-3xl font-black text-red-400">{detectionSummary.total_sheath_blight}</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Detection Cycles</p>
                    <p className="text-3xl font-black text-blue-400">{detectionSummary.detection_count}</p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Avg Inference Time</p>
                    <p className="text-3xl font-black text-purple-400">{detectionSummary.avg_inference_ms}ms</p>
                  </div>
                </div>
              )}

              {/* Recent Detections */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-bold mb-4">Recent Detections</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {detectionData.length > 0 ? (
                    detectionData.map((detection, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="text-sm">
                          <p className="text-gray-300">{new Date(detection.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-emerald-400 font-bold">H: {detection.healthy_count}</span>
                          <span className="text-red-400 font-bold">B: {detection.sheath_blight_count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-6">No detection data available</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StoredData;
