import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('Admin login with valid credentials', async ({ page }) => {
    await page.goto('/sign-in');

    await page.getByLabel('Email address').fill('admin@blueice.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Business Intelligence Dashboard')).toBeVisible();
  });

  test('Driver login redirects to deliveries', async ({ page }) => {
    await page.goto('/sign-in');

    // Drivers often use phone, but seed sets email too. Let's use email for consistency.
    await page.getByLabel('Email address').fill('driver0@blueice.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Verify redirect to deliveries
    await expect(page).toHaveURL(/\/deliveries/);
    await expect(page.getByText('Today\'s Deliveries')).toBeVisible();
  });

  test('Invalid credentials show error', async ({ page }) => {
    await page.goto('/sign-in');

    await page.getByLabel('Email address').fill('admin@blueice.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Verify error message
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });
});
