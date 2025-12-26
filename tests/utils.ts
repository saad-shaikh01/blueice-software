import { Page, expect } from '@playwright/test';

export async function loginAs(page: Page, identifier: string, password: string = 'password123') {
  await page.goto('/sign-in');

  // Check if identifier looks like email or phone
  if (identifier.includes('@')) {
    await page.getByLabel('Email address').fill(identifier);
  } else {
    // Assuming phone label or placeholder
    const phoneInput = page.getByLabel('Phone Number').or(page.locator('input[type="tel"]'));
    await phoneInput.fill(identifier);
  }

  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for redirect
  await page.waitForURL(/dashboard|deliveries/);
}
