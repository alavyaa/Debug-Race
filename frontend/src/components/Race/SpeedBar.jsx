import React from 'react';

export default function SpeedBar({ speed, nitro, shield }) {
  const speedPercent = Math.min((speed / 150) * 100, 100);
  const nitroPercent = Math.min(nitro || 0, 100);

  const getSpeedColor = () => {
    if (speed > 120) return 'from-red-500 to-orange-500';
    if (speed > 80) return 'from-neon-yellow to-orange-400';
    if (speed > 50) return 'from-neon-green to-neon-yellow';
    return 'from-neon-blue to-neon-green';
  };

  return (
    <div className="w-full bg-dark-200 border-t border-neon-blue/20 px-6 py-3 flex items-center gap-6">

      {/* Speed Number */}
      <div className="flex items-end gap-1 flex-shrink-0">
        <span className="font-racing text-5xl text-white leading-none">{Math.floor(speed)}</span>
        <span className="font-body text-sm text-gray-400 mb-1">km/h</span>
      </div>

      {/* Speed Bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-body text-xs text-gray-400 uppercase tracking-widest">Speed</span>
          <span className="font-racing text-xs text-neon-blue">{Math.floor(speedPercent)}%</span>
        </div>
        <div className="h-4 bg-dark-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getSpeedColor()} transition-all duration-300 rounded-full`}
            style={{ width: `${speedPercent}%` }}
          >
            <div className="h-full w-full bg-gradient-to-r from-white/20 to-transparent" />
          </div>
        </div>
      </div>

      {/* Nitro */}
      <div className="w-28 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-body text-xs text-neon-purple uppercase tracking-widest">Nitro</span>
          <span className="font-racing text-xs text-neon-purple">{Math.floor(nitroPercent)}%</span>
        </div>
        <div className="h-4 bg-dark-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon-purple to-neon-pink transition-all duration-300 rounded-full"
            style={{ width: `${nitroPercent}%` }}
          />
        </div>
      </div>

      {/* Power-up Indicators */}
      <div className="flex gap-2 flex-shrink-0">
        {nitro > 0 && (
          <div className="w-10 h-10 rounded-full bg-neon-purple/30 border-2 border-neon-purple flex items-center justify-center animate-pulse">
            <span className="text-lg">⚡</span>
          </div>
        )}
        {shield && (
          <div className="w-10 h-10 rounded-full bg-neon-blue/30 border-2 border-neon-blue flex items-center justify-center animate-pulse">
            <span className="text-lg">🛡️</span>
          </div>
        )}
      </div>

    </div>
  );
}