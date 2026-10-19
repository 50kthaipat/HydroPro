use thiserror::Error;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum CodecError {
    #[error("buffer length mismatch: expected {expected}, actual {actual}")]
    InvalidLength { expected: usize, actual: usize },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
#[repr(transparent)]
pub struct BeF32(pub [u8; 4]);

impl BeF32 {
    #[inline]
    pub const fn from_f32(val: f32) -> Self { Self(val.to_be_bytes()) }
    #[inline]
    pub const fn to_f32(self) -> f32 { f32::from_be_bytes(self.0) }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
#[repr(transparent)]
pub struct BeU16(pub [u8; 2]);

impl BeU16 {
    #[inline]
    pub const fn from_u16(val: u16) -> Self { Self(val.to_be_bytes()) }
    #[inline]
    pub const fn to_u16(self) -> u16 { u16::from_be_bytes(self.0) }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
#[repr(transparent)]
pub struct StatusByte(pub u8);

impl StatusByte {
    pub const PUMP_RUNNING: u8     = 1 << 0;
    pub const PUMP_FAULT: u8       = 1 << 1;
    pub const VALVE_OPEN: u8       = 1 << 2;
    pub const VALVE_CLOSED: u8     = 1 << 3;
    pub const HIGH_LEVEL_ALARM: u8 = 1 << 4;
    pub const LOW_LEVEL_ALARM: u8  = 1 << 5;
    pub const AUTO_MODE: u8        = 1 << 6;
    pub const EMERGENCY_STOP: u8   = 1 << 7;

    #[inline]
    pub fn is_set(self, mask: u8) -> bool { (self.0 & mask) != 0 }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(C, packed)]
pub struct Db1Raw {
    pub flow_rate: BeF32,
    pub pressure: BeF32,
    pub tank_level: BeF32,
    pub flow_setpoint: BeF32,
    pub pressure_setpoint: BeF32,
    pub status_byte: StatusByte,
    pub _reserved: u8,
    pub total_flow: BeF32,
    pub heartbeat: BeU16,
}

impl Db1Raw {
    pub fn from_slice(slice: &[u8]) -> Result<Self, CodecError> {
        if slice.len() != 28 {
            return Err(CodecError::InvalidLength { expected: 28, actual: slice.len() });
        }
        let raw = unsafe { std::ptr::read_unaligned(slice.as_ptr() as *const Self) };
        Ok(raw)
    }

    pub fn to_bytes(&self) -> [u8; 28] {
        let mut buffer = [0u8; 28];
        unsafe {
            std::ptr::copy_nonoverlapping(self as *const Self as *const u8, buffer.as_mut_ptr(), 28);
        }
        buffer
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct SystemStatus {
    pub pump_running: bool,
    pub pump_fault: bool,
    pub valve_open: bool,
    pub valve_closed: bool,
    pub high_level_alarm: bool,
    pub low_level_alarm: bool,
    pub auto_mode: bool,
    pub emergency_stop: bool,
}

impl From<StatusByte> for SystemStatus {
    fn from(sb: StatusByte) -> Self {
        Self {
            pump_running: sb.is_set(StatusByte::PUMP_RUNNING),
            pump_fault: sb.is_set(StatusByte::PUMP_FAULT),
            valve_open: sb.is_set(StatusByte::VALVE_OPEN),
            valve_closed: sb.is_set(StatusByte::VALVE_CLOSED),
            high_level_alarm: sb.is_set(StatusByte::HIGH_LEVEL_ALARM),
            low_level_alarm: sb.is_set(StatusByte::LOW_LEVEL_ALARM),
            auto_mode: sb.is_set(StatusByte::AUTO_MODE),
            emergency_stop: sb.is_set(StatusByte::EMERGENCY_STOP),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Default)]
pub struct Db1Data {
    pub flow_rate: f32,
    pub pressure: f32,
    pub tank_level: f32,
    pub flow_setpoint: f32,
    pub pressure_setpoint: f32,
    pub status: SystemStatus,
    pub total_flow: f32,
    pub heartbeat: u16,
}

impl From<Db1Raw> for Db1Data {
    fn from(raw: Db1Raw) -> Self {
        Self {
            flow_rate: raw.flow_rate.to_f32(),
            pressure: raw.pressure.to_f32(),
            tank_level: raw.tank_level.to_f32(),
            flow_setpoint: raw.flow_setpoint.to_f32(),
            pressure_setpoint: raw.pressure_setpoint.to_f32(),
            status: SystemStatus::from(raw.status_byte),
            total_flow: raw.total_flow.to_f32(),
            heartbeat: raw.heartbeat.to_u16(),
        }
    }
}
