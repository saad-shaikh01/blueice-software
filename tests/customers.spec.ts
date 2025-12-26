import { test, expect } from '@playwright/test';
import { loginAs } from './utils';

test.describe('Customer Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@blueice.com');
  });

  test('Create a new customer', async ({ page }) => {
    await page.goto('/customers');
    await page.getByRole('button', { name: 'Add Customer' }).click();

    // Fill form
    const name = `Test Customer ${Date.now()}`;
    await page.getByLabel('Full Name').fill(name);
    await page.getByLabel('Phone Number').fill(`03${Date.now().toString().slice(-9)}`);
    await page.getByLabel('Address').fill('Test Address, DHA');
    await page.getByLabel('Area/Route').click();
    // Assuming 'DHA Phase 6' exists from seed
    await page.getByRole('option').first().click();

    await page.getByRole('button', { name: 'Create Customer' }).click();

    // Verify success
    await expect(page.getByText('Customer created successfully')).toBeVisible();

    // Verify in list
    await page.getByPlaceholder('Search customers...').fill(name);
    await expect(page.getByText(name)).toBeVisible();
  });
});
