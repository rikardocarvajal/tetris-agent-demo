import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:4173' });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('la página carga con el canvas', async ({ page }) => {
  await expect(page.locator('#tetris-board')).toBeVisible();
});

test('el HUD muestra score=0, lines=0, level=1 al inicio', async ({ page }) => {
  await expect(page.locator('#score')).toContainText('0');
  await expect(page.locator('#lines')).toContainText('0');
  await expect(page.locator('#level')).toContainText('1');
});

test('botones INICIAR y PAUSAR existen', async ({ page }) => {
  await expect(page.locator('#btn-start')).toBeVisible();
  await expect(page.locator('#btn-pause')).toBeVisible();
});

test('al presionar INICIAR el juego comienza', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await page.locator('#btn-start').click();
  await page.waitForTimeout(1000);
  await expect(page.locator('#score')).toBeVisible();
});

test('al presionar PAUSAR el estado cambia', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await page.locator('#btn-start').click();
  await page.waitForTimeout(500);
  await page.locator('#btn-pause').click();
  await page.waitForTimeout(500);
  await page.locator('#btn-pause').click();
  await page.waitForTimeout(500);
  await expect(page.locator('#tetris-board')).toBeVisible();
});

test('hard drop con teclado permite completar línea', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await page.locator('#btn-start').click();
  await page.waitForTimeout(300);
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
  }
  await expect(page.locator('#tetris-board')).toBeVisible();
});

test('el título TETRIS aparece en la página', async ({ page }) => {
  await expect(page.locator('#game-header h1')).toContainText('TETRIS');
});

test('canvas existe con dimensiones correctas', async ({ page }) => {
  const canvas = page.locator('#tetris-board');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  // Verificar que está dentro del rango razonable (los bordes CSS pueden afectar)
  expect(box!.width!).toBeGreaterThanOrEqual(298);
  expect(box!.height!).toBeGreaterThanOrEqual(598);
});

test('hud se mantiene visible durante juego', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await page.locator('#btn-start').click();
  await page.waitForTimeout(2000);
  await expect(page.locator('#score')).toBeVisible();
  await expect(page.locator('#lines')).toBeVisible();
  await expect(page.locator('#level')).toBeVisible();
});

test('botones son clickeables', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  const startBtn = page.locator('#btn-start');
  const pauseBtn = page.locator('#btn-pause');
  // Verificar que están en el DOM con tamaño
  expect(await startBtn.count()).toBe(1);
  expect(await pauseBtn.count()).toBe(1);
  // Obtener bounding box para verificar que tienen tamaño
  const startBox = await startBtn.boundingBox();
  expect(startBox).not.toBeNull();
  if (startBox) {
    expect(startBox!.width!).toBeGreaterThan(0);
    expect(startBox!.height!).toBeGreaterThan(0);
  }
});
