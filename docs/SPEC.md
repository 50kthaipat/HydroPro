# HydroFlow SCADA — Project Specification

## 1. Process Description (Two-Tank Pressurized System)
- **Tank 01 (Buffer Tank)**: Atmospheric pressure, level 0-100% (IFM LR2050 Radar 4-20mA).
- **Inlet Valve A**: Bürkert Type 3361 proportional globe valve (0-100%, 4-20mA).
- **Booster Pump 01**: Grundfos CR 3-10 centrifugal pump driven by Siemens G120C VFD (0-2900 RPM).
- **Tank 02 (Pressure Vessel)**: High pressure 0-10 bar (IFM PN7094 4-20mA).
- **Safety Relief Valve B**: Festo VZWF Solenoid valve (Opens when pressure > 8.0 bar).
- **Flow Sensor**: Siemens SITRANS MAG 5100 W (0-250 L/min, 4-20mA).
- **Temp Sensor**: Endress+Hauser TM311 RTD Pt100 (0-100 °C, 4-20mA).

---

## 2. Siemens S7 PLC Memory Map (Data Block 1: DB1)

| Byte Offset | Tag Name | Type | Direction | Description |
| :--- | :--- | :--- | :--- | :--- |
| 0.0 | `PV_Tank1_Level` | REAL | PLC -> SCADA | Liquid level in Tank 1 (0.0 - 100.0 %) |
| 4.0 | `PV_Line_Pressure` | REAL | PLC -> SCADA | Pipeline pressure (0.0 - 10.0 bar) |
| 8.0 | `PV_Flow_Rate` | REAL | PLC -> SCADA | Flow rate (0.0 - 250.0 L/min) |
| 12.0 | `PV_Pump_Current` | REAL | PLC -> SCADA | Pump motor current (0.0 - 15.0 A) |
| 16.0 | `PV_Fluid_Temp` | REAL | PLC -> SCADA | Liquid temperature (20.0 - 80.0 °C) |
| 20.0 | `CMD_Pump_Start` | BOOL | SCADA -> PLC | Command: Pump Start |
| 20.1 | `CMD_Pump_Stop` | BOOL | SCADA -> PLC | Command: Pump Stop |
| 20.2 | `CMD_Relief_Open` | BOOL | SCADA -> PLC | Command: Open Emergency Relief Valve |
| 22.0 | `SP_Pump_Speed` | REAL | SCADA -> PLC | Setpoint: Pump Speed (0.0 - 100.0 %) |
| 26.0 | `SP_ValveA_Pos` | REAL | SCADA -> PLC | Setpoint: Valve A Position (0.0 - 100.0 %) |

---

## 3. Technology Stack
- **Backend**: Rust (Tokio async runtime, Axum WebSocket server at 20Hz, Bernoulli physics engine, Trait `PlcDriver`).
- **Frontend**: TypeScript, React, Tailwind CSS, SVG animated P&ID, ISA-101 / ISA-18.2 compliant.
- **DevOps**: Multi-stage Dockerfiles, docker-compose.yml (Simulation mode default), GitHub Actions CI.
