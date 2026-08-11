import { test, expect } from '@playwright/test';

test.describe('Worker Workflow', () => {
  test('worker can login and navigate to dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    await page.fill('input[type="email"]', 'worker@bmc.gov.in');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
      
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
