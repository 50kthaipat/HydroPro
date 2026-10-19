import React, { useEffect, useState } from 'react';
import { TelemetryFrame } from './types/scada';
import { scadaWs } from './services/websocket';
import { PidDiagram } from './components/PidDiagram';
import { AlarmBanner } from './components/AlarmBanner';
import { TrendChart } from './components/TrendChart';

export const App: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryFrame | null>(null);
  const [activeModal, setActiveModal] = useState<'pump' | 'valve' | null>(null);
  const [pumpSpeed, setPumpSpeed] = useState(75);
  const [valvePos, setValvePos] = useState(50);

  useEffect(() => {
    scadaWs.connect();
    return scadaWs.subscribeTelemetry(setTelemetry);
  }, []);

  const handleStartPump = () => {
    scadaWs.sendCommand({
      type: 'action',
      command_id: `cmd-${Date.now()}`,
      timestamp_ms: Date.now(),
      action: 'start_pump',
    });
  };

  const handleStopPump = () => {
    scadaWs.sendCommand({
      type: 'action',
      command_id: `cmd-${Date.now()}`,
      timestamp_ms: Date.now(),
      action: 'stop_pump',
    });
  };

  const handleOpenValve = () => {
    scadaWs.sendCommand({
      type: 'action',
      command_id: `cmd-${Date.now()}`,
      timestamp_ms: Date.now(),
      action: 'open_valve',
    });
  };

  const handleCloseValve = () => {
    scadaWs.sendCommand({
      type: 'action',
      command_id: `cmd-${Date.now()}`,
      timestamp_ms: Date.now(),
      action: 'close_valve',
    });
  };

  const handlePumpSpeedChange = (val: number) => {
    setPumpSpeed(val);
    scadaWs.sendCommand({
      type: 'setpoint',
      command_id: `sp-${Date.now()}`,
      timestamp_ms: Date.now(),
      target: 'flow_rate',
      value: val,
    });
  };

  const handleValvePosChange = (val: number) => {
    setValvePos(val);
    scadaWs.sendCommand({
      type: 'setpoint',
      command_id: `sp-${Date.now()}`,
      timestamp_ms: Date.now(),
      target: 'pressure',
      value: val,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100 font-sans">
      <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-sky-400" data-testid="scada-title">HYDROFLOW SCADA DASHBOARD</h1>
          <p className="text-xs text-slate-400">ISA-101 Two-Tank Fluid & Pressure Twin</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-mono text-emerald-400" data-testid="connection-status">ONLINE (20Hz)</span>
        </div>
      </header>

      <AlarmBanner telemetry={telemetry} />

      <main className="mx-auto max-w-6xl space-y-6">
        <PidDiagram
          telemetry={telemetry}
          onOpenPump={() => setActiveModal('pump')}
          onOpenValve={() => setActiveModal('valve')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg" data-testid="faceplate-pump">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-sm font-bold tracking-wider text-slate-200">BOOSTER PUMP 01 (CR 3-10)</h2>
              <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${telemetry?.status.pump_running ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`} data-testid="pump-status">
                {telemetry?.status.pump_running ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>
            <div className="flex space-x-3 mb-4">
              <button
                onClick={handleStartPump}
                className="flex-1 py-2 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow"
                data-testid="btn-start-pump"
              >
                START PUMP
              </button>
              <button
                onClick={handleStopPump}
                className="flex-1 py-2 px-4 rounded bg-rose-700 hover:bg-rose-600 text-xs font-bold text-white transition shadow"
                data-testid="btn-stop-pump"
              >
                STOP PUMP
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>SPEED SETPOINT</span>
                <span data-testid="val-pump-speed">{pumpSpeed}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={pumpSpeed}
                onChange={(e) => handlePumpSpeedChange(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
                data-testid="slider-pump-speed"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg" data-testid="faceplate-valve">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-sm font-bold tracking-wider text-slate-200">INLET VALVE A (BÜRKERT 3361)</h2>
              <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${telemetry?.status.valve_open ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`} data-testid="valve-status">
                {telemetry?.status.valve_open ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <div className="flex space-x-3 mb-4">
              <button
                onClick={handleOpenValve}
                className="flex-1 py-2 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow"
                data-testid="btn-open-valve"
              >
                OPEN VALVE
              </button>
              <button
                onClick={handleCloseValve}
                className="flex-1 py-2 px-4 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition shadow"
                data-testid="btn-close-valve"
              >
                CLOSE VALVE
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>POSITION SETPOINT</span>
                <span data-testid="val-valve-pos">{valvePos}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={valvePos}
                onChange={(e) => handleValvePosChange(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
                data-testid="slider-valve-pos"
              />
            </div>
          </div>
        </div>

        <TrendChart telemetry={telemetry} />
      </main>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" data-testid="equipment-modal">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400">
                {activeModal === 'pump' ? 'Equipment Faceplate: Pump 01' : 'Equipment Faceplate: Valve A'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white font-bold" data-testid="btn-close-modal">✕</button>
            </div>
            <p className="text-xs text-slate-400 mb-4">ISA-101 Direct Modulation & Feedback</p>
            <div className="space-y-3">
              {activeModal === 'pump' ? (
                <>
                  <button onClick={handleStartPump} className="w-full py-2 bg-emerald-600 text-white rounded font-bold text-xs" data-testid="modal-btn-start">EXECUTE START</button>
                  <button onClick={handleStopPump} className="w-full py-2 bg-rose-600 text-white rounded font-bold text-xs" data-testid="modal-btn-stop">EXECUTE STOP</button>
                </>
              ) : (
                <>
                  <button onClick={handleOpenValve} className="w-full py-2 bg-emerald-600 text-white rounded font-bold text-xs" data-testid="modal-btn-open">MODULATE OPEN</button>
                  <button onClick={handleCloseValve} className="w-full py-2 bg-slate-700 text-white rounded font-bold text-xs" data-testid="modal-btn-close">MODULATE CLOSE</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
