import { test, expect } from '@playwright/test';
import { expectHomePage, expectSnackbar } from '../helpers/assertions';
import { clearSession, defaultUser, loginUser, registerUser } from '../helpers/auth-helpers';
import { uniqueEmailWithPlusAlias } from '../helpers/test-data';
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

  /**
   * TC-REG-02 | Средний
   * Вход: email с plus-алиасом (user+alias@test.com)
   * Результат: регистрация и последующий login с тем же email успешны
   */
  test('TC-REG-02: email with plus alias registers and allows login', {
    tag: ['@medium', '@register'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: 'email user+alias@test.com' },
      { type: 'expected', description: 'register OK, login с тем же email → home' },
    ],
  }, async ({ page }) => {
    const email = uniqueEmailWithPlusAlias();
    const user = await registerUser(page, { email });
    await loginUser(page, user.email, user.password);
    await expectHomePage(page);
  });
});
