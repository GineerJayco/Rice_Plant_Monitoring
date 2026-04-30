import React, { useEffect, useMemo, useRef, useState } from 'react';
import BentoGrid from './BentoGrid';
import SensorCard from './SensorCard';
import ImageCard from './ImageCard';
import StatusCard from './StatusCard';
import Loader from './Loader';
import PlantIndicator from './PlantIndicator';
import { getCurrentPlantData } from '../services/api';

/**
 * Dashboard Component
 * - Polls `/api/current-data` every 3 seconds
 * - Shows ONE plant at a time (based on rotating camera position)
 * - Uses a bento grid layout with dark theme + emerald accents
 */
const Dashboard = () => {
  const POLL_MS = 3000;

  const [plantData, setPlantData] = useState(null);
  const [source, setSource] = useState('api'); // 'api' | 'mock'
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Used to trigger a smooth fade animation ONLY when the active plant changes
  const [plantSwapKey, setPlantSwapKey] = useState(0);
  const previousPlantRef = useRef(null);

  const fetchData = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setInitialLoading(true);

    const result = await getCurrentPlantData();

    setSource(result.source);
    setError(result.error ? 'API unavailable — showing mock data for demo.' : null);

    const next = result.data;
    const nextActive = next?.active_plant;

    if (previousPlantRef.current !== null && nextActive && previousPlantRef.current !== nextActive) {
      setPlantSwapKey((k) => k + 1);
    }

    previousPlantRef.current = nextActive ?? previousPlantRef.current;
    setPlantData(next);
    setLastUpdated(new Date());

    setInitialLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let mounted = true;

    // Initial load
    fetchData().catch((e) => {
      if (!mounted) return;
      setError('Failed to load data.');
      setInitialLoading(false);
    });

    const interval = setInterval(() => {
      fetchData({ silent: true }).catch(() => {
        // getCurrentPlantData already falls back to mock; keep UI stable.
      });
    }, POLL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePlant = plantData?.active_plant ?? 1;
  const plantName = plantData?.plant_name ?? '';

  const imageUrl = useMemo(() => {
    // In mock mode, images are served from Vite public folder
    if (source === 'mock') return plantData?.image_url || `/images/plant${activePlant}.svg`;
    // API mode: backend can return an absolute URL or a resolved URL (see services/api.js)
    return plantData?.image_url || `/images/plant${activePlant}.svg`;
  }, [plantData, activePlant, source]);

  if (initialLoading && !plantData) return <Loader />;

  return (
    <main className="min-h-0 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col">
        {/* Top bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dashboard
              <span className="ml-3 text-base font-semibold text-emerald-400">(Real-time)</span>
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Currently monitoring <span className="text-emerald-300 font-semibold">Plant {activePlant}</span> — data updates every 3 seconds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <PlantIndicator activePlant={activePlant} />
            </div>
            <div className="hidden md:flex items-center gap-2 rounded-2xl border border-white/10 bg-gray-900/40 backdrop-blur-md px-4 py-3">
              <span className={`h-2 w-2 rounded-full ${refreshing ? 'bg-amber-400' : 'bg-emerald-400'} ${refreshing ? 'animate-pulse' : ''}`} />
              <div className="text-xs text-gray-400">
                <div>
                  Status: <span className="text-gray-200 font-semibold">{refreshing ? 'Updating…' : 'Live'}</span>
                </div>
                {lastUpdated ? (
                  <div>
                    Updated: <span className="text-gray-200 font-semibold">{lastUpdated.toLocaleTimeString()}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error ? (
          <div className="mb-6 rounded-3xl border border-amber-500/25 bg-amber-500/10 px-6 py-4 backdrop-blur-md shadow-lg shadow-amber-500/10 animate-slideIn">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-amber-300">⚠️</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-200">Connection Notice</p>
                <p className="mt-1 text-sm text-amber-100/90">{error}</p>
                <p className="mt-1 text-xs text-amber-100/70">
                  Tip: set <span className="font-mono">VITE_API_URL</span> in <span className="font-mono">.env.local</span>, or force demo mode with <span className="font-mono">VITE_USE_MOCK=true</span>.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Bento grid */}
        <div className="flex-1">
          <BentoGrid className="min-h-0">
          {/* Left: Camera Feed (large) */}
          <div className="lg:col-span-2 lg:row-span-3" key={`image-${plantSwapKey}`}>
            <div className="animate-fadeIn">
              <ImageCard
                imageUrl={imageUrl}
                activePlant={activePlant}
                plantName={plantName}
                isLoading={refreshing && !plantData}
                source={source}
              />
            </div>
          </div>

          {/* Top right: Temperature */}
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

          {/* Top right: Humidity */}
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

          {/* Middle right: Soil Moisture */}
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

          {/* Bottom right: Water Level */}
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

          {/* Wide bottom: Disease Status */}
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
