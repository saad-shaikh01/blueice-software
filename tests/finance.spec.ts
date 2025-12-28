import { test, expect } from '@playwright/test';
import { loginAs } from './utils';

test.describe('Finance & Expenses', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@blueice.com');
  });

  test('Admin can log an expense', async ({ page }) => {
    // Navigate to Expenses page
    await page.goto('/expenses');

    // Open Dialog
    await page.getByRole('button', { name: 'Add Expense' }).click();

    // Fill Form
    await page.getByLabel('Amount').fill('5000');

    // Select Category (Default is FUEL, but let's select explicitly to be safe)
    await page.getByLabel('Category').click();
    await page.getByRole('option', { name: 'FUEL' }).click();

    // Description
    const desc = `Fuel refill ${Date.now()}`;
    await page.getByLabel('Description').fill(desc);

    // Submit
    await page.getByRole('button', { name: 'Save Expense' }).click();

    // Verify Success Toast or Dialog Close
    // If dialog is still open, check for error message
    if (await page.getByRole('dialog').isVisible()) {
        const errorToast = page.getByText('Error'); // Generic check
        if (await errorToast.isVisible()) {
            console.error('Test failed with Toast Error');
        }
    }
    await expect(page.getByRole('dialog')).toBeHidden();

    // Verify in Table
    // We assume the table refreshes or shows the new item.
    // We search for the unique description.
    await expect(page.getByText(desc)).toBeVisible();
    await expect(page.getByText('5,000')).toBeVisible(); // Formatting check
  });
});
