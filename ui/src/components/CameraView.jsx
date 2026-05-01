import React from 'react';

/**
 * CameraView Component
 * Merged camera view card from ImageCard and ImageDisplay.
 */
const CameraView = ({
  imageUrl,
  activePlant = 1,
  plantName = '',
  plants = [],
  onPlantSelect,
  isLoading = false,
  source = 'api',
  timestamp = '',
}) => {
  const subtitle = plantName ? `Plant ${activePlant} - ${plantName}` : `Plant ${activePlant}`;

  return (
    <div className="relative h-full min-h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-gray-950/40 backdrop-blur-md shadow-2xl shadow-emerald-500/10">
      <div className="absolute inset-x-0 top-0 z-20 p-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-widest text-gray-300">Monitoring</p>
            <h2 className="mt-1 text-sm font-extrabold text-white">{subtitle}</h2>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[8px] font-semibold text-emerald-300">{source === 'mock' ? 'DEMO' : 'LIVE'}</span>
          </div>
        </div>
      </div>

      <div className="h-full w-full bg-black/40 relative flex items-center justify-center group">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <p className="text-gray-400 text-sm">Loading camera feed...</p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={`Setup ${activePlant} camera feed`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(e) => {
              e.currentTarget.src = `/images/plant${activePlant}.svg`;
            }}
            loading="eager"
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute bottom-0 inset-x-0 z-20 p-3 flex items-center justify-between gap-3">
          <div className="text-[8px] text-gray-300 font-medium">
            Plant <span className="text-emerald-300">{activePlant}</span> selected
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[8px] text-gray-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            <span>Live Feed</span>
          </div>
        </div>
      </div>

      {timestamp ? (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-gray-900 to-transparent p-6 pt-12">
          <p className="text-gray-400 text-xs">
            Last captured: <span className="text-emerald-400 font-semibold">{timestamp}</span>
          </p>
        </div>
      ) : null}

      <div className="border-t border-white/10 bg-gray-950/70 p-3">
        <p className="mb-2 text-[8px] uppercase tracking-widest text-slate-400">
          All plants - click to enlarge
        </p>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }, (_, i) => i + 1).map((plantNumber) => {
            const plantData = plants.find((plant) => plant.active_plant === plantNumber);
            const thumbSrc = plantData?.image_url || `/images/plant${plantNumber}.svg`;
            const isActive = activePlant === plantNumber;

            return (
              <button
                type="button"
                key={plantNumber}
                onClick={() => onPlantSelect?.(plantNumber)}
                className={`overflow-hidden rounded-lg border text-left transition ${
                  isActive
                    ? 'border-emerald-400/70'
                    : 'border-white/10 hover:border-sky-400/60'
                }`}
              >
                <img
                  src={thumbSrc}
                  alt={`Plant ${plantNumber}`}
                  className="h-20 w-full object-cover bg-gray-950"
                  onError={(e) => {
                    e.currentTarget.src = `/images/plant${plantNumber}.svg`;
                  }}
                  loading="lazy"
                />
                <div className={`px-1.5 py-1 text-center text-[9px] font-semibold ${
                  isActive ? 'text-emerald-300' : 'text-slate-400'
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
