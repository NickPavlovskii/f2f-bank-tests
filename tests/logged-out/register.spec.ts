import { test, expect } from '@playwright/test';
import { expectSnackbar } from '../helpers/assertions';
import { clearSession, defaultUser } from '../helpers/auth-helpers';
import { RegisterPage } from '../pages/register.page';

test.describe('Registration', () => {
  test.afterEach(async ({ page }) => {
    await clearSession(page);
  });

  /**
   * TC-REG-01 | Критический
   * Вход: Name, Surname, уникальный email, пароль Qwerty123!
   * Результат: URL `/login`, snackbar Registration successful
   */
  test('TC-REG-01: successful registration', {
    tag: ['@critical', '@register'],
    annotation: [
      { type: 'priority', description: 'Критический' },
      { type: 'input', description: 'Name, Surname, уникальный email, пароль Qwerty123!' },
      { type: 'expected', description: 'URL /login, snackbar Registration successful' },
    ],
  }, async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(defaultUser());

    await expect(page).toHaveURL(/\/login/);
    await expectSnackbar(page, 'Registration successful');
    await expect(page.getByRole('heading', { name: 'Login to F2F Bank' })).toBeVisible();
  });
});
