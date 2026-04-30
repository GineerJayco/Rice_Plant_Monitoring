import React, { useEffect, useState, useRef } from 'react';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Loader from './components/Loader';
import { getCurrentPlantData } from './services/api';

/**
 * Main App Component
 * Redesigned with a Sidebar layout and centralized data fetching.
 */
function App() {
  const POLL_MS = 3000;

  const [plantData, setPlantData] = useState(null);
  const [source, setSource] = useState('api');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [plantSwapKey, setPlantSwapKey] = useState(0);
  const previousPlantRef = useRef(null);

  const fetchData = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setInitialLoading(true);

    const result = await getCurrentPlantData();

    setSource(result.source);
    setError(result.error ? 'API unavailable — showing mock data.' : null);

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
    fetchData().catch(() => setInitialLoading(false));

    const interval = setInterval(() => {
      fetchData({ silent: true }).catch(() => {});
    }, POLL_MS);

    return () => clearInterval(interval);
  }, []);

  if (initialLoading && !plantData) return <Loader />;

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100 selection:bg-emerald-500/30">
      <Sidebar 
        activePlant={plantData?.active_plant ?? 1} 
        refreshing={refreshing} 
        lastUpdated={lastUpdated} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Dashboard 
          plantData={plantData}
          source={source}
          refreshing={refreshing}
          error={error}
          lastUpdated={lastUpdated}
          plantSwapKey={plantSwapKey}
        />
      </div>
    </div>
  );
}

export default App;

