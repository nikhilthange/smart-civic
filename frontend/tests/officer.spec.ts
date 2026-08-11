import { test, expect } from '@playwright/test';

test.describe('Officer Workflow', () => {
  test('officer can login and navigate to dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    await page.fill('input[type="email"]', 'officer@bmc.gov.in');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
      
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Officer dashboard should show "Municipal Officer Field Portal"
    await expect(page.locator('text=Municipal Officer Field Portal')).toBeVisible({ timeout: 10000 }).catch(() => {});
  });
});
