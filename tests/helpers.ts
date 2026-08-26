import { expect, type Page } from '@playwright/test';
import type { TestUser } from './types';

export function uniqueEmail() {
  return `user.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@test.com`;
}

export function defaultUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    name: 'Nick',
    surname: 'Pavlov',
    email: uniqueEmail(),
    password: 'Qwerty123!',
    ...overrides,
  };
}

export async function fillRegistrationForm(page: Page, user: TestUser) {
  await page.getByPlaceholder('Type your name').fill(user.name);
  await page.getByPlaceholder('Type your surname').fill(user.surname);
  await page.getByPlaceholder('Type your email').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
}

export async function registerUser(page: Page, overrides: Partial<TestUser> = {}): Promise<TestUser> {
  const user = defaultUser(overrides);
  await page.goto('/register');
  await fillRegistrationForm(page, user);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page).toHaveURL(/\/login/);
  return user;
}

export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('Type your email').fill(email);
  await page.getByPlaceholder('Type your password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL('/');
}

export async function registerAndLogin(page: Page, overrides: Partial<TestUser> = {}): Promise<TestUser> {
  const user = await registerUser(page, overrides);
  await loginUser(page, user.email, user.password);
  return user;
}

export async function addBalance(page: Page, amount: number) {
  await page.goto('/transactions');
  await page.getByRole('button', { name: 'Add balance' }).click();
  await page.locator('input[name="balance"]').fill(String(amount));
  await page.getByRole('button', { name: 'Add' }).click();
}

export async function fillTransferForm(
  page: Page,
  data: { phone: string; amount: string; purpose: string },
) {
  await page.locator('input[name="phone"]').fill(data.phone);
  await page.locator('input[name="amount"]').fill(data.amount);
  await page.locator('input[name="purpose"]').fill(data.purpose);
}

