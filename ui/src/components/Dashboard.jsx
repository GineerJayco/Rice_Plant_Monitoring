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
    <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col">
        {/* Header Section */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="animate-slideIn">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-4">
              Dashboard
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                Live
              </span>
            </h2>
            <p className="mt-3 text-gray-400 max-w-xl leading-relaxed text-sm">
              Real-time monitoring of <span className="text-emerald-300 font-bold">Setup {activePlant}</span>.
            </p>
          </div>

          <div className="flex items-center gap-4 animate-fadeIn">
            <PlantIndicator activePlant={activePlant} />
            <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md px-5 py-3">
              <div className={`h-2.5 w-2.5 rounded-full ${refreshing ? 'bg-amber-400' : 'bg-emerald-400'} ${refreshing ? 'animate-pulse' : ''}`} />
              <div className="text-[10px]">
                <span className="text-gray-500 font-bold uppercase tracking-widest mr-2">Sync:</span>
                <span className="text-gray-200 font-extrabold">{refreshing ? 'Updating…' : 'Connected'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error ? (
          <div className="mb-8 rounded-[2rem] border border-amber-500/20 bg-amber-500/5 px-8 py-5 backdrop-blur-md animate-slideIn">
            <div className="flex items-center gap-4">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-xs font-bold text-amber-200 tracking-wide uppercase">Connection Warning</p>
                <p className="mt-1 text-xs text-amber-100/70">{error}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Bento Grid Layout */}
        <div className="flex-1">
          <BentoGrid className="gap-6 sm:gap-8">
            {/* Camera Feed */}
            <div className="lg:col-span-2 lg:row-span-3" key={`image-${plantSwapKey}`}>
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

            {/* Sensor Cards */}
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

            <div className="lg:col-start-3 lg:col-span-2 lg:row-start-2">
              <SensorCard
                title="Soil Moisture"
                value={plantData?.soil_moisture ?? '—'}
                unit="%"
                icon="🪴"
                tone="emerald"
                meterMax={100}
              />
            </div>

            <div className="lg:col-start-3 lg:col-span-2 lg:row-start-3">
              <SensorCard
                title="Water Level"
                value={plantData?.water_level ?? '—'}
                unit="%"
                icon="🚰"
                tone="violet"
                meterMax={100}
              />
            </div>

            {/* Disease Status Card */}
            <div className="lg:col-span-4 lg:row-start-4" key={`status-${plantSwapKey}`}>
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

