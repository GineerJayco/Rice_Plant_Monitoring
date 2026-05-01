import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { generateHistoricalData } from '../utils/mockData';

const HistoricalCharts = ({ activePlant }) => {
  // Generate mock history when plant changes
  const historyData = useMemo(() => generateHistoricalData(activePlant), [activePlant]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      
      {/* Temp & Humidity Chart */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col">
        <div className="mb-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>📈</span> Environment History
          </h3>
          <p className="text-[10px] text-gray-500">24-hour temperature and humidity trend.</p>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={10} 
                tickMargin={10}
                tick={{fill: '#64748b'}} 
              />
              <YAxis 
                yAxisId="left" 
                stroke="#64748b" 
                fontSize={10} 
                tick={{fill: '#64748b'}}
                domain={['auto', 'auto']}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#64748b" 
                fontSize={10} 
                tick={{fill: '#64748b'}}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', fontSize: '12px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
              <Line 
                yAxisId="left" 
                type="monotone" 
                name="Temperature (°C)" 
                dataKey="temperature" 
                stroke="#fbbf24" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 4 }} 
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                name="Humidity (%)" 
                dataKey="humidity" 
                stroke="#38bdf8" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 4 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Soil Moisture Chart */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col">
        <div className="mb-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>🪴</span> Soil Moisture History
          </h3>
          <p className="text-[10px] text-gray-500">24-hour soil moisture and watering events.</p>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={10} 
                tickMargin={10}
                tick={{fill: '#64748b'}} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tick={{fill: '#64748b'}}
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
