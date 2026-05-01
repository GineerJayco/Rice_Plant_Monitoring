import React, { useEffect, useState, useRef } from 'react';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import InitialLoader from './components/InitialLoader';
import Activitylog from './components/Activitylog';
import Mqtt from './components/Mqtt';
import { getCurrentPlantData } from './services/api';

/**
 * Main App Component
 * Redesigned with a Sidebar layout and centralized data fetching.
 */
function App() {
  const [appData, setAppData] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(1);
  const [source, setSource] = useState('api');
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [activityLogs, setActivityLogs] = useState([]);
  const [plantSwapKey, setPlantSwapKey] = useState(0);
  const previousPlantRef = useRef(1);

  const fetchData = async () => {
    setInitialLoading(true);

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
  };

  useEffect(() => {
    if (previousPlantRef.current !== selectedPlant) {
      setPlantSwapKey((k) => k + 1);
      previousPlantRef.current = selectedPlant;
    }
  }, [selectedPlant]);

  useEffect(() => {
    fetchData().catch(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    const now = new Date().toLocaleTimeString();
    setActivityLogs((previous) => [`[${now}] Viewing setup ${selectedPlant}.`, ...previous].slice(0, 80));
  }, [selectedPlant]);

  useEffect(() => {
    if (!lastUpdated) return;
    const now = new Date().toLocaleTimeString();
    setActivityLogs((previous) => [
      `[${now}] Data loaded from ${source === 'mock' ? 'mock' : 'API'}.`,
      ...previous
    ].slice(0, 80));
  }, [lastUpdated, source]);

  const appendActivityLog = (message) => {
    const now = new Date().toLocaleTimeString();
    setActivityLogs((previous) => [`[${now}] ${message}`, ...previous].slice(0, 80));
  };

  if (initialLoading && !appData) return <InitialLoader />;

  // Get data for the specifically selected plant
  const activePlantData = appData?.plants?.find(p => p.active_plant === selectedPlant) || null;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 selection:bg-emerald-500/30 overflow-hidden">
      <div className="mx-auto w-full max-w-[1920px] flex">
        <Sidebar
          selectedPlant={selectedPlant}
          setSelectedPlant={setSelectedPlant}
          refreshing={false}
          lastUpdated={lastUpdated}
          activeView={activeView}
          setActiveView={setActiveView}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {activeView === 'dashboard' ? (
            <Dashboard
              plantData={activePlantData}
              reservoirData={{ level: appData?.reservoir_level, status: appData?.reservoir_status }}
              source={source}
              refreshing={false}
              error={error}
              plantSwapKey={plantSwapKey}
              plants={appData?.plants ?? []}
              onPlantSelect={setSelectedPlant}
              onActivityLog={appendActivityLog}
            />
          ) : (
            <main className="flex-1 h-full overflow-y-auto px-2 py-2 sm:px-4 lg:px-6 custom-scrollbar">
              <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 backdrop-blur-md">
                <h2 className="mb-3 text-lg font-black tracking-tight text-white">Activity Logs</h2>
                <Mqtt onLog={appendActivityLog} compact />
                <div className="mt-3">
                <Activitylog logs={activityLogs} />
                </div>
              </div>
            </main>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

