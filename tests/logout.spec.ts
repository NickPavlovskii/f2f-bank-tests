import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

/** Порядок: Высокий → Средний */

test.describe('Logout', () => {
  /** TC-LOGOUT-01 | Высокий */
  test('TC-LOGOUT-01: выход из системы', async ({ page }) => {
    await registerAndLogin(page);

    await page.locator('header').getByRole('button').click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  /** TC-LOGOUT-02 | Средний */
  test('TC-LOGOUT-02: кнопка Back после выхода', async ({ page }) => {
    await registerAndLogin(page);

    await page.locator('header').getByRole('button').click();
    await expect(page).toHaveURL(/\/login/);

    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
  });
});
