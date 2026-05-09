import React, { useMemo, useState } from 'react';
import EspReadings from './EspReadings';
import CameraView from './CameraView';
import DiseaseDetection from './DiseaseDetection';
import DiseaseDetectionSummary from './DiseaseDetectionSummary';
import SetupIndicator from './SetupIndicator';
import HistoricalCharts from './HistoricalCharts';
import Mqtt from './Mqtt';
import MqttStatus from './MqttStatus';
import useMqttData from '../hooks/useMqttData';
import Activitylog from './Activitylog';
import PlantStrip from './6button';

/**
 * Dashboard Component
 * - When DISCONNECTED: shows mock/API data
 * - When CONNECTED: shows ONLY MQTT data (with "Waiting..." placeholders for missing values)
 * - Uses a bento-style layout with specialized visual cards
 */
const Dashboard = ({
  plantData,
  source,
  refreshing,
  error,
  plantSwapKey,
  plants = [],
  onPlantSelect,
  onActivityLog,
  logs = [], // Added logs prop
}) => {
  const activePlant = plantData?.active_plant ?? 1;
  const plantName = plantData?.plant_name ?? '';
  const [mqttConnected, setMqttConnected] = useState(false);

  // ── MQTT Data Hook ──
  const {
    sensors: mqttSensors,
    plantImages,
    plantDetections,
    detectionSummary,
    isConnected: mqttIsConnected,
    error: mqttError,
    lastSensorTime,
  } = useMqttData();

  // Determine if we have live MQTT sensor data
  const hasMqttSensors = mqttSensors.temp !== null;
  const hasMqttImage = !!plantImages[activePlant];
  const hasMqttDetection = !!plantDetections[activePlant];

  // ── DATA ROUTING ──
  // When MQTT connected: show ONLY MQTT data (never mock)
  // When disconnected: show mock/API data

  // Image
  const imageUrl = useMemo(() => {
    if (mqttIsConnected) return null; // Don't show mock images when connected
    return plantData?.image_url || `/images/plant${activePlant}.svg`;
  }, [mqttIsConnected, plantData, activePlant]);

  const base64Image = plantImages[activePlant] || null;

  // Sensor values
  const displayTemp = mqttIsConnected
    ? (hasMqttSensors ? mqttSensors.temp : '—')
    : (plantData?.temperature ?? '—');
  const displayHum = mqttIsConnected
    ? (hasMqttSensors ? mqttSensors.hum : '—')
    : (plantData?.humidity ?? '—');
  const displaySoil = mqttIsConnected
    ? (hasMqttSensors ? (mqttSensors[`soil_${activePlant}`] ?? '—') : '—')
    : (plantData?.soil_moisture ?? '—');
  const displayWaterGroup1 = mqttIsConnected
    ? (hasMqttSensors ? (mqttSensors.water_level_healthy ?? '—') : '—')
    : '—';
  const displayWaterGroup2 = mqttIsConnected
    ? (hasMqttSensors ? (mqttSensors.water_level_diseased ?? '—') : '—')
    : '—';

  // Detection data for the active plant
  const activeDetection = mqttIsConnected
    ? (plantDetections[activePlant] || null)
    : null;

  // Plants to pass to summary (empty when connected so mock doesn't leak through)
  const summaryPlants = mqttIsConnected ? [] : plants;

  const handleMqttLog = (message) => {
    onActivityLog?.(message);
  };

  // Timestamp to display
  const displayTimestamp = useMemo(() => {
    if (mqttIsConnected && lastSensorTime) {
      return lastSensorTime.toLocaleString();
    }
    if (!mqttIsConnected) {
      return plantData?.timestamp ?? '';
    }
    return '';
  }, [mqttIsConnected, lastSensorTime, plantData?.timestamp]);

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
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-bold border ${mqttIsConnected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${mqttIsConnected ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                    {mqttIsConnected ? 'Live' : 'Mock'}
                  </span>
                </h2>
                {!mqttIsConnected && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[8px] font-bold text-amber-400 border border-amber-500/20">
                    ⚠️ Not Connected — Showing Mock Data
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 animate-fadeIn">
              <MqttStatus isConnected={mqttIsConnected} error={mqttError} />
              <SetupIndicator activePlant={activePlant} />
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 backdrop-blur-md px-3 py-1.5">
                <div className={`h-2 w-2 rounded-full ${mqttIsConnected ? 'bg-emerald-500' : 'bg-amber-400'} animate-pulse`} />
                <div className="text-[8px] leading-tight">
                  <span className="text-gray-200 font-extrabold">
                    {mqttIsConnected ? 'HiveMQ Cloud Live' : 'Mock Mode'}
                  </span>
                  <div className={mqttIsConnected ? 'text-emerald-300' : 'text-amber-300'}>
                    {mqttIsConnected ? 'Connected' : 'Disconnected'}
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
            Monitoring <span className="text-emerald-300 font-bold text-[10px]">Plant {activePlant}</span>
            {mqttIsConnected && hasMqttSensors && lastSensorTime && (
              <span className="text-gray-500 ml-2">
                · Last sensor update: <span className="text-emerald-400/70">{lastSensorTime.toLocaleTimeString()}</span>
              </span>
            )}
            {mqttIsConnected && !hasMqttSensors && (
              <span className="text-amber-400/60 ml-2">
                · Waiting for sensor data from Raspberry Pi...
              </span>
            )}
          </p>
        </div>



        {/* Bento Layout */}
        <div className="flex-1 mt-2">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:grid-rows-[200px_200px_auto_auto_auto]">
            {/* Camera Feed */}
            <div className="lg:col-span-2 lg:row-span-2" key={`image-${plantSwapKey}`}>
              <div className="animate-fadeIn h-full">
                <CameraView
                  imageUrl={imageUrl}
                  base64Image={base64Image}
                  mqttConnected={mqttIsConnected}
                  activePlant={activePlant}
                  isLoading={!mqttIsConnected && refreshing && !plantData}
                  source={mqttIsConnected ? 'mqtt' : source}
                  timestamp={displayTimestamp}
                />
              </div>
            </div>

            {/* Disease Detection Summary — right side cols 3-4, spanning rows 1-2 */}
            <div className="lg:col-start-3 lg:col-span-2 lg:row-start-1 lg:row-span-2">
              <div className="h-full">
                <DiseaseDetectionSummary
                  plants={summaryPlants}
                  plantDetections={plantDetections}
                  mqttConnected={mqttIsConnected}
                />
              </div>
            </div>

            {/* Plant Strip + Disease Status Row 3 */}
            <div className="lg:col-span-4 lg:row-start-3">

              {/* Horizontal 6-plant bento strip extracted to PlantStrip */}
              <PlantStrip
                plants={plants}
                activePlant={activePlant}
                plantDetections={plantDetections}
                plantImages={plantImages}
                onPlantSelect={onPlantSelect}
                mqttIsConnected={mqttIsConnected}
              />

              <div className="animate-fadeIn">
                {mqttIsConnected && !hasMqttDetection ? (
                  /* Connected but no detection yet — show waiting state */
                  <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-amber-500/3 to-gray-950 p-3 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin flex-shrink-0" />
                      <div>
                        <p className="text-[8px] font-semibold uppercase tracking-widest text-gray-400">Detection — Plant {activePlant}</p>
                        <p className="text-sm font-bold text-amber-300 mt-0.5">Waiting for detection results...</p>
                        <p className="text-[9px] text-gray-500 mt-1">Detection data arrives with each image capture (~60s per plant)</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <DiseaseDetection
                    detection={activeDetection}
                    plantId={activePlant}
                    disease={!mqttIsConnected ? (plantData?.disease ?? 'Unknown') : 'Unknown'}
                    diseaseType={!mqttIsConnected ? (plantData?.disease_type ?? null) : null}
                    timestamp={displayTimestamp}
                    source={mqttIsConnected ? 'mqtt' : source}
                  />
                )}
              </div>
              {/* ESP Sensor Readings — 5 across below DiseaseDetection */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-amber-400 rounded-full"></div>
                  <span className="text-[10px] font-black text-slate-300 tracking-[0.15em] uppercase">
                    ESP32 Sensor Readings
                    {mqttIsConnected && (
                      <span className={`ml-2 text-[7px] font-bold uppercase tracking-widest rounded-full px-1.5 py-0.5 ${hasMqttSensors
                          ? 'text-emerald-400/60 bg-emerald-500/10 border border-emerald-500/20'
                          : 'text-amber-400/60 bg-amber-500/10 border border-amber-500/20'
                        }`}>
                        {hasMqttSensors ? 'HiveMQ Cloud' : 'WAITING'}
                      </span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <EspReadings
                    key={`temp-${plantSwapKey}`}
                    title="Temperature"
                    value={displayTemp}
                    unit="°C"
                    icon="🌡️"
                    tone="amber"
                    meterMax={50}
                    type="temperature"
                    mqttSource={mqttIsConnected && hasMqttSensors}
                  />
                  <EspReadings
                    key={`hum-${plantSwapKey}`}
                    title="Humidity"
                    value={displayHum}
                    unit="%"
                    icon="💧"
                    tone="sky"
                    meterMax={100}
                    type="humidity"
                    mqttSource={mqttIsConnected && hasMqttSensors}
                  />
                  <EspReadings
                    key={`soil-${plantSwapKey}`}
                    title="Soil Moisture"
                    value={displaySoil}
                    unit="%"
                    icon="🪴"
                    tone="emerald"
                    meterMax={100}
                    type="soil"
                    mqttSource={mqttIsConnected && hasMqttSensors}
                  />
                  <EspReadings
                    key={`waterh-${plantSwapKey}`}
                    title="Water Level (Plant 1–3)"
                    value={displayWaterGroup1}
                    unit="%"
                    icon="🚰"
                    tone="violet"
                    meterMax={100}
                    type="water"
                    mqttSource={mqttIsConnected && hasMqttSensors}
                  />
                  <EspReadings
                    key={`waterd-${plantSwapKey}`}
                    title="Water Level (Plant 4–6)"
                    value={displayWaterGroup2}
                    unit="%"
                    icon="🚰"
                    tone="sky"
                    meterMax={100}
                    type="water"
                    mqttSource={mqttIsConnected && hasMqttSensors}
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

            <div className="lg:col-span-4 lg:row-start-5 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-emerald-400 rounded-full"></div>
                <span className="text-[10px] font-black text-slate-300 tracking-[0.15em] uppercase">Activity Logs</span>
              </div>
              <Activitylog logs={logs} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
