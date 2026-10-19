use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::sync::broadcast;
use tokio::time::{interval, MissedTickBehavior};
use crate::driver::PlcDriver;
use crate::messages::{StatusPayload, TelemetryFrame};

pub struct BroadcastManager {
    sender: broadcast::Sender<TelemetryFrame>,
}

impl BroadcastManager {
    pub fn new(capacity: usize) -> Self {
        let (sender, _) = broadcast::channel(capacity);
        Self { sender }
    }

    pub fn subscribe(&self) -> broadcast::Receiver<TelemetryFrame> {
        self.sender.subscribe()
    }

    pub fn sender(&self) -> broadcast::Sender<TelemetryFrame> {
        self.sender.clone()
    }

    pub fn spawn_loop<D: PlcDriver + 'static>(self, driver: Arc<D>) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move {
            let mut ticker = interval(Duration::from_millis(50));
            ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);
            let mut seq: u64 = 0;

            loop {
                ticker.tick().await;
                if let Ok(data) = driver.read_db1().await {
                    seq = seq.wrapping_add(1);
                    let now_ms = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_millis() as u64;

                    let frame = TelemetryFrame {
                        seq,
                        timestamp_ms: now_ms,
                        flow_rate: data.flow_rate,
                        pressure: data.pressure,
                        tank_level: data.tank_level,
                        flow_setpoint: data.flow_setpoint,
                        pressure_setpoint: data.pressure_setpoint,
                        total_flow: data.total_flow,
                        heartbeat: data.heartbeat,
                        status: StatusPayload {
                            pump_running: data.status.pump_running,
                            pump_fault: data.status.pump_fault,
                            valve_open: data.status.valve_open,
                            valve_closed: data.status.valve_closed,
                            high_level_alarm: data.status.high_level_alarm,
                            low_level_alarm: data.status.low_level_alarm,
                            auto_mode: data.status.auto_mode,
                            emergency_stop: data.status.emergency_stop,
                        },
                    };
                    let _ = self.sender.send(frame);
                }
            }
        })
    }
}
