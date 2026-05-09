import React from 'react';

/**
 * VerticalTank Component
 * A premium water level indicator with realistic liquid wave animation.
 */
const VerticalTank = ({ 
  value = 0, 
  max = 100, 
  unit = '', 
  tone = 'violet',
  size = 110 
}) => {
  const isNumeric = Number.isFinite(Number(value));
  const numValue = isNumeric ? Number(value) : 0;
  const percentage = Math.max(0, Math.min(100, (numValue / max) * 100));

  const tones = {
    emerald: { 
      base: 'from-emerald-600 to-emerald-400', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/40' 
    },
    sky: { 
      base: 'from-sky-600 to-sky-400', 
      bg: 'bg-sky-500/10', 
      border: 'border-sky-500/30',
      glow: 'shadow-sky-500/40' 
    },
    amber: { 
      base: 'from-amber-600 to-amber-400', 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/30',
      glow: 'shadow-amber-500/40' 
    },
    violet: { 
      base: 'from-violet-600 to-violet-400', 
      bg: 'bg-violet-500/10', 
      border: 'border-violet-500/30',
      glow: 'shadow-violet-500/40' 
    },
  };

  const t = tones[tone] || tones.violet;

  return (
    <div className="flex flex-col items-center gap-3 group" style={{ width: size }}>
      {/* Tank Assembly */}
      <div className="relative flex items-center justify-center">
        {/* Outer Glass Container */}
        <div className={`relative w-10 h-24 rounded-2xl border-2 ${t.border} ${t.bg} backdrop-blur-sm overflow-hidden flex items-end p-0.5 shadow-2xl`}>
          
          {/* Liquid Container */}
          <div 
            className={`relative w-full bg-gradient-to-t ${t.base} transition-all duration-1000 ease-in-out rounded-xl`}
            style={{ height: `${percentage}%` }}
          >
            {/* Animated Wave at the Surface */}
            {percentage > 0 && (
              <div className="absolute -top-[10px] left-0 right-0 h-4 overflow-visible">
                <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-[200%] h-full animate-wave">
                  <path 
                    d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10" 
                    fill="currentColor" 
                    className="text-white/20"
                  />
                  <path 
                    d="M0 10 Q25 20 50 10 T100 10 T150 10 T200 10" 
                    fill="inherit" 
                    opacity="0.6"
                  />
                </svg>
              </div>
            )}

            {/* Internal Glow/Shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/10" />
            
            {/* Bubbles */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col gap-4 opacity-40">
              <div className="w-1 h-1 rounded-full bg-white animate-bubble-up" style={{ animationDelay: '0s' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-bubble-up" style={{ animationDelay: '0.7s' }} />
            </div>
          </div>

          {/* Measuring Marks */}
          <div className="absolute inset-y-2 left-1.5 flex flex-col justify-between py-1 opacity-20 pointer-events-none">
            <div className="w-2 h-[1px] bg-white" />
            <div className="w-1 h-[1px] bg-white" />
            <div className="w-2 h-[1px] bg-white" />
            <div className="w-1 h-[1px] bg-white" />
            <div className="w-2 h-[1px] bg-white" />
          </div>
        </div>

        {/* Refractive Highlight */}
        <div className="absolute top-0 left-2 right-2 h-full bg-gradient-to-r from-white/10 to-transparent pointer-events-none rounded-2xl" />
      </div>

      {/* Value Readout */}
      <div className="flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-white tracking-tighter transition-all duration-500 group-hover:scale-110">
            {isNumeric ? Math.round(percentage) : '—'}
          </span>
          <span className="text-[10px] font-black text-gray-500 uppercase">%</span>
        </div>
        <span className="text-[7px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">Water Level</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-wave {
          animation: wave 3s linear infinite;
        }
        @keyframes bubble-up {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(-40px) scale(1.2); opacity: 0; }
        }
        .animate-bubble-up {
          animation: bubble-up 4s ease-in infinite;
        }
      `}} />
    </div>
  );
};

export default VerticalTank;

