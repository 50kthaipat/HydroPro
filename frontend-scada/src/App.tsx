import React, { useEffect, useState } from 'react';
import { TelemetryFrame } from './types/scada';
import { scadaWs } from './services/websocket';
import { PidDiagram } from './components/PidDiagram';
import { AlarmBanner } from './components/AlarmBanner';
import { TrendChart } from './components/TrendChart';

export const App: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryFrame | null>(null);

  useEffect(() => {
    scadaWs.connect();
    return scadaWs.subscribeTelemetry(setTelemetry);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <AlarmBanner telemetry={telemetry} />
      <main className="mx-auto max-w-6xl space-y-6">
        <PidDiagram telemetry={telemetry} onOpenPump={() => {}} onOpenValve={() => {}} />
        <TrendChart telemetry={telemetry} />
      </main>
    </div>
  );
};

export default App;
