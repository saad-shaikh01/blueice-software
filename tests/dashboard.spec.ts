import { expect, test } from '@playwright/test';

import { loginAs } from './utils';

test.describe('Dashboard Features', () => {
  test('Admin can view comprehensive dashboard', async ({ page }) => {
    // Login as Admin
    await loginAs(page, '03001234567'); // Assuming seed data has this admin

    // Check Dashboard Elements
    await expect(page.getByText('Business Intelligence Dashboard')).toBeVisible();
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('Verified Cash')).toBeVisible(); // The feature we added
  });
});
