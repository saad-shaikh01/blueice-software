import { test, expect } from '@playwright/test';
import { loginAs } from './utils';

test.describe('Order Lifecycle', () => {
  let customerName: string;

  test.beforeEach(async ({ page }) => {
    // We assume data exists. In a real world, we'd create data via API first.
    // Here we rely on Seed or previous tests.
  });

  test('Admin creates order -> Driver completes it', async ({ browser }) => {
    // 1. Admin Context
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAs(adminPage, 'admin@blueice.com');

    // Create Order
    await adminPage.goto('/orders');
    // Button is a Link
    await adminPage.getByRole('link', { name: 'Create Order' }).click();

    // Select Customer (Pick the first one)
    // Using label 'Customer' which is tied to the Select
    await adminPage.getByLabel('Customer').click();
    await adminPage.getByRole('option').first().click();

    // Add Product
    await adminPage.getByRole('button', { name: 'Add Item' }).click();

    // Select Product in the first row of table
    // The SelectTrigger has placeholder "Select Product" but no attached label in the cell
    const itemRow = adminPage.locator('table tbody tr').first();
    await itemRow.getByRole('combobox').click();
    await adminPage.getByRole('option').first().click(); // 19L Water

    // Quantity in the same row
    await itemRow.locator('input[type="number"]').first().fill('2');

    // Save
    await adminPage.getByRole('button', { name: 'Create Order' }).click();
    await expect(adminPage.getByText('Order created')).toBeVisible();

    // Get Order ID (Need to extract from URL or UI)
    // For simplicity, we assume it's the top one in the list
    await expect(adminPage.locator('tbody tr').first()).toBeVisible();
    const orderRow = adminPage.locator('tbody tr').first();
    const orderIdText = await orderRow.locator('td').first().textContent(); // e.g., "Order #1005"

    // Assign Driver
    await orderRow.getByRole('button', { name: 'Edit' }).click(); // Or context menu
    // Actually, usually there's an "Assign" action or we do it in Edit page.
    // Let's assume Edit Page.
    await adminPage.getByLabel('Assign Driver').click();
    await adminPage.getByRole('option', { name: 'driver0' }).click(); // driver0 from seed
    await adminPage.getByRole('button', { name: 'Save Changes' }).click();

    await adminContext.close();

    // 2. Driver Context
    const driverContext = await browser.newContext();
    const driverPage = await driverContext.newPage();
    await loginAs(driverPage, 'driver0@blueice.com');

    // Go to deliveries
    await driverPage.goto('/deliveries');

    // Find the order
    await expect(driverPage.getByText(orderIdText!)).toBeVisible();

    // Click on order to view details/complete
    await driverPage.getByText(orderIdText!).click();

    // Complete Order
    await driverPage.getByRole('button', { name: 'Complete Delivery' }).click();

    // Fill details
    await driverPage.getByLabel('Bottles Delivered').fill('2');
    await driverPage.getByLabel('Empty Bottles Returned').fill('2');
    await driverPage.getByLabel('Cash Collected').fill('400'); // 200 * 2

    await driverPage.getByRole('button', { name: 'Confirm Completion' }).click();

    // Verify success
    await expect(driverPage.getByText('Delivery completed')).toBeVisible();

    await driverContext.close();

    // 3. Admin Verification
    const verifyContext = await browser.newContext();
    const verifyPage = await verifyContext.newPage();
    await loginAs(verifyPage, 'admin@blueice.com');

    await verifyPage.goto('/orders');
    // Filter by Completed?
    // Check status badge of the top order
    await expect(verifyPage.locator('tbody tr').first()).toContainText('COMPLETED');
  });
});
