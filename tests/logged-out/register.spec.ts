import { test, expect } from '@playwright/test';
import { expectSnackbar } from '../helpers/assertions';
import { clearSession, defaultUser, uniqueEmail } from '../helpers/auth-helpers';
import { INVALID_EMAIL } from '../helpers/test-data';
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
   * TC-REG-02 | Высокий
   * Вход: повторная регистрация с тем же email
   * Результат: ошибка already exists, URL `/register`
   */
  test('TC-REG-02: registration with existing email', {
    tag: ['@high', '@register'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'Повторная регистрация с тем же email' },
      { type: 'expected', description: 'Ошибка already exists, URL /register' },
    ],
  }, async ({ page }) => {
    const user = defaultUser({ email: uniqueEmail() });
    const registerPage = new RegisterPage(page);

    await registerPage.goto();
    await registerPage.register(user);
    await expect(page).toHaveURL(/\/login/);

    await registerPage.goto();
    await registerPage.register(user);

    await expect(registerPage.error).toContainText(/already exists/i);
    await expect(page).toHaveURL(/\/register/);
  });

  /**
   * TC-REG-03 | Средний
   * Вход: пустая форма, нажать Register
   * Результат: остаёмся на `/register`
   */
  test('TC-REG-03: registration with empty fields', {
    tag: ['@medium', '@register'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: 'Пустая форма, нажать Register' },
      { type: 'expected', description: 'Остаёмся на /register' },
    ],
  }, async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.submit();

    await expect(page).toHaveURL(/\/register/);
    await expect(registerPage.heading).toBeVisible();
  });

  /**
   * TC-REG-04 | Средний
   * Вход: email not-an-email
   * Результат: форма не отправляется, URL `/register`
   */
  test('TC-REG-04: registration with invalid email', {
    tag: ['@medium', '@register'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: `email: ${INVALID_EMAIL}` },
      { type: 'expected', description: 'Форма не отправляется, URL /register' },
    ],
  }, async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(defaultUser({ email: INVALID_EMAIL }));

    await expect(page).toHaveURL(/\/register/);
    await expect(registerPage.heading).toBeVisible();
  });
});
