import { test, expect } from '@playwright/test';
import { defaultUser, fillRegistrationForm, uniqueEmail } from './helpers';

/** Порядок: Критический → Высокий → Средний */

test.describe('Registration', () => {
  /** TC-REG-01 | Критический */
  test('TC-REG-01: успешная регистрация', async ({ page }) => {
    await page.goto('/register');
    await fillRegistrationForm(page, defaultUser());
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.snackbar')).toContainText('Registration successful');
    await expect(page.getByRole('heading', { name: 'Login to F2F Bank' })).toBeVisible();
  });

  /** TC-REG-02 | Высокий */
  test('TC-REG-02: регистрация с уже занятым email', async ({ page }) => {
    const user = defaultUser({ email: uniqueEmail() });

    await page.goto('/register');
    await fillRegistrationForm(page, user);
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/register');
    await fillRegistrationForm(page, user);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.locator('.error')).toContainText(/already exists/i);
    await expect(page).toHaveURL(/\/register/);
  });

  /** TC-REG-03 | Средний */
  test('TC-REG-03: регистрация с пустыми полями', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: 'Register to F2F Bank' })).toBeVisible();
  });

  /** TC-REG-04 | Средний */
  test('TC-REG-04: регистрация с невалидным email', async ({ page }) => {
    await page.goto('/register');
    await fillRegistrationForm(page, defaultUser({ email: 'not-an-email' }));
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: 'Register to F2F Bank' })).toBeVisible();
  });
});
