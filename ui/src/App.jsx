import React, { useEffect, useState, useRef } from 'react';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import InitialLoader from './components/InitialLoader';
import StoredData from './components/StoredData';
import Mqtt from './components/Mqtt';
import { getCurrentPlantData } from './services/api';
import useMqttData from './hooks/useMqttData';

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

  // Global MQTT Status for Sidebar & components
  const { isConnected: mqttConnected } = useMqttData();

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
    setActivityLogs((previous) => [`[${now}] Viewing plant ${selectedPlant}.`, ...previous].slice(0, 80));
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
          mqttConnected={mqttConnected}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {activeView === 'dashboard' && (
            <Dashboard
              plantData={activePlantData}
              source={source}
              refreshing={false}
              error={error}
              plantSwapKey={plantSwapKey}
              plants={appData?.plants ?? []}
              onPlantSelect={setSelectedPlant}
              onActivityLog={appendActivityLog}
              logs={activityLogs}
            />
          )}
          
          {activeView === 'stored' && (
            <main className="flex-1 h-full overflow-y-auto custom-scrollbar">
              <StoredData />
            </main>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;


