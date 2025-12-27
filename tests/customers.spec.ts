import { test, expect } from '@playwright/test';
import { loginAs } from './utils';

test.describe('Customer Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@blueice.com');
  });

  test('Create a new customer', async ({ page }) => {
    await page.goto('/customers');
    // Button is a Link
    await page.getByRole('link', { name: 'Add Customer' }).click();

    // Step 1: Basic Info
    const name = `Test Customer ${Date.now()}`;
    await page.getByLabel('Full Name').fill(name);
    await page.getByLabel('Phone Number').fill(`03${Date.now().toString().slice(-9)}`);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Location
    await page.getByLabel('Address').fill('Test Address, DHA');

    // Area/Route might be a Select or Combobox. Assuming Select with Label 'Area'.
    // If exact label unknown, we can try matching text or placeholder.
    // Let's assume standard Shadcn Select behavior
    await page.click('button[role="combobox"]'); // Generic way to open select if label fails
    await page.getByRole('option').first().click();

    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: Schedule & Pricing
    // Defaults might be filled, just click Next
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 4: Legacy Migration
    // Submit
    await page.getByRole('button', { name: 'Create Customer' }).click();

    // Verify success (Toast or Redirect)
    await expect(page).toHaveURL('/customers');

    // Verify in list
    await page.getByPlaceholder('Search customers...').fill(name);
    await expect(page.getByText(name)).toBeVisible();
  });
});
