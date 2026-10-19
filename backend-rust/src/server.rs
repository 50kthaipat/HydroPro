use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, State},
    response::IntoResponse,
    routing::get,
    Router,
};
use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use tokio::sync::broadcast;
use crate::driver::{DiscreteAction, PlcCommand, PlcDriver};
use crate::messages::{ClientCommand, TelemetryFrame};

#[derive(Clone)]
pub struct AppState {
    pub driver: Arc<dyn PlcDriver>,
    pub tx: broadcast::Sender<TelemetryFrame>,
}

pub fn app_router(state: AppState) -> Router {
    Router::new()
        .route("/healthz", get(|| async { "OK" }))
        .route("/ws/telemetry", get(ws_handler))
        .with_state(state)
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.tx.subscribe();
    let driver = state.driver.clone();

    let mut send_task = tokio::spawn(async move {
        while let Ok(frame) = rx.recv().await {
            if let Ok(json_str) = serde_json::to_string(&frame) {
                if sender.send(Message::Text(json_str)).await.is_err() { break; }
            }
        }
    });

    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = receiver.next().await {
            if let Ok(cmd) = serde_json::from_str::<ClientCommand>(&text) {
                match cmd {
                    ClientCommand::Setpoint { target, value, .. } => {
                        if target == "flow_rate" { let _ = driver.write_command(PlcCommand::SetFlowSetpoint(value)).await; }
                        else if target == "pressure" { let _ = driver.write_command(PlcCommand::SetPressureSetpoint(value)).await; }
                    }
                    ClientCommand::Action { action, .. } => {
                        let act = match action.as_str() {
                            "start_pump" => Some(DiscreteAction::StartPump),
                            "stop_pump" => Some(DiscreteAction::StopPump),
                            "open_valve" => Some(DiscreteAction::OpenValve),
                            "close_valve" => Some(DiscreteAction::CloseValve),
                            "emergency_stop" => Some(DiscreteAction::EmergencyStop),
                            "ack_alarms" => Some(DiscreteAction::AcknowledgeAlarms),
                            _ => None,
                        };
                        if let Some(a) = act { let _ = driver.write_command(PlcCommand::ExecuteAction(a)).await; }
                    }
                    ClientCommand::Mode { auto_mode, .. } => {
                        let _ = driver.write_command(PlcCommand::SetAutoMode(auto_mode)).await;
                    }
                }
            }
        }
    });

    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}
