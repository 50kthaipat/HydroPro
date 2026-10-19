use async_trait::async_trait;
use std::sync::Arc;
use thiserror::Error;
use tokio::sync::Mutex;
use crate::codec::{Db1Data, SystemStatus};
use crate::physics::{PhysicsConfig, TwoTankModel};

#[derive(Debug, Error, PartialEq, Eq)]
pub enum PlcError {
    #[error("connection failed: {0}")] Connection(String),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DiscreteAction { StartPump, StopPump, OpenValve, CloseValve, EmergencyStop, AcknowledgeAlarms }

#[derive(Debug, Clone, PartialEq)]
pub enum PlcCommand {
    SetFlowSetpoint(f32),
    SetPressureSetpoint(f32),
    ExecuteAction(DiscreteAction),
    SetAutoMode(bool),
}

#[async_trait]
pub trait PlcDriver: Send + Sync {
    async fn read_db1(&self) -> Result<Db1Data, PlcError>;
    async fn write_command(&self, command: PlcCommand) -> Result<(), PlcError>;
}

struct Inner {
    model: TwoTankModel,
    flow_sp: f32,
    press_sp: f32,
    auto_mode: bool,
    e_stop: bool,
    pump_running: bool,
    valve_open: bool,
    heartbeat: u16,
}

#[derive(Clone)]
pub struct MockDriver { inner: Arc<Mutex<Inner>> }

impl Default for MockDriver {
    fn default() -> Self {
        Self::new()
    }
}

impl MockDriver {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(Inner {
                model: TwoTankModel::new(PhysicsConfig::default()),
                flow_sp: 0.0,
                press_sp: 101.325,
                auto_mode: false,
                e_stop: false,
                pump_running: false,
                valve_open: false,
                heartbeat: 0,
            })),
        }
    }

    pub async fn step_simulation(&self, delta_s: f32) {
        let mut inner = self.inner.lock().await;
        let dt = 0.05;
        let steps = (delta_s / dt).ceil() as usize;
        for _ in 0..steps {
            inner.model.step(dt);
            inner.heartbeat = inner.heartbeat.wrapping_add(1);
        }
    }
}

#[async_trait]
impl PlcDriver for MockDriver {
    async fn read_db1(&self) -> Result<Db1Data, PlcError> {
        let inner = self.inner.lock().await;
        let st = inner.model.state();
        let lvl = (st.tank2_level / 5.0) * 100.0;
        Ok(Db1Data {
            flow_rate: st.discharge_flow_rate,
            pressure: st.tank2_pressure,
            tank_level: lvl,
            flow_setpoint: inner.flow_sp,
            pressure_setpoint: inner.press_sp,
            status: SystemStatus {
                pump_running: inner.pump_running,
                pump_fault: false,
                valve_open: inner.valve_open,
                valve_closed: !inner.valve_open,
                high_level_alarm: lvl > 90.0,
                low_level_alarm: lvl < 10.0,
                auto_mode: inner.auto_mode,
                emergency_stop: inner.e_stop,
            },
            total_flow: st.total_discharge_volume,
            heartbeat: inner.heartbeat,
        })
    }

    async fn write_command(&self, cmd: PlcCommand) -> Result<(), PlcError> {
        let mut inner = self.inner.lock().await;
        match cmd {
            PlcCommand::SetFlowSetpoint(sp) => inner.flow_sp = sp,
            PlcCommand::SetPressureSetpoint(sp) => inner.press_sp = sp,
            PlcCommand::SetAutoMode(m) => inner.auto_mode = m,
            PlcCommand::ExecuteAction(act) => match act {
                DiscreteAction::StartPump => { if !inner.e_stop { inner.pump_running = true; inner.model.set_pump_command(1.0); } }
                DiscreteAction::StopPump => { inner.pump_running = false; inner.model.set_pump_command(0.0); }
                DiscreteAction::OpenValve => { inner.valve_open = true; inner.model.set_valve_position(1.0); }
                DiscreteAction::CloseValve => { inner.valve_open = false; inner.model.set_valve_position(0.0); }
                DiscreteAction::EmergencyStop => { inner.e_stop = true; inner.pump_running = false; inner.model.set_pump_command(0.0); }
                DiscreteAction::AcknowledgeAlarms => { if inner.e_stop { inner.e_stop = false; } }
            },
        }
        Ok(())
    }
}
