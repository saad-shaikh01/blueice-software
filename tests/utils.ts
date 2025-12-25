import { Page, expect } from '@playwright/test';

export async function loginAs(page: Page, phone: string, password: string = 'password123') {
  await page.goto('/sign-in');
  await page.fill('input[type="tel"]', phone);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect
  await expect(page).toHaveURL(/dashboard|deliveries/);
}
