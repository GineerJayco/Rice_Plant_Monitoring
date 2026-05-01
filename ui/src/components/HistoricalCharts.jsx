import React, { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { generateHistoricalData } from '../utils/mockData';

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
  if (active && payload && payload.length >= 2) {
    const temp = payload[0]?.value;
    const hum = payload[1]?.value;
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
  const historyData = useMemo(() => generateHistoricalData(activePlant), [activePlant]);

  // Scatter: each point is { temperature, humidity }
  const scatterData = historyData.map(d => ({
    temperature: d.temperature,
    humidity: d.humidity,
  }));

  // Trend line computed from regression
  const reg = useMemo(() => linearRegression(scatterData, 'temperature', 'humidity'), [scatterData]);
  const trendPoints = useMemo(() => [
    { x: reg.minX, y: parseFloat((reg.m * reg.minX + reg.b).toFixed(1)) },
    { x: reg.maxX, y: parseFloat((reg.m * reg.maxX + reg.b).toFixed(1)) },
  ], [reg]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">

      {/* Scatter: Temperature vs Humidity */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col">
        <div className="mb-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>🌡️</span> Temperature vs Humidity
          </h3>
          <p className="text-[10px] text-gray-500 mt-0.5">Scatter plot with trend line — all readings.</p>
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

              {/* Scatter dots */}
              <Scatter
                name="Readings"
                data={scatterData}
                fill="#10b981"
                fillOpacity={0.85}
                r={4}
              />

              {/* Trend line as a second scatter connected by line */}
              <Scatter
                name="Trend"
                data={trendPoints}
                dataKey="y"
                line={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '0' }}
                lineType="fitting"
                fill="none"
                shape={() => null}
              />
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
          <p className="text-[10px] text-gray-500 mt-0.5">24-hour soil moisture and watering events.</p>
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
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
              <Line
                type="stepAfter"
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
