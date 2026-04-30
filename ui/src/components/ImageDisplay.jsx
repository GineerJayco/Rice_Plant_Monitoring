import React from 'react';

/**
 * ImageDisplay Component
 * Displays live camera feed from Raspberry Pi with dark theme
 * @param {string} imageUrl - URL to the plant image
 * @param {boolean} isLoading - Whether image is loading
 * @param {string} timestamp - Timestamp of the image
 * @param {number} plantId - Active plant ID
 * @param {string} plantName - Name of the plant
 */
const ImageDisplay = ({ imageUrl, isLoading = false, timestamp = '', plantId = 1, plantName = 'Setup' }) => {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 h-full min-h-[400px] flex flex-col">
      {/* Header with plant info */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-gray-900 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Currently Monitoring</h3>
            <p className="text-emerald-400 font-semibold">Setup {plantId} - {plantName}</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/50 px-3 py-2 rounded-lg">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-emerald-300 text-xs font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {/* Image Container */}
      <div className="relative flex-1 w-full bg-gray-950 overflow-hidden flex items-center justify-center group">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium">Loading camera feed...</p>
          </div>
        ) : (
          <>
            <img
              src={imageUrl}
              alt={`${plantName} Camera Feed`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/600x400?text=Camera+Feed+Unavailable';
              }}
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-30"></div>
          </>
        )}
      </div>

      {/* Timestamp Footer */}
      {timestamp && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-6 pt-12">
          <p className="text-gray-400 text-xs">
            Last captured: <span className="text-emerald-400 font-semibold">{timestamp}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
