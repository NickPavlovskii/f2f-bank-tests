import { expect, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { RegisterPage } from '../pages/register.page';
import { defaultUser } from './test-data';
import type { TestUser } from './types';

export { defaultUser, uniqueEmail } from './test-data';
export type { TestUser } from './types';

/**
 * Регистрация нового пользователя
 * изоляция через uniqueEmail()
 */
export async function registerUser(
  page: Page,
  overrides: Partial<TestUser> = {},
): Promise<TestUser> {
  const user = defaultUser(overrides);
  const registerPage = new RegisterPage(page);
  await registerPage.goto();
  await registerPage.register(user);
  await expect(page).toHaveURL(/\/login/);
  return user;
}

export async function loginUser(page: Page, email: string, password: string) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await expect(page).toHaveURL('/');
}

export async function registerAndLogin(
  page: Page,
  overrides: Partial<TestUser> = {},
): Promise<TestUser> {
  const user = await registerUser(page, overrides);
  await loginUser(page, user.email, user.password);
  return user;
}

export async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page
    .evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    })
    .catch(() => undefined);
}
