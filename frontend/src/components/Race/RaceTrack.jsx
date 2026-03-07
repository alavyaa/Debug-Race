import React, { useRef, useEffect } from 'react';
import { PLAYER_COLORS } from '../../utils/constants';

function getTrackPoint(angle, cx, cy, rx, ry) {
  return {
    x: cx + rx * Math.cos(angle),
    y: cy + ry * Math.sin(angle),
  };
}

export default function RaceTrack({ players = [], currentUserId }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const cx = W / 2;
    const cy = H / 2;
    const rx = W * 0.38;
    const ry = H * 0.36;
    const trackWidth = 48;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Draw outer track border (green glow)
    ctx.save();
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + trackWidth / 2 + 4, ry + trackWidth / 2 + 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw inner track border (green glow)
    ctx.save();
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx - trackWidth / 2 - 4, ry - trackWidth / 2 - 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Draw track surface
    ctx.save();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = trackWidth;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Fill inner void with page background color
    ctx.save();
    ctx.fillStyle = '#0d1117';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx - trackWidth / 2 - 4, ry - trackWidth / 2 - 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw dashed center lane line
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([18, 14]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Start/finish line at bottom of track (angle = Math.PI/2)
    const sfAngle = Math.PI / 2;
    const sfPt = getTrackPoint(sfAngle, cx, cy, rx, ry);
    ctx.save();
    ctx.translate(sfPt.x, sfPt.y);
    ctx.rotate(sfAngle + Math.PI / 2);
    const sqSize = 7;
    const cols = 4;
    const rows = 2;
    const totalW = cols * sqSize;
    const totalH = rows * sqSize;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(-totalW / 2 + c * sqSize, -totalH / 2 + r * sqSize, sqSize, sqSize);
      }
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-totalW / 2, -totalH / 2, totalW, totalH);
    ctx.restore();

    // Draw players as dots
    players.forEach((player, idx) => {
      const color = player.color || PLAYER_COLORS[idx % PLAYER_COLORS.length];
      const isMe = player.playerId === currentUserId || player.userId === currentUserId;

      // position 0→1 maps to angle 0→2π, starting at bottom (π/2) going clockwise
      const startAngle = Math.PI / 2;
      const angle = startAngle + (player.position || 0) * Math.PI * 2;
      const pt = getTrackPoint(angle, cx, cy, rx, ry);

      const radius = isMe ? 16 : 12;

      // Glow for current user
      if (isMe) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = color + '44';
        ctx.fill();
        ctx.restore();
      }

      // Car circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isMe ? 2.5 : 1.5;
      ctx.stroke();
      ctx.restore();

      // Initials / number inside dot
      const label = player.username
        ? player.username.slice(0, 2).toUpperCase()
        : String(idx + 1);
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${isMe ? 10 : 8}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, pt.x, pt.y);
      ctx.restore();

      // Username label near dot
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = `bold 11px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(
        (player.username || `P${idx + 1}`) + (isMe ? ' ★' : ''),
        pt.x,
        pt.y - radius - 3,
      );
      ctx.restore();
    });
  }, [players, currentUserId]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117' }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={420}
        style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
      />
    </div>
  );
}
