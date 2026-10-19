import React, { useState } from 'react';
import { TelemetryFrame } from '../types/scada';
import { scadaWs } from '../services/websocket';

export const AlarmBanner: React.FC<{ telemetry: TelemetryFrame | null }> = ({ telemetry }) => {
  const [ack, setAck] = useState(false);
  if (!telemetry) return null;

  const isHighPressure = telemetry.pressure > 8.0;
  const isLowLevel = telemetry.tank_level < 10.0;
  const isEStop = telemetry.status.emergency_stop;
  const hasAlarm = isHighPressure || isLowLevel || isEStop;

  if (!hasAlarm) {
    return (
      <div className="mb-4 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400">
        <span>STATUS: NORMAL - ISA-18.2 ACTIVE</span>
        <span>HEARTBEAT: {telemetry.heartbeat}</span>
      </div>
    );
  }

  return (
    <div className={`mb-4 flex items-center justify-between px-4 py-2 text-white shadow-lg ${ack ? 'bg-rose-900' : 'animate-pulse bg-rose-600'}`}>
      <span className="font-bold text-xs">
        {isHighPressure && 'HIGH PRESSURE (> 8.0 BAR) | '}
        {isLowLevel && 'LOW TANK LEVEL (< 10%) | '}
        {isEStop && 'EMERGENCY STOP'}
      </span>
      <button onClick={() => setAck(true)} className="rounded bg-white px-3 py-1 text-xs font-bold text-rose-950">
        {ack ? 'ACKNOWLEDGED' : 'ACKNOWLEDGE'}
      </button>
    </div>
  );
};
