import React, { useEffect, useState, useRef } from 'react';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import InitialLoader from './components/InitialLoader';
import { getCurrentPlantData } from './services/api';

/**
 * Main App Component
 * Redesigned with a Sidebar layout and centralized data fetching.
 */
function App() {
  const POLL_MS = 3000;

  const [appData, setAppData] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(1);
  const [source, setSource] = useState('api');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [plantSwapKey, setPlantSwapKey] = useState(0);
  const previousPlantRef = useRef(1);

  const fetchData = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setInitialLoading(true);

    const result = await getCurrentPlantData();

    setSource(result.source);
    setError(result.error ? 'API unavailable — showing mock data.' : null);

    const next = result.data;

    if (previousPlantRef.current !== selectedPlant) {
      setPlantSwapKey((k) => k + 1);
      previousPlantRef.current = selectedPlant;
    }

    setAppData(next);
    setLastUpdated(new Date());

    setInitialLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (previousPlantRef.current !== selectedPlant) {
      setPlantSwapKey((k) => k + 1);
      previousPlantRef.current = selectedPlant;
    }
  }, [selectedPlant]);

  useEffect(() => {
    fetchData().catch(() => setInitialLoading(false));

    const interval = setInterval(() => {
      fetchData({ silent: true }).catch(() => { });
    }, POLL_MS);

    return () => clearInterval(interval);
  }, []);

  if (initialLoading && !appData) return <InitialLoader />;

  // Get data for the specifically selected plant
  const activePlantData = appData?.plants?.find(p => p.active_plant === selectedPlant) || null;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 selection:bg-emerald-500/30 overflow-hidden">
      <div className="mx-auto w-full max-w-[1920px] flex">
        <Sidebar
          selectedPlant={selectedPlant}
          setSelectedPlant={setSelectedPlant}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Dashboard
            plantData={activePlantData}
            reservoirData={{ level: appData?.reservoir_level, status: appData?.reservoir_status }}
            source={source}
            refreshing={refreshing}
            error={error}
            lastUpdated={lastUpdated}
            plantSwapKey={plantSwapKey}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

