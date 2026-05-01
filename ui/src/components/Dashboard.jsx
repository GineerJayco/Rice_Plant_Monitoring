import React, { useMemo, useState } from 'react';
import SensorView from './SensorView';
import CameraView from './CameraView';
import StatusDetectionView from './StatusDetectionView';
import SetupIndicator from './SetupIndicator';
import HistoricalCharts from './HistoricalCharts';
import Mqtt from './Mqtt';

/**
 * Dashboard Component
 * - Displays data for the active plant
 * - Uses a bento-style layout with specialized visual cards
 */
const Dashboard = ({
  plantData,
  reservoirData,
  source,
  refreshing,
  error,
  plantSwapKey,
  plants = [],
  onPlantSelect,
  onActivityLog
}) => {
  const activePlant = plantData?.active_plant ?? 1;
  const plantName = plantData?.plant_name ?? '';
  const [mqttConnected, setMqttConnected] = useState(false);

  const imageUrl = useMemo(() => {
    return plantData?.image_url || `/images/plant${activePlant}.svg`;
  }, [plantData, activePlant]);

  const handleMqttLog = (message) => {
    onActivityLog?.(message);
  };

  return (
    <main className="flex-1 h-full flex flex-col overflow-y-auto overflow-x-hidden px-2 py-2 sm:px-4 lg:px-6 custom-scrollbar">
      <div className="flex flex-col min-h-full pb-6">
        {/* Header Section */}
        <div className="mb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="animate-slideIn">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  Dashboard
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[8px] font-bold text-red-400 border border-red-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Live
                  </span>
                </h2>
                {error && (
                  <span className="animate-pulse flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[8px] font-bold text-amber-400 border border-amber-500/20" title={error}>
                    ⚠️ Connection Warning
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 animate-fadeIn">
            {/* Global Reservoir Status Banner */}
            <div className="hidden sm:flex items-center gap-3 rounded-xl border border-white/5 bg-gray-900/50 backdrop-blur-md px-4 py-2">
              <span className="text-xl">🚰</span>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Reservoir</span>
                <span className={`text-xs font-black tracking-tight ${reservoirData?.status === 'LOW' ? 'text-red-400' : 'text-blue-400'}`}>
                  {reservoirData?.status || 'UNKNOWN'}
                </span>
              </div>
            </div>

            <SetupIndicator activePlant={activePlant} />
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 backdrop-blur-md px-3 py-1.5">
              <div className={`h-2 w-2 rounded-full ${refreshing ? 'bg-amber-400' : 'bg-red-500'} animate-pulse`} />
              <div className="text-[8px] leading-tight">
                <span className="text-gray-200 font-extrabold">{refreshing ? 'Updating…' : 'Sync: Live'}</span>
                <div className={mqttConnected ? 'text-emerald-300' : 'text-slate-300'}>
                  {mqttConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            </div>
          </div>
        </div>
          <p className="mt-1 text-gray-400 leading-relaxed text-[10px]">
            Monitoring <span className="text-emerald-300 font-bold text-[10px]">Setup {activePlant}</span>.
          </p>
          <div className="mt-2">
            <Mqtt
              onLog={handleMqttLog}
              compact
              showStatus={false}
              onConnectionChange={setMqttConnected}
            />
          </div>
        </div>



        {/* Bento Layout */}
        <div className="flex-1 mt-2">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:grid-rows-[repeat(2,1fr)_auto_auto]">
            {/* Camera Feed */}
            <div className="lg:col-span-2 lg:row-span-2" key={`image-${plantSwapKey}`}>
              <div className="animate-fadeIn h-full">
                <CameraView
                  imageUrl={imageUrl}
                  activePlant={activePlant}
                  plantName={plantName}
                  plants={plants}
                  onPlantSelect={onPlantSelect}
                  isLoading={refreshing && !plantData}
                  source={source}
                  timestamp={plantData?.timestamp ?? ''}
                />
              </div>
            </div>

            {/* Sensor Cards Row 1 */}
            <div className="lg:col-start-3 lg:row-start-1">
              <SensorView
                title="Temperature"
                value={plantData?.temperature ?? '—'}
                unit="°C"
                icon="🌡️"
                tone="amber"
                meterMax={50}
                type="temperature"
              />
            </div>

            <div className="lg:col-start-4 lg:row-start-1">
              <SensorView
                title="Humidity"
                value={plantData?.humidity ?? '—'}
                unit="%"
                icon="💧"
                tone="sky"
                meterMax={100}
                type="humidity"
              />
            </div>

            {/* Sensor Cards Row 2 */}
            <div className="lg:col-start-3 lg:row-start-2">
              <SensorView
                title="Soil Moisture"
                value={plantData?.soil_moisture ?? '—'}
                unit="%"
                icon="🪴"
                tone="emerald"
                meterMax={100}
                type="soil"
              />
            </div>

            <div className="lg:col-start-4 lg:row-start-2">
              <SensorView
                title="Water Level"
                value={reservoirData?.level ?? '—'}
                unit="%"
                icon="🚰"
                tone="violet"
                meterMax={100}
                type="water"
              />
            </div>

            {/* Disease Status Card Row 3 */}
            <div className="lg:col-span-4 lg:row-start-3" key={`status-${plantSwapKey}`}>
              <div className="animate-fadeIn">
                <StatusDetectionView
                  disease={plantData?.disease ?? 'Unknown'}
                  diseaseType={plantData?.disease_type ?? null}
                  timestamp={plantData?.timestamp ?? ''}
                  source={source}
                />
              </div>
            </div>

            {/* Historical Charts Row 4 */}
            <div className="lg:col-span-4 lg:row-start-4 mt-2">
              <div className="h-[280px]">
                <HistoricalCharts activePlant={activePlant} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;

