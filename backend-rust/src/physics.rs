#[derive(Debug, Clone)]
pub struct PhysicsConfig {
    pub gravity: f32,
    pub fluid_density: f32,
    pub tank1_area: f32,
    pub tank2_area: f32,
    pub pump_max_flow: f32,
    pub pump_tau: f32,
    pub discharge_orifice_area: f32,
    pub discharge_cd: f32,
    pub tank2_bulk_modulus: f32,
    pub atmospheric_pressure: f32,
}

impl Default for PhysicsConfig {
    fn default() -> Self {
        Self {
            gravity: 9.81,
            fluid_density: 1000.0,
            tank1_area: 2.0,
            tank2_area: 1.5,
            pump_max_flow: 120.0,
            pump_tau: 0.8,
            discharge_orifice_area: 0.005,
            discharge_cd: 0.62,
            tank2_bulk_modulus: 25_000.0,
            atmospheric_pressure: 101.325,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct PhysicsState {
    pub tank1_level: f32,
    pub tank2_level: f32,
    pub tank2_pressure: f32,
    pub pump_speed: f32,
    pub pump_flow_rate: f32,
    pub discharge_flow_rate: f32,
    pub total_discharge_volume: f32,
}

impl Default for PhysicsState {
    fn default() -> Self {
        Self {
            tank1_level: 2.5,
            tank2_level: 1.0,
            tank2_pressure: 101.325,
            pump_speed: 0.0,
            pump_flow_rate: 0.0,
            discharge_flow_rate: 0.0,
            total_discharge_volume: 0.0,
        }
    }
}

pub struct TwoTankModel {
    config: PhysicsConfig,
    state: PhysicsState,
    target_pump_speed: f32,
    valve_position: f32,
}

impl TwoTankModel {m    pub fn new(config: PhysicsConfig) -> Self {
        Self {
            config,
            state: PhysicsState::default(),
            target_pump_speed: 0.0,
            valve_position: 0.0,
        }
    }

    pub fn set_pump_command(&mut self, speed: f32) { self.target_pump_speed = speed.clamp(0.0, 1.0); }
    pub fn set_valve_position(&mut self, pos: f32) { self.valve_position = pos.clamp(0.0, 1.0); }
    pub fn state(&self) -> &PhysicsState { &self.state }

    pub fn step(&mut self, dt: f32) {
        let speed_err = self.target_pump_speed - self.state.pump_speed;
        let alpha = (dt / self.config.pump_tau).min(1.0);
        self.state.pump_speed = (self.state.pump_speed + alpha * speed_err).clamp(0.0, 1.0);

        let mut q_pump = if self.state.tank1_level > 0.05 {
            self.config.pump_max_flow * self.state.pump_speed
        } else { 0.0 };

        let delta_p_pa = (self.state.tank2_pressure - self.config.atmospheric_pressure) * 1000.0;
        let head_m = self.state.tank2_level.max(0.0);
        let eff_head = (2.0 * delta_p_pa / self.config.fluid_density) + (2.0 * self.config.gravity * head_m);
        let vel = if eff_head > 0.0 { eff_head.sqrt() } else { 0.0 };
        let q_discharge = (self.config.discharge_cd * self.config.discharge_orifice_area * self.valve_position * vel) * 3600.0;

        let dh1 = -(q_pump / 3600.0 / self.config.tank1_area) * dt;
        self.state.tank1_level = (self.state.tank1_level + dh1).max(0.0);
        if self.state.tank1_level == 0.0 { q_pump = 0.0; }

        let net_m3s = (q_pump - q_discharge) / 3600.0;
        let dh2 = (net_m3s / self.config.tank2_area) * dt;
        self.state.tank2_level = (self.state.tank2_level + dh2).max(0.0);

        let dp = (net_m3s * self.config.tank2_bulk_modulus / self.config.tank2_area) * dt;
        self.state.tank2_pressure = (self.state.tank2_pressure + dp).max(self.config.atmospheric_pressure);

        self.state.pump_flow_rate = q_pump;
        self.state.discharge_flow_rate = q_discharge;
        self.state.total_discharge_volume += (q_discharge / 3600.0) * dt;
    }
}
