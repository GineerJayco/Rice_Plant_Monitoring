import React, { useMemo, useState } from 'react';
import EspReadings from './EspReadings';
import CameraView from './CameraView';
import DiseaseDetection from './DiseaseDetection';
import DiseaseDetectionSummary from './DiseaseDetectionSummary';
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
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[8px] font-bold text-amber-400 border border-amber-500/20" title={error}>
                    ⚠️ Not Connected — Providing Mock Data
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
          <div className="mt-2">
            <Mqtt
              onLog={handleMqttLog}
              compact
              showStatus={false}
              onConnectionChange={setMqttConnected}
            />
          </div>
          <p className="mt-1 text-gray-400 leading-relaxed text-[10px]">
            Monitoring <span className="text-emerald-300 font-bold text-[10px]">Plant {activePlant}</span>.
          </p>
        </div>



        {/* Bento Layout */}
        <div className="flex-1 mt-2">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:grid-rows-[200px_200px_auto_auto]">
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

            {/* Disease Detection Summary — right side cols 3-4, spanning rows 1-2 */}
            <div className="lg:col-start-3 lg:col-span-2 lg:row-start-1 lg:row-span-2">
              <div className="h-full">
                <DiseaseDetectionSummary plants={plants} />
              </div>
            </div>

            {/* Plant Strip + Disease Status Row 3 */}
            <div className="lg:col-span-4 lg:row-start-3" key={`status-${plantSwapKey}`}>

              {/* Horizontal 6-plant bento strip */}
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 custom-scrollbar">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const p = plants.find(pl => pl.active_plant === num);
                  const thumb = p?.image_url || `/images/plant${num}.svg`;
                  const isActive = activePlant === num;
                  const isDisease = String(p?.disease).toLowerCase() === 'positive';
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onPlantSelect?.(num)}
                      className={`relative flex-shrink-0 w-[calc(16.666%-6px)] min-w-[100px] rounded-xl overflow-hidden border-2 transition-all duration-200 group ${
                        isActive
                          ? 'border-emerald-400 shadow-lg shadow-emerald-500/30 scale-[1.03]'
                          : 'border-white/10 hover:border-sky-400/50 hover:scale-[1.02]'
                      }`}
                    >
                      <img
                        src={thumb}
                        alt={`Plant ${num}`}
                        className="w-full h-20 object-cover bg-gray-950"
                        onError={e => { e.currentTarget.src = `/images/plant${num}.svg`; }}
                      />
                      {/* Disease dot */}
                      {p && (
                        <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                          isDisease ? 'bg-red-400' : 'bg-emerald-400'
                        }`} />
                      )}
                      <div className={`absolute bottom-0 inset-x-0 py-1 text-center text-[9px] font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-emerald-500/80 text-white'
                          : 'bg-gray-950/70 text-slate-400 group-hover:text-white'
                      }`}>
                        Plant {num}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="animate-fadeIn">
                <DiseaseDetection
                  disease={plantData?.disease ?? 'Unknown'}
                  diseaseType={plantData?.disease_type ?? null}
                  timestamp={plantData?.timestamp ?? ''}
                  source={source}
                />
              </div>
              {/* ESP Sensor Readings — 4 across below DiseaseDetection */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-amber-400 rounded-full"></div>
                  <span className="text-[10px] font-black text-slate-300 tracking-[0.15em] uppercase">ESP32 Sensor Readings</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <EspReadings
                    title="Temperature"
                    value={plantData?.temperature ?? '—'}
                    unit="°C"
                    icon="🌡️"
                    tone="amber"
                    meterMax={50}
                    type="temperature"
                  />
                  <EspReadings
                    title="Humidity"
                    value={plantData?.humidity ?? '—'}
                    unit="%"
                    icon="💧"
                    tone="sky"
                    meterMax={100}
                    type="humidity"
                  />
                  <EspReadings
                    title="Soil Moisture"
                    value={plantData?.soil_moisture ?? '—'}
                    unit="%"
                    icon="🪴"
                    tone="emerald"
                    meterMax={100}
                    type="soil"
                  />
                  <EspReadings
                    title="Water Level"
                    value={reservoirData?.level ?? '—'}
                    unit="%"
                    icon="🚰"
                    tone="violet"
                    meterMax={100}
                    type="water"
                  />
                </div>
              </div>
            </div>

            {/* Historical Charts Row 4 */}
            <div className="lg:col-span-4 lg:row-start-4 mt-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-sky-400 rounded-full"></div>
                <span className="text-[10px] font-black text-slate-300 tracking-[0.15em] uppercase">Graphs</span>
              </div>
              <div className="h-[320px]">
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

