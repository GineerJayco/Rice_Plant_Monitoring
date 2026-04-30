import React, { useMemo } from 'react';
import BentoGrid from './BentoGrid';
import SensorCard from './SensorCard';
import ImageCard from './ImageCard';
import StatusCard from './StatusCard';
import PlantIndicator from './PlantIndicator';

/**
 * Dashboard Component
 * - Displays data for the active plant
 * - Uses a bento grid layout with circular gauges for sensors
 */
const Dashboard = ({
  plantData,
  source,
  refreshing,
  error,
  lastUpdated,
  plantSwapKey
}) => {
  const activePlant = plantData?.active_plant ?? 1;
  const plantName = plantData?.plant_name ?? '';

  const imageUrl = useMemo(() => {
    return plantData?.image_url || `/images/plant${activePlant}.svg`;
  }, [plantData, activePlant]);

  return (
    <main className="flex-1 h-full flex flex-col overflow-hidden px-2 py-2 sm:px-4 lg:px-6">
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="mb-3 flex flex-row items-center justify-between gap-4">
          <div className="animate-slideIn flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  Dashboard
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8px] font-bold text-emerald-400 border border-emerald-500/20">
                    Live
                  </span>
                </h2>
                {error && (
                  <span className="animate-pulse flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[8px] font-bold text-amber-400 border border-amber-500/20" title={error}>
                    ⚠️ Connection Warning
                  </span>
                )}
              </div>
              <p className="text-gray-400 leading-relaxed text-[10px]">
                Monitoring <span className="text-emerald-300 font-bold text-[10px]">Setup {activePlant}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 animate-fadeIn">
            <PlantIndicator activePlant={activePlant} />
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 backdrop-blur-md px-3 py-1.5">
              <div className={`h-2 w-2 rounded-full ${refreshing ? 'bg-amber-400' : 'bg-emerald-400'} ${refreshing ? 'animate-pulse' : ''}`} />
              <div className="text-[8px]">
                <span className="text-gray-200 font-extrabold">{refreshing ? 'Updating…' : 'Sync: Live'}</span>
              </div>
            </div>
          </div>
        </div>



        {/* Bento Grid Layout */}
        <div className="flex-1">
          <BentoGrid className="gap-4">
            {/* Camera Feed */}
            <div className="lg:col-span-2 lg:row-span-2" key={`image-${plantSwapKey}`}>
              <div className="animate-fadeIn h-full">
                <ImageCard
                  imageUrl={imageUrl}
                  activePlant={activePlant}
                  plantName={plantName}
                  isLoading={refreshing && !plantData}
                  source={source}
                />
              </div>
            </div>

            {/* Sensor Cards Row 1 */}
            <div className="lg:col-start-3 lg:row-start-1">
              <SensorCard
                title="Temperature"
                value={plantData?.temperature ?? '—'}
                unit="°C"
                icon="🌡️"
                tone="amber"
                meterMax={50}
              />
            </div>

            <div className="lg:col-start-4 lg:row-start-1">
              <SensorCard
                title="Humidity"
                value={plantData?.humidity ?? '—'}
                unit="%"
                icon="💧"
                tone="sky"
                meterMax={100}
              />
            </div>

            {/* Sensor Cards Row 2 */}
            <div className="lg:col-start-3 lg:row-start-2">
              <SensorCard
                title="Soil Moisture"
                value={plantData?.soil_moisture ?? '—'}
                unit="%"
                icon="🪴"
                tone="emerald"
                meterMax={100}
              />
            </div>

            <div className="lg:col-start-4 lg:row-start-2">
              <SensorCard
                title="Water Level"
                value={plantData?.water_level ?? '—'}
                unit="%"
                icon="🚰"
                tone="violet"
                meterMax={100}
              />
            </div>

            {/* Disease Status Card Row 3 */}
            <div className="lg:col-span-4 lg:row-start-3" key={`status-${plantSwapKey}`}>
              <div className="animate-fadeIn">
                <StatusCard
                  disease={plantData?.disease ?? 'Unknown'}
                  diseaseType={plantData?.disease_type ?? null}
                  timestamp={plantData?.timestamp ?? ''}
                  source={source}
                />
              </div>
            </div>
          </BentoGrid>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;

