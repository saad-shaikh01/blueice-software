import { Page, expect } from '@playwright/test';

export async function loginAs(page: Page, identifier: string, password: string = 'password123') {
  await page.goto('/sign-in');

  // The UI uses a single input with placeholder "Email or Phone Number"
  // and button text "Login"
  await page.getByPlaceholder('Email or Phone Number').fill(identifier);

  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait for redirect
  await page.waitForURL(/dashboard|deliveries/);
}
