use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct StatusPayload {
    pub pump_running: bool,
    pub pump_fault: bool,
    pub valve_open: bool,
    pub valve_closed: bool,
    pub high_level_alarm: bool,
    pub low_level_alarm: bool,
    pub auto_mode: bool,
    pub emergency_stop: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TelemetryFrame {
    pub seq: u64,
    pub timestamp_ms: u64,
    pub flow_rate: f32,
    pub pressure: f32,
    pub tank_level: f32,
    pub flow_setpoint: f32,
    pub pressure_setpoint: f32,
    pub total_flow: f32,
    pub heartbeat: u16,
    pub status: StatusPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClientCommand {
    Setpoint { command_id: String, timestamp_ms: u64, target: String, value: f32 },
    Action { command_id: String, timestamp_ms: u64, action: String },
    Mode { command_id: String, timestamp_ms: u64, auto_mode: bool },
}
