import React from 'react';
import { PLAYER_COLORS } from '../../utils/constants';

export default function Leaderboard({ positions, currentUserId }) {
  const sortedPositions = [...positions].sort((a, b) => {
    if (a.lap !== b.lap) return b.lap - a.lap;
    return b.position - a.position;
  });

  return (
    <div>
      <h3 className="font-racing text-lg text-neon-blue mb-3">🏆 Positions</h3>
      <div className="space-y-2">
        {sortedPositions.map((player, index) => {
          const isMe = player.playerId === currentUserId;
          const color = player.color || PLAYER_COLORS[index % PLAYER_COLORS.length];
          return (
            <div
              key={player.playerId}
              style={isMe ? { boxShadow: `0 0 8px ${color}88`, border: `1px solid ${color}` } : {}}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                isMe ? 'bg-neon-blue/10' : 'bg-dark-100'
              }`}
            >
              {/* Color dot */}
              <div
                style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                className="w-3 h-3 rounded-full flex-shrink-0"
              />

              {/* Position badge */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-racing text-sm flex-shrink-0 ${
                index === 0 ? 'bg-yellow-500 text-dark-100' :
                index === 1 ? 'bg-gray-400 text-dark-100' :
                index === 2 ? 'bg-orange-600 text-dark-100' :
                'bg-dark-200 text-gray-400'
              }`}>
                {index + 1}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <p className="font-body text-white text-sm truncate">
                  {player.username || `Player ${player.playerId?.slice(-4)}`}
                  {isMe && ' (You)'}
                </p>
                <p className="font-body text-xs text-gray-400">
                  Lap {player.lap} • {Math.floor(player.speed)} km/h
                </p>
              </div>

              {/* Speed Indicator */}
              <div className={`px-2 py-1 rounded text-xs font-racing flex-shrink-0 ${
                player.speed > 100 ? 'bg-red-500/20 text-red-400' :
                player.speed > 70 ? 'bg-neon-yellow/20 text-neon-yellow' :
                'bg-neon-blue/20 text-neon-blue'
              }`}>
                {Math.floor(player.speed)}
              </div>
            </div>
          );
        })}

        {positions.length === 0 && (
          <p className="text-gray-500 font-body text-sm text-center py-4">
            Waiting for race data...
          </p>
        )}
      </div>
    </div>
  );
}