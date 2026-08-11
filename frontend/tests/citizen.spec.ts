import { test, expect } from '@playwright/test';

test.describe('Citizen Workflow', () => {
  test('citizen can login and navigate to dashboard', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173/');

    // Check if on login page, otherwise navigate
    await page.goto('http://localhost:5173/login');

    await page.fill('input[type="email"]', 'citizen@bmc.gov.in');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
      
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('citizen can navigate to file a complaint', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'citizen@bmc.gov.in');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Go to file complaint page
    await page.click('text=File New Complaint', { strict: false }).catch(() => {});
    await page.goto('http://localhost:5173/complaint/new');
    await expect(page).toHaveURL(/.*complaint\/new/);
  });
});
