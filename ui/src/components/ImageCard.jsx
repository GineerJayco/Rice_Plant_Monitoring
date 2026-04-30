import React from 'react';

/**
 * ImageCard Component
 * Large bento card for the rotating camera feed.
 */
const ImageCard = ({ imageUrl, activePlant = 1, plantName = '', isLoading = false, source = 'api' }) => {
  const subtitle = plantName ? `Setup ${activePlant} • ${plantName}` : `Setup ${activePlant}`;

  return (
    <div className="relative h-full min-h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-gray-950/40 backdrop-blur-md shadow-2xl shadow-emerald-500/10 flex flex-col">
      {/* Header overlay */}
      <div className="absolute inset-x-0 top-0 z-20 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Currently Monitoring</p>
            <h2 className="mt-2 text-2xl font-extrabold text-white">{subtitle}</h2>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-300">{source === 'mock' ? 'DEMO' : 'LIVE'}</span>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="relative flex-1 min-h-0 w-full bg-black/40">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="h-14 w-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 border-r-emerald-400 animate-spin" />
            <p className="text-sm font-medium text-gray-400">Loading camera feed…</p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={`Setup ${activePlant} camera feed`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
            onError={(e) => {
              e.currentTarget.src = `/images/plant${activePlant}.svg`;
            }}
            loading="eager"
          />
        )}

        {/* Gradient for readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-950/30" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-6 py-4">
        <div className="text-xs text-gray-400">
          Camera rotates across <span className="text-emerald-300 font-semibold">6 setups</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
          <span>Auto-updates</span>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
