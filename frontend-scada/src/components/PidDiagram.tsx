import React from 'react';
import { TelemetryFrame } from '../types/scada';

interface Props {
  telemetry: TelemetryFrame | null;
  onOpenPump: () => void;
  onOpenValve: () => void;
}

export const PidDiagram: React.FC<Props> = ({ telemetry, onOpenPump, onOpenValve }) => {
  const flow = telemetry?.flow_rate ?? 0.0;
  const tank2Level = Math.min(100, Math.max(0, telemetry?.tank_level ?? 25.0));
  const isFlowing = flow > 0.5;
  const animationDuration = isFlowing ? `${Math.max(0.2, 50.0 / flow)}s` : '0s';

  const pumpRunning = telemetry?.status.pump_running ?? false;
  const valveOpen = telemetry?.status.valve_open ?? false;
  const pumpColor = pumpRunning ? '#10b981' : '#64748b';
  const valveColor = valveOpen ? '#10b981' : '#64748b';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
      <div className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
        P&ID SCHEMATIC: TWO-TANK HYDRAULIC SYSTEM (ISA-101)
      </div>
      <svg viewBox="0 0 840 400" className="h-[380px] w-full select-none">
        <path d="M 170 280 L 260 280" fill="none" stroke="#1e293b" strokeWidth="8" />
        <path d="M 170 280 L 260 280" fill="none" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8 6" className="pipe-flow-animation" style={{ animationDuration, animationPlayState: isFlowing ? 'running' : 'paused' }} />

        <path d="M 320 280 L 390 280 L 390 130 L 510 130" fill="none" stroke="#1e293b" strokeWidth="8" />
        <path d="M 320 280 L 390 280 L 390 130 L 510 130" fill="none" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8 6" className="pipe-flow-animation" style={{ animationDuration, animationPlayState: isFlowing ? 'running' : 'paused' }} />

        <path d="M 610 280 L 750 280" fill="none" stroke="#1e293b" strokeWidth="8" />
        <path d="M 610 280 L 750 280" fill="none" stroke="#38bdf8" strokeWidth="4" strokeDasharray="8 6" className="pipe-flow-animation" style={{ animationDuration, animationPlayState: isFlowing && valveOpen ? 'running' : 'paused' }} />

        <rect x="70" y="150" width="100" height="170" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        <rect x="72" y={150 + 170 * 0.3} width="96" height={170 * 0.7} fill="#0284c7" opacity="0.85" />
        <text x="120" y="240" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle">TANK 1</text>

        <g onClick={onOpenPump} className="cursor-pointer">
          <circle cx="290" cy="280" r="30" fill="#0f172a" stroke={pumpColor} strokeWidth="4" />
          <polygon points="280,265 305,280 280,295" fill={pumpColor} />
          <text x="290" y="330" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="middle">PUMP 01</text>
        </g>

        <rect x="510" y="110" width="100" height="210" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        <rect x="512" y={110 + (210 * (100 - tank2Level)) / 100} width="96" height={(210 * tank2Level) / 100} fill="#0284c7" opacity="0.85" />
        <text x="560" y="210" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle">TANK 2</text>
        <text x="560" y="230" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">{tank2Level.toFixed(1)}%</text>

        <g onClick={onOpenValve} className="cursor-pointer">
          <polygon points="650,270 670,280 650,290" fill={valveColor} />
          <polygon points="690,270 670,280 690,290" fill={valveColor} />
          <text x="670" y="315" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="middle">XV-01</text>
        </g>

        <g transform="translate(335, 80)">
          <rect width="110" height="40" rx="4" fill="#020617" stroke="#334155" strokeWidth="1.5" />
          <text x="55" y="16" fill="#94a3b8" fontSize="9" textAnchor="middle">FLOW (m³/h)</text>
          <text x="55" y="32" fill="#38bdf8" fontSize="13" fontWeight="bold" textAnchor="middle">{flow.toFixed(1)}</text>
        </g>
      </svg>
    </div>
  );
};
