import { ClientCommand, TelemetryFrame } from '../types/scada';

export class ScadaWebSocketService {
  private socket: WebSocket | null = null;
  private url = 'ws://localhost:8080/ws/telemetry';
  private telemetrySubs = new Set<(f: TelemetryFrame) => void>();
  private connSubs = new Set<(c: boolean) => void>();

  public connect() {
    try {
      this.socket = new WebSocket(this.url);
      this.socket.onopen = () => this.connSubs.forEach(cb => cb(true));
      this.socket.onmessage = (e) => {
        try { const f: TelemetryFrame = JSON.parse(e.data); this.telemetrySubs.forEach(cb => cb(f)); } catch {}
      };
      this.socket.onclose = () => {
        this.connSubs.forEach(cb => cb(false));
        setTimeout(() => this.connect(), 2000);
      };
    } catch {
      setTimeout(() => this.connect(), 2000);
    }
  }

  public sendCommand(cmd: ClientCommand) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(cmd));
    }
  }

  public subscribeTelemetry(cb: (f: TelemetryFrame) => void) {
    this.telemetrySubs.add(cb);
    return () => this.telemetrySubs.delete(cb);
  }

  public subscribeConnection(cb: (c: boolean) => void) {
    this.connSubs.add(cb);
    return () => this.connSubs.delete(cb);
  }
}

export const scadaWs = new ScadaWebSocketService();
