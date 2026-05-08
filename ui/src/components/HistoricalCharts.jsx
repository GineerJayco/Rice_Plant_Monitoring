import React, { useMemo, useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { fetchSensorHistory } from '../services/api';

/**
 * Compute a simple linear regression y = m*x + b for scatter trend line.
 */
const linearRegression = (data, xKey, yKey) => {
  const n = data.length;
  if (n < 2) return { m: 0, b: 0, minX: 0, maxX: 0 };
  const sumX = data.reduce((acc, d) => acc + d[xKey], 0);
  const sumY = data.reduce((acc, d) => acc + d[yKey], 0);
  const sumXY = data.reduce((acc, d) => acc + d[xKey] * d[yKey], 0);
  const sumX2 = data.reduce((acc, d) => acc + d[xKey] * d[xKey], 0);
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const b = (sumY - m * sumX) / n;
  const minX = Math.min(...data.map(d => d[xKey]));
  const maxX = Math.max(...data.map(d => d[xKey]));
  return { m, b, minX, maxX };
};

const CustomScatterTooltip = ({ active, payload }) => {
  if (active && payload && payload.length >= 1) {
    const temp = payload.find(p => p.name === 'Temperature')?.value;
    const hum = payload.find(p => p.name === 'Humidity')?.value;
    return (
      <div className="bg-gray-950 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
        <p className="text-amber-400 font-bold">🌡️ Temp: {temp}°C</p>
        <p className="text-sky-400 font-bold">💧 Humidity: {hum}%</p>
      </div>
    );
  }
  return null;
};

const HistoricalCharts = ({ activePlant }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch last 7 days of data by default
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const result = await fetchSensorHistory(startDate, endDate, 500);

        if (result.success) {
          // Map backend data to chart format
          const formattedData = result.data.map(d => ({
            time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fullDate: new Date(d.timestamp).toLocaleString(),
            temperature: d.temp,
            humidity: d.humidity,
            soil_moisture: (
              (d.soil_1 || 0) + (d.soil_2 || 0) + (d.soil_3 || 0) +
              (d.soil_4 || 0) + (d.soil_5 || 0) + (d.soil_6 || 0)
            ) / 6,
            water_level_healthy: d.water_level_healthy,
            water_level_diseased: d.water_level_diseased
          }));
          setHistoryData(formattedData);
        } else {
          setError('Failed to fetch historical data');
        }
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activePlant]);

  // Scatter: each point is { temperature, humidity }
  const scatterData = useMemo(() => historyData.map(d => ({
    temperature: d.temperature,
    humidity: d.humidity,
  })).filter(d => d.temperature != null && d.humidity != null), [historyData]);

  // Trend line computed from regression
  const reg = useMemo(() => linearRegression(scatterData, 'temperature', 'humidity'), [scatterData]);
  const trendPoints = useMemo(() => {
    if (scatterData.length < 2) return [];
    return [
      { temperature: reg.minX, humidity: 0 },
      { temperature: reg.maxX, humidity: 95 },
    ];
  }, [reg, scatterData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-400 font-medium">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 text-center">
        <p className="text-xs text-red-400">Failed to load historical data: {error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">

      {/* Scatter: Temperature vs Humidity */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col">
        <div className="mb-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>🌡️</span> Temperature vs Humidity
          </h3>
          <p className="text-[10px] text-gray-500 mt-0.5">Scatter plot with trend line — latest readings.</p>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                type="number"
                dataKey="temperature"
                name="Temperature"
                unit="°C"
                stroke="#64748b"
                fontSize={10}
                tick={{ fill: '#64748b' }}
                label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -12, fontSize: 10, fill: '#94a3b8' }}
                domain={['auto', 'auto']}
              />
              <YAxis
                type="number"
                dataKey="humidity"
                name="Humidity"
                unit="%"
                stroke="#64748b"
                fontSize={10}
                tick={{ fill: '#64748b' }}
                label={{ value: 'Humidity (%)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 10, fill: '#94a3b8' }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomScatterTooltip />} cursor={{ stroke: '#334155', strokeDasharray: '3 3' }} />

              <Scatter
                name="Readings"
                data={scatterData}
                fill="#10b981"
                fillOpacity={0.85}
                r={4}
              />

              {trendPoints.length > 0 && (
                <Scatter
                  name="Trend"
                  data={trendPoints}
                  line={{ stroke: '#ef4444', strokeWidth: 4, strokeDasharray: '0' }}
                  lineType="fitting"
                  legendType="none"
                  shape={<circle r={0} />}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Soil Moisture Line Chart */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col">
        <div className="mb-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>🪴</span> Soil Moisture History
          </h3>
          <p className="text-[10px] text-gray-500 mt-0.5">Historical average soil moisture trends.</p>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={10}
                tickMargin={8}
                tick={{ fill: '#64748b' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tick={{ fill: '#64748b' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', fontSize: '12px' }}
                itemStyle={{ color: '#f8fafc' }}
                labelFormatter={(value, payload) => payload[0]?.payload?.fullDate || value}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
              <Line
                type="monotone"
                name="Soil Moisture (%)"
                dataKey="soil_moisture"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default HistoricalCharts;
