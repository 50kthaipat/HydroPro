use std::sync::Arc;
use hydroflow_core::{app_router, AppState, BroadcastManager, MockDriver};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = format!("{}:{}", host, port);

    let driver = Arc::new(MockDriver::new());

    let sim_driver = driver.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_millis(50));
        loop {
            interval.tick().await;
            sim_driver.step_simulation(0.05).await;
        }
    });

    let broadcast_mgr = BroadcastManager::new(100);
    let tx = broadcast_mgr.sender();
    broadcast_mgr.spawn_loop(driver.clone());

    let state = AppState {
        driver: driver.clone(),
        tx,
    };

    let app = app_router(state);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    println!("HydroFlow SCADA Server listening on ws://{}/ws/telemetry", addr);
    axum::serve(listener, app).await?;

    Ok(())
}
