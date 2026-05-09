import React from 'react';

/**
 * PlantStrip Component
 * A horizontal selector for 6 plants with status indicators and thumbnails.
 */
const PlantStrip = ({
  plants = [],
  activePlant = 1,
  plantDetections = {},
  plantImages = {},
  onPlantSelect,
  mqttIsConnected = false,
}) => {
  return (
    <div className="flex gap-2 mb-3 overflow-x-auto pb-1 custom-scrollbar">
      {[1, 2, 3, 4, 5, 6].map((num) => {
        const p = plants.find((pl) => pl.active_plant === num);
        const isActive = activePlant === num;
        
        // Use MQTT detection to determine disease status if available
        const mqttDet = plantDetections[num];
        const mqttThumb = plantImages[num];
        const isDisease = mqttDet
          ? (mqttDet.sheath_blight ?? 0) > 0
          : String(p?.disease).toLowerCase() === 'positive';

        // Thumbnail logic: MQTT image > mock image > SVG fallback
        const thumbIsWaiting = mqttIsConnected && !mqttThumb;
        const thumbSrc = mqttThumb
          ? `data:image/jpeg;base64,${mqttThumb}`
          : (!mqttIsConnected ? (p?.image_url || `/images/plant${num}.svg`) : null);

        return (
          <button
            key={num}
            type="button"
            onClick={() => onPlantSelect?.(num)}
            className={`relative flex-shrink-0 w-[calc(16.666%-6px)] min-w-[100px] rounded-xl overflow-hidden border-2 transition-all duration-200 group ${
              isActive
                ? 'border-emerald-400 shadow-lg shadow-emerald-500/30 scale-[1.03]'
                : 'border-white/10 hover:border-sky-400/50 hover:scale-[1.02]'
            }`}
          >
            {thumbIsWaiting ? (
              <div className="w-full h-20 bg-gray-900/80 flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-5 w-5 rounded-full border border-emerald-500/20 border-t-emerald-400 animate-spin" />
                  <span className="text-[7px] text-gray-500">Waiting...</span>
                </div>
              </div>
            ) : (
              <img
                src={thumbSrc}
                alt={`Plant ${num}`}
                className="w-full h-20 object-cover bg-gray-950"
                onError={(e) => {
                  e.currentTarget.src = `/images/plant${num}.svg`;
                }}
              />
            )}
            
            {/* Disease status dot */}
            {(p || mqttDet) && !thumbIsWaiting && (
              <span
                className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                  isDisease ? 'bg-red-400' : 'bg-emerald-400'
                }`}
              />
            )}
            
            <div
              className={`absolute bottom-0 inset-x-0 py-1 text-center text-[9px] font-bold uppercase tracking-wider ${
                isActive
                  ? 'bg-emerald-500/80 text-white'
                  : 'bg-gray-950/70 text-slate-400 group-hover:text-white'
              }`}
            >
              Plant {num}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default PlantStrip;
