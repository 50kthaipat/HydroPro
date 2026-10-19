export interface SystemStatusDto {
  pump_running: boolean;
  pump_fault: boolean;
  valve_open: boolean;
  valve_closed: boolean;
  high_level_alarm: boolean;
  low_level_alarm: boolean;
  auto_mode: boolean;
  emergency_stop: boolean;
}

export interface TelemetryFrame {
  seq: number;
  timestamp_ms: number;
  flow_rate: number;
  pressure: number;
  tank_level: number;
  flow_setpoint: number;
  pressure_setpoint: number;
  total_flow: number;
  heartbeat: number;
  status: SystemStatusDto;
}

export type ClientCommand =
  | { type: 'setpoint'; command_id: string; timestamp_ms: number; target: 'flow_rate' | 'pressure'; value: number }
  | { type: 'action'; command_id: string; timestamp_ms: number; action: string }
  | { type: 'mode'; command_id: string; timestamp_ms: number; auto_mode: boolean };
