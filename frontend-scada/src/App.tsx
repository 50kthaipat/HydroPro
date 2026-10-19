import React, { useEffect, useState } from 'react';
import { TelemetryFrame } from './types/scada';
import { scadaWs } from './services/websocket';
import { PidDiagram } from './components/PidDiagram';

export const App: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryFrame | null>(null);

  useEffect(() => {
    scadaWs.connect();
    return scadaWs.subscribeTelemetry(setTelemetry);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-wider text-sky-400">HYDROFLOW SCADA DASHBOARD</h1>
        <div className="text-xs text-slate-400">STATUS: CONNECTED</div>
      </header>
      <main className="mx-auto max-w-6xl">
        <PidDiagram telemetry={telemetry} onOpenPump={() => {}} onOpenValve={() => {}} />
      </main>
    </div>
  );
};

export default App;
