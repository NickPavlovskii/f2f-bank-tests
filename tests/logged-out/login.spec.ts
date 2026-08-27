import { test, expect } from '@playwright/test';
import {
  expectHomePage,
  expectSnackbar,
  waitSnackbarHidden,
  watchForDialogs,
} from '../helpers/assertions';
import { clearSession, registerUser } from '../helpers/auth-helpers';
import {
  CSS_INJECTION_EMAIL,
  HTML_INJECTION_EMAIL,
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
   * Результат: URL `/`, форма перевода (phone/amount), Balance в шапке
   */
  test('TC-LOGIN-01: successful login', {
    tag: ['@critical', '@login'],
    annotation: [
      { type: 'priority', description: 'Критический' },
      { type: 'input', description: 'email и пароль зарегистрированного пользователя' },
      { type: 'expected', description: 'URL /, форма phone/amount, Balance в шапке' },
    ],
  }, async ({ page }) => {
    const user = await registerUser(page);
    const loginPage = new LoginPage(page);

    await loginPage.login(user.email, user.password);

    await expectHomePage(page);
  });

  /**
   * TC-LOGIN-02 | Высокий
   * Вход: верный email, пароль wrong-password
   * Результат: snackbar Login failed, URL `/login`
   */
  test('TC-LOGIN-02: login with wrong password', {
    tag: ['@high', '@login'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: `верный email, пароль ${WRONG_PASSWORD}` },
      { type: 'expected', description: 'snackbar Login failed, URL /login' },
    ],
  }, async ({ page }) => {
    const user = await registerUser(page);
    await waitSnackbarHidden(page);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(user.email, WRONG_PASSWORD);

    await expectSnackbar(page, 'Login failed');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGIN-03 | Высокий
   * Вход: email nobody@test.com, любой пароль
   * Результат: snackbar Login failed, URL `/login`
   */
  test('TC-LOGIN-03: login with unknown email', {
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
  test('TC-LOGIN-05: login with empty fields', {
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
   * Результат: остаёмся на `/`, форма и Balance видны
   */
  test('TC-LOGIN-09: session persists after reload', {
    tag: ['@high', '@login'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'успешный вход, затем reload /' },
      { type: 'expected', description: 'остаёмся на /, форма и Balance видны' },
    ],
  }, async ({ page }) => {
    const user = await registerUser(page);
    const loginPage = new LoginPage(page);

    await loginPage.login(user.email, user.password);
    await expectHomePage(page);

    await page.reload();

    await expectHomePage(page);
  });

  /**
   * TC-LOGIN-10 | Высокий
   * Вход: email "' OR 1=1 --", любой пароль
   * Результат: входа нет (браузерная валидация type=email или Login failed)
   */
  test('TC-LOGIN-10: SQL injection in email field', {
    tag: ['@high', '@login', '@security'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: `email ${SQL_INJECTION_EMAIL}` },
      { type: 'expected', description: 'вход не выполняется, URL /login' },
    ],
  }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(SQL_INJECTION_EMAIL, TEST_PASSWORD);

    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.heading).toBeVisible();
  });

  /**
   * TC-LOGIN-11 | Высокий
   * Вход: HTML/XSS payload в email (`<script>…</script>`)
   * Результат: нет JS-диалога, входа нет, URL `/login`
   * (type=email может заблокировать submit до API — это тоже ок)
   */
  test('TC-LOGIN-11: HTML injection in email field', {
    tag: ['@high', '@login', '@security'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: `email ${HTML_INJECTION_EMAIL}` },
      { type: 'expected', description: 'нет XSS-диалога, URL /login, входа нет' },
    ],
  }, async ({ page }) => {
    const dialogs = watchForDialogs(page);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(HTML_INJECTION_EMAIL, TEST_PASSWORD);

    dialogs.expectNone();
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.heading).toBeVisible();
  });

  /**
   * TC-LOGIN-12 | Высокий
   * Вход: CSS-injection payload в email
   * Результат: нет XSS-диалога, входа нет, страница логина не «сломана» стилями атаки
   */
  test('TC-LOGIN-12: CSS injection in email field', {
    tag: ['@high', '@login', '@security'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: `email ${CSS_INJECTION_EMAIL}` },
      { type: 'expected', description: 'нет XSS-диалога, URL /login, форма логина видна' },
    ],
  }, async ({ page }) => {
    const dialogs = watchForDialogs(page);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(CSS_INJECTION_EMAIL, TEST_PASSWORD);

    dialogs.expectNone();
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.heading).toBeVisible();
  });

  /**
   * TC-LOGIN-06 | Средний
   * Вход: email user@, любой пароль
   * Результат: браузерная валидация, URL `/login`
   */
  test('TC-LOGIN-06: login with invalid email format', {
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
   * Результат: входа нет — type=email часто блокирует submit, иначе Login failed (trim нет)
   */
  test('TC-LOGIN-07: login with spaces in email', {
    tag: ['@medium', '@login'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: 'email с пробелами по краям, верный пароль' },
      { type: 'expected', description: 'URL /login (валидация или Login failed)' },
    ],
  }, async ({ page }) => {
    const user = await registerUser(page);
    await waitSnackbarHidden(page);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(`  ${user.email}  `, user.password);

    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.heading).toBeVisible();
  });

  /**
   * TC-LOGIN-08 | Средний
   * Вход: email в верхнем регистре, верный пароль
   * Результат: Login failed (email чувствителен к регистру)
   */
  test('TC-LOGIN-08: login with different email case', {
    tag: ['@medium', '@login'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: 'email в верхнем регистре, верный пароль' },
      { type: 'expected', description: 'Login failed (email чувствителен к регистру)' },
    ],
  }, async ({ page }) => {
    const user = await registerUser(page);
    await waitSnackbarHidden(page);

    const [local, domain] = user.email.split('@');
    const upperEmail = `${local.toUpperCase()}@${domain}`;
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(upperEmail, user.password);

    await expectSnackbar(page, 'Login failed');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGIN-04 | Низкий
   * Вход: на `/login` нажать ссылку Register page
   * Результат: переход на `/register`
   */
  test('TC-LOGIN-04: navigate to registration page', {
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
