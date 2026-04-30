import React from 'react';

/**
 * ImageCard Component
 * Large bento card for the rotating camera feed.
 */
const ImageCard = ({ imageUrl, activePlant = 1, plantName = '', isLoading = false, source = 'api' }) => {
  const subtitle = plantName ? `Setup ${activePlant} • ${plantName}` : `Setup ${activePlant}`;

  return (
    <div className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-gray-950/40 backdrop-blur-md shadow-2xl shadow-emerald-500/10">
      {/* Header overlay */}
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

      {/* Image container */}
      <div className="h-full w-full bg-black/40 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={`Setup ${activePlant} camera feed`}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
            onError={(e) => {
              e.currentTarget.src = `/images/plant${activePlant}.svg`;
            }}
            loading="eager"
          />
        )}

        {/* Gradient for readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Footer Overlay */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-3 flex items-center justify-between gap-3">
          <div className="text-[8px] text-gray-300 font-medium">
            Setup <span className="text-emerald-300">1-6</span> Rotates
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[8px] text-gray-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            <span>Live Feed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
