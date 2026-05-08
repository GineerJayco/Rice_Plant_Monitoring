import React, { useMemo } from 'react';

/**
 * CameraView Component
 * Displays the latest captured image for the active plant.
 *
 * Modes:
 *   - Disconnected (mock): Shows mock image/SVG
 *   - Connected + waiting: Shows loading animation (waiting for MQTT image)
 *   - Connected + received: Shows base64 JPEG from MQTT
 *
 * Props:
 *   mqttConnected  — whether MQTT broker is connected
 *   base64Image    — base64-encoded JPEG from MQTT (null if not received yet)
 *   imageUrl       — URL string (fallback for mock/API)
 *   plantImages    — { [plantId]: base64String } all plant images for thumbnails
 */
const CameraView = ({
  imageUrl,
  base64Image = null,
  mqttConnected = false,
  activePlant = 1,
  plantName = '',
  plants = [],
  plantImages = {},
  onPlantSelect,
  isLoading = false,
  source = 'api',
  timestamp = '',
}) => {
  const subtitle = `Plant ${activePlant}`;

  // When MQTT connected but no image yet → show waiting state
  const isWaitingForMqttImage = mqttConnected && !base64Image;

  // Determine which image to show
  const displaySrc = useMemo(() => {
    if (base64Image) {
      return `data:image/jpeg;base64,${base64Image}`;
    }
    if (mqttConnected) {
      return null; // No image to show — will render waiting state
    }
    return imageUrl || `/images/plant${activePlant}.svg`;
  }, [base64Image, mqttConnected, imageUrl, activePlant]);

  // Status label
  const statusLabel = base64Image ? 'MQTT' : mqttConnected ? 'WAITING' : source === 'mock' ? 'DEMO' : 'LIVE';
  const statusDotColor = base64Image ? 'bg-emerald-400' : mqttConnected ? 'bg-amber-400' : source === 'mock' ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <div className="relative h-full min-h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-gray-950/40 backdrop-blur-md shadow-2xl shadow-emerald-500/10">
      <div className="absolute inset-x-0 top-0 z-20 p-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-widest text-gray-300">Monitoring</p>
            <h2 className="mt-1 text-sm font-extrabold text-white">{subtitle}</h2>
          </div>

          <div className={`flex items-center gap-1.5 rounded-full border px-2 py-1 ${base64Image
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : mqttConnected
                ? 'border-amber-500/30 bg-amber-500/10'
                : 'border-emerald-500/30 bg-emerald-500/10'
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusDotColor} animate-pulse`} />
            <span className={`text-[8px] font-semibold ${base64Image ? 'text-emerald-300' : mqttConnected ? 'text-amber-300' : 'text-emerald-300'
              }`}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="h-full w-full bg-black/40 relative flex items-center justify-center group">
        {isLoading || isWaitingForMqttImage ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950/60">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-lg">📷</div>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-sm font-semibold">
                {mqttConnected ? 'Waiting for image capture...' : 'Loading camera feed...'}
              </p>
              {mqttConnected && (
                <p className="text-gray-500 text-[10px] mt-1">
                  Images arrive every ~60 seconds per plant
                </p>
              )}
            </div>
            {/* Pulsing skeleton bars */}
            <div className="flex flex-col gap-1.5 w-48 mt-2">
              <div className="h-1.5 bg-emerald-500/10 rounded-full animate-pulse" />
              <div className="h-1.5 bg-emerald-500/8 rounded-full animate-pulse w-3/4" style={{ animationDelay: '0.2s' }} />
              <div className="h-1.5 bg-emerald-500/5 rounded-full animate-pulse w-1/2" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        ) : displaySrc ? (
          <img
            src={displaySrc}
            alt={`Plant ${activePlant} captured image`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(e) => {
              e.currentTarget.src = `/images/plant${activePlant}.svg`;
            }}
            loading="eager"
          />
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute bottom-0 inset-x-0 z-20 p-3 flex items-center justify-between gap-3">
          <div className="text-[8px] text-gray-300 font-medium">
            Plant <span className="text-emerald-300">{activePlant}</span> selected
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[8px] text-gray-300">
            <span className={`h-1.5 w-1.5 rounded-full ${base64Image ? 'bg-emerald-400/80' : mqttConnected ? 'bg-amber-400/80' : 'bg-slate-400/80'}`} />
            <span>{base64Image ? 'Periodic Capture' : mqttConnected ? 'Awaiting Image' : 'Mock Feed'}</span>
          </div>
        </div>
      </div>

      {timestamp && !isWaitingForMqttImage ? (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-gray-900 to-transparent p-6 pt-12">
          <p className="text-gray-400 text-xs">
            Last captured: <span className="text-emerald-400 font-semibold">{timestamp}</span>
          </p>
        </div>
      ) : null}

      <div className="border-t border-white/10 bg-gray-950/70 p-3">
        <p className="mb-2 text-[8px] uppercase tracking-widest text-slate-400">
          All plants - click to view
        </p>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }, (_, i) => i + 1).map((plantNumber) => {
            const plantData = plants.find((plant) => plant.active_plant === plantNumber);
            const mqttThumbImage = plantImages[plantNumber];
            const isActive = activePlant === plantNumber;

            // When MQTT connected: use MQTT image or show waiting skeleton
            // When disconnected: use mock image
            const thumbHasMqttImage = mqttConnected && mqttThumbImage;
            const thumbIsWaiting = mqttConnected && !mqttThumbImage;
            const thumbSrc = thumbHasMqttImage
              ? `data:image/jpeg;base64,${mqttThumbImage}`
              : (!mqttConnected ? (plantData?.image_url || `/images/plant${plantNumber}.svg`) : null);

            return (
              <button
                type="button"
                key={plantNumber}
                onClick={() => onPlantSelect?.(plantNumber)}
                className={`overflow-hidden rounded-lg border text-left transition ${isActive
                    ? 'border-emerald-400/70'
                    : 'border-white/10 hover:border-sky-400/60'
                  }`}
              >
                {thumbIsWaiting ? (
                  <div className="h-20 w-full bg-gray-900/80 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-5 w-5 rounded-full border border-emerald-500/20 border-t-emerald-400 animate-spin" />
                      <span className="text-[7px] text-gray-500">Waiting...</span>
                    </div>
                  </div>
                ) : (
                  <img
                    src={thumbSrc}
                    alt={`Plant ${plantNumber}`}
                    className="h-20 w-full object-cover bg-gray-950"
                    onError={(e) => {
                      e.currentTarget.src = `/images/plant${plantNumber}.svg`;
                    }}
                    loading="lazy"
                  />
                )}
                <div className={`px-1.5 py-1 text-center text-[9px] font-semibold ${isActive ? 'text-emerald-300' : 'text-slate-400'
                  }`}>
                  Plant {plantNumber}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CameraView;
