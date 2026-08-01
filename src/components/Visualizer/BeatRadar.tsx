import React, { useEffect, useRef } from 'react';
import { Disc3, Zap } from 'lucide-react';
import { useStudioStore } from '../../store/useStudioStore';

export const BeatRadar: React.FC = () => {
  const { isPlaying, stems, bpm } = useStudioStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 15;

      ctx.clearRect(0, 0, width, height);

      // Radar Grid Concentric Circles
      const rings = [0.3, 0.6, 0.85, 1.0];
      rings.forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(39, 39, 42, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Axis lines
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.strokeStyle = 'rgba(39, 39, 42, 0.4)';
      ctx.stroke();

      if (isPlaying) {
        // Rotating radar sweep line
        angle += 0.02 * (bpm / 120);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle - 0.2, angle);
        ctx.closePath();

        const grad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius);
        grad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
        grad.addColorStop(1, 'rgba(99, 102, 241, 0.05)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Render Active Stem Hap Orbits
        const activeStems = stems.filter((s) => !s.muted);
        const stemCount = activeStems.length;

        activeStems.forEach((stem, index) => {
          const stemAngle = (index / (stemCount || 1)) * Math.PI * 2 + angle * 0.5;
          const stemRadius = radius * (0.3 + (index % 3) * 0.25);
          const px = centerX + Math.cos(stemAngle) * stemRadius;
          const py = centerY + Math.sin(stemAngle) * stemRadius;

          const colorMap: Record<string, string> = {
            drums: '#f43f5e',
            bass: '#f59e0b',
            lead: '#06b6d4',
            pad: '#6366f1',
            fx: '#10b981',
          };

          const color = colorMap[stem.category] || '#06b6d4';

          // Pulse node
          ctx.beginPath();
          ctx.arc(px, py, 6 + Math.sin(angle * 4 + index) * 3, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Pulse ring
          ctx.beginPath();
          ctx.arc(px, py, 12 + Math.sin(angle * 4 + index) * 4, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      } else {
        // Idle state graphic
        ctx.font = '11px monospace';
        ctx.fillStyle = 'rgba(113, 113, 122, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText('RADAR STANDBY', centerX, centerY + 4);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, stems, bpm]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl shadow-xl backdrop-blur-lg">
      <div className="flex items-center justify-between w-full pb-2 border-b border-zinc-800/80 mb-2">
        <div className="flex items-center gap-2">
          <Disc3 size={16} className={`text-cyan-400 ${isPlaying ? 'animate-spin' : ''}`} />
          <span className="font-bold text-xs text-zinc-200 uppercase font-mono tracking-wider">
            Beat Radar & Visual Arc
          </span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
          <Zap size={10} className={isPlaying ? 'text-amber-400' : 'text-zinc-600'} />
          {isPlaying ? 'ACTIVE SWEEP' : 'OFFLINE'}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={240}
        height={240}
        className="w-[240px] h-[240px] rounded-full bg-zinc-950/80 border border-zinc-800 shadow-inner"
      />
    </div>
  );
};
