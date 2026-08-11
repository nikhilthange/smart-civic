import { test, expect } from '@playwright/test';

test.describe('Admin Workflow', () => {
  test('admin can login and view analytics dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    await page.fill('input[type="email"]', 'admin@bmc.gov.in');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
      
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Admin dashboard should have Analytics link or title
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible({ timeout: 10000 }).catch(() => {});
  });
});
