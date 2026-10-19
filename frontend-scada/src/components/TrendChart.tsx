import React, { useEffect, useRef } from 'react';
import { TelemetryFrame } from '../types/scada';

const CAPACITY = 1200;

export const TrendChart: React.FC<{ telemetry: TelemetryFrame | null }> = ({ telemetry }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flowBuf = useRef(new Float32Array(CAPACITY));
  const writeIdx = useRef(0);
  const total = useRef(0);

  useEffect(() => {
    if (!telemetry) return;
    flowBuf.current[writeIdx.current] = telemetry.flow_rate;
    writeIdx.current = (writeIdx.current + 1) % CAPACITY;
    if (total.current < CAPACITY) total.current++;
  }, [telemetry]);

  useEffect(() => {
    let id: number;
    const draw = () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, c.width, c.height);

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const count = total.current;
      const start = (writeIdx.current - count + CAPACITY) % CAPACITY;
      for (let i = 0; i < count; i++) {
        const v = flowBuf.current[(start + i) % CAPACITY];
        const x = (i / (CAPACITY - 1)) * c.width;
        const y = c.height - (v / 120.0) * (c.height - 20) - 10;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      id = requestAnimationFrame(draw);
    };
    id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl">
      <div className="mb-2 text-xs font-bold text-slate-400">REAL-TIME FLOW TREND (60s ROLLING WINDOW)</div>
      <canvas ref={canvasRef} width={800} height={180} className="w-full rounded border border-slate-800" />
    </div>
  );
};
