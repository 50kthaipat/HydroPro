import { test, expect } from '@playwright/test';

test.describe('HydroFlow SCADA — ISA-101 Dashboard & Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render ISA-101 title and connection indicator', async ({ page }) => {
    const title = page.getByTestId('scada-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('HYDROFLOW SCADA DASHBOARD');

    const connStatus = page.getByTestId('connection-status');
    await expect(connStatus).toBeVisible();
    await expect(connStatus).toContainText('ONLINE');
  });

  test('should render two-tank P&ID schematic with instruments', async ({ page }) => {
    const pidContainer = page.locator('svg');
    await expect(pidContainer).toBeVisible();

    await expect(page.locator('text=TANK 1')).toBeVisible();
    await expect(page.locator('text=TANK 2')).toBeVisible();
    await expect(page.getByText('PUMP 01', { exact: true })).toBeVisible();
    await expect(page.locator('text=XV-01')).toBeVisible();
    await expect(page.locator('text=FLOW (m³/h)')).toBeVisible();
  });

  test('should display equipment faceplates for Pump and Valve', async ({ page }) => {
    const pumpFaceplate = page.getByTestId('faceplate-pump');
    await expect(pumpFaceplate).toBeVisible();
    await expect(pumpFaceplate).toContainText('BOOSTER PUMP 01');

    const valveFaceplate = page.getByTestId('faceplate-valve');
    await expect(valveFaceplate).toBeVisible();
    await expect(valveFaceplate).toContainText('INLET VALVE A');

    await expect(page.getByTestId('btn-start-pump')).toBeVisible();
    await expect(page.getByTestId('btn-stop-pump')).toBeVisible();
    await expect(page.getByTestId('btn-open-valve')).toBeVisible();
    await expect(page.getByTestId('btn-close-valve')).toBeVisible();
  });

  test('should allow setting pump speed and valve position setpoints', async ({ page }) => {
    const pumpSlider = page.getByTestId('slider-pump-speed');
    await pumpSlider.fill('85');
    await expect(page.getByTestId('val-pump-speed')).toHaveText('85%');

    const valveSlider = page.getByTestId('slider-valve-pos');
    await valveSlider.fill('60');
    await expect(page.getByTestId('val-valve-pos')).toHaveText('60%');
  });

  test('should open and close faceplate modal when clicking P&ID pump element', async ({ page }) => {
    const pumpElement = page.getByText('PUMP 01', { exact: true });
    await pumpElement.click();

    const modal = page.getByTestId('equipment-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Equipment Faceplate: Pump 01');

    await page.getByTestId('btn-close-modal').click();
    await expect(modal).not.toBeVisible();
  });

  test('should render real-time 60-second rolling trend canvas', async ({ page }) => {
    await expect(page.locator('text=REAL-TIME FLOW TREND (60s ROLLING WINDOW)')).toBeVisible();
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should trigger ISA-18.2 alarm on high pressure (> 8.0 bar) and support operator acknowledgment', async ({ page }) => {
    await page.routeWebSocket('**/ws/telemetry', (ws) => {
      ws.send(JSON.stringify({
        seq: 500,
        timestamp_ms: Date.now(),
        flow_rate: 145.0,
        pressure: 8.75,
        tank_level: 60.0,
        flow_setpoint: 120.0,
        pressure_setpoint: 7.0,
        total_flow: 890.0,
        heartbeat: 500,
        status: {
          pump_running: true,
          pump_fault: false,
          valve_open: true,
          valve_closed: false,
          high_level_alarm: false,
          low_level_alarm: false,
          auto_mode: true,
          emergency_stop: false,
        },
      }));
    });

    await page.goto('/');

    const alarmText = page.locator('text=HIGH PRESSURE (> 8.0 BAR)');
    await expect(alarmText).toBeVisible();

    const ackButton = page.getByRole('button', { name: 'ACKNOWLEDGE' });
    await expect(ackButton).toBeVisible();
    await ackButton.click();

    await expect(page.getByRole('button', { name: 'ACKNOWLEDGED' })).toBeVisible();
  });
});
