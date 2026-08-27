import { test, expect } from '@playwright/test';
import { expectHeaderBalance, expectSnackbar } from '../helpers/assertions';
import { clearSession, registerUser } from '../helpers/auth-helpers';
import {
  INVALID_EMAIL_FORMAT,
  SQL_INJECTION_EMAIL,
  TEST_PASSWORD,
  UNKNOWN_EMAIL,
  WRONG_PASSWORD,
} from '../helpers/test-data';
import { LoginPage } from '../pages/login.page';

test.describe('Login', () => {
  test.afterEach(async ({ page }) => {
    await clearSession(page);
  });

  /**
   * TC-LOGIN-01 | Критический
   * Вход: email и пароль зарегистрированного пользователя
   * Результат: URL `/`, форма Transfer, Balance в шапке
   */
  test('TC-LOGIN-01: успешный вход', {
    tag: ['@critical', '@login'],
    annotation: [
      { type: 'priority', description: 'Критический' },
      { type: 'input', description: 'email и пароль зарегистрированного пользователя' },
      { type: 'expected', description: 'URL /, форма Transfer, Balance в шапке' },
    ],
  }, async ({ page }) => {
    const user = await registerUser(page);
    const loginPage = new LoginPage(page);

    await loginPage.login(user.email, user.password);

    await expect(page).toHaveURL('/');
    await expect(page.getByText('Transfer by phone number')).toBeVisible();
    await expectHeaderBalance(page);
  });

  /**
   * TC-LOGIN-02 | Высокий
   * Вход: верный email, пароль wrong-password
   * Результат: snackbar Login failed, URL `/login`
   */
  test('TC-LOGIN-02: вход с неверным паролем', {
    tag: ['@high', '@login'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: `верный email, пароль ${WRONG_PASSWORD}` },
      { type: 'expected', description: 'snackbar Login failed, URL /login' },
    ],
  }, async ({ page }) => {
    const user = await registerUser(page);
    const loginPage = new LoginPage(page);

    await loginPage.login(user.email, WRONG_PASSWORD);

    await expectSnackbar(page, 'Login failed');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGIN-03 | Высокий
   * Вход: email nobody@test.com, любой пароль
   * Результат: snackbar Login failed, URL `/login`
   */
  test('TC-LOGIN-03: вход с несуществующим email', {
    tag: ['@high', '@login'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: `email ${UNKNOWN_EMAIL}, пароль ${TEST_PASSWORD}` },
      { type: 'expected', description: 'snackbar Login failed, URL /login' },
    ],
  }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(UNKNOWN_EMAIL, TEST_PASSWORD);

    await expectSnackbar(page, 'Login failed');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGIN-05 | Высокий
   * Вход: пустые email и password, нажать Login
   * Результат: форма не отправляется, URL `/login`
   */
  test('TC-LOGIN-05: вход с пустыми полями', {
    tag: ['@high', '@login'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'пустые email и password' },
      { type: 'expected', description: 'форма не отправляется, URL /login' },
    ],
  }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submit();

    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.heading).toBeVisible();
  });

  /**
   * TC-LOGIN-09 | Высокий
   * Вход: успешный вход, затем reload `/`
   * Результат: остаёмся на `/`, Balance виден
   */
  test('TC-LOGIN-09: сессия сохраняется после reload', {
    tag: ['@high', '@login'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'успешный вход, затем reload /' },
      { type: 'expected', description: 'остаёмся на /, Balance виден' },
    ],
  }, async ({ page }) => {
    const user = await registerUser(page);
    const loginPage = new LoginPage(page);

    await loginPage.login(user.email, user.password);
    await expect(page).toHaveURL('/');

    await page.reload();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('Transfer by phone number')).toBeVisible();
    await expectHeaderBalance(page);
  });

  /**
   * TC-LOGIN-10 | Высокий
   * Вход: email "' OR 1=1 --", любой пароль
   * Результат: вход не выполняется, snackbar Login failed
   */
  test('TC-LOGIN-10: SQL-инъекция в поле email', {
    tag: ['@high', '@login', '@security'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: `email ${SQL_INJECTION_EMAIL}` },
      { type: 'expected', description: 'вход не выполняется, Login failed' },
    ],
  }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(SQL_INJECTION_EMAIL, TEST_PASSWORD);

    await expectSnackbar(page, 'Login failed');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGIN-06 | Средний
   * Вход: email user@, любой пароль
   * Результат: браузерная валидация, URL `/login`
   */
  test('TC-LOGIN-06: вход с невалидным форматом email', {
    tag: ['@medium', '@login'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: `email ${INVALID_EMAIL_FORMAT}` },
      { type: 'expected', description: 'браузерная валидация, URL /login' },
    ],
  }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(INVALID_EMAIL_FORMAT, TEST_PASSWORD);

    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGIN-07 | Средний
   * Вход: email с пробелами по краям, верный пароль
   * Результат: Login failed (trim на фронте нет)
   */
  test('TC-LOGIN-07: вход с пробелами в email', {
    tag: ['@medium', '@login'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: 'email с пробелами по краям, верный пароль' },
      { type: 'expected', description: 'Login failed (trim на фронте нет)' },
    ],
  }, async ({ page }) => {
    const user = await registerUser(page);
    const loginPage = new LoginPage(page);

    await loginPage.login(`  ${user.email}  `, user.password);

    await expectSnackbar(page, 'Login failed');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGIN-08 | Средний
   * Вход: email в верхнем регистре, верный пароль
   * Результат: Login failed (email чувствителен к регистру)
   */
  test('TC-LOGIN-08: вход с другим регистром email', {
    tag: ['@medium', '@login'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: 'email в верхнем регистре, верный пароль' },
      { type: 'expected', description: 'Login failed (email чувствителен к регистру)' },
    ],
  }, async ({ page }) => {
    const user = await registerUser(page);
    const [local, domain] = user.email.split('@');
    const upperEmail = `${local.toUpperCase()}@${domain}`;
    const loginPage = new LoginPage(page);

    await loginPage.login(upperEmail, user.password);

    await expectSnackbar(page, 'Login failed');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGIN-04 | Низкий
   * Вход: на `/login` нажать ссылку Register page
   * Результат: переход на `/register`
   */
  test('TC-LOGIN-04: переход на регистрацию', {
    tag: ['@low', '@login'],
    annotation: [
      { type: 'priority', description: 'Низкий' },
      { type: 'input', description: 'на /login нажать Register page' },
      { type: 'expected', description: 'URL /register' },
    ],
  }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.registerLink.click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: 'Register to F2F Bank' })).toBeVisible();
  });
});
