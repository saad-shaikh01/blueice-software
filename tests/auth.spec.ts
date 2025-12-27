import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('Admin login with valid credentials', async ({ page }) => {
    await page.goto('/sign-in');

    await page.getByPlaceholder('Email or Phone Number').fill('admin@blueice.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Business Intelligence Dashboard')).toBeVisible();
  });

  test('Driver login redirects to deliveries', async ({ page }) => {
    await page.goto('/sign-in');

    // Drivers often use phone, but seed sets email too. Let's use email for consistency.
    await page.getByPlaceholder('Email or Phone Number').fill('driver0@blueice.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    // Verify redirect to deliveries
    await expect(page).toHaveURL(/\/deliveries/);
    // Driver dashboard has stats like "Cash Collected" or "Pending"
    await expect(page.getByText('Cash Collected')).toBeVisible();
  });

  test('Invalid credentials show error', async ({ page }) => {
    await page.goto('/sign-in');

    await page.getByPlaceholder('Email or Phone Number').fill('admin@blueice.com');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    // Verify error message
    // Backend returns "Invalid credentials" which is shown in toast
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });
});
