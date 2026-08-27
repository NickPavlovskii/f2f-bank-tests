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
  SQL_INJECTION_EMAIL,
  TEST_PASSWORD,
} from '../helpers/test-data';
import { LoginPage } from '../pages/login.page';

test.describe('Login', () => {
  test.afterEach(async ({ page }) => {
    await clearSession(page);
  });

  /**
   * TC-LOGIN-01 | Критический
   * Вход: email и пароль зарегистрированного пользователя
   * Результат: URL `/`, форма phone/amount, Balance в шапке
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

  /**
   * TC-LOGIN-10 | Высокий
   * Вход: email "' OR 1=1 --", любой пароль
   * Результат: входа нет
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
   * Вход: HTML/XSS payload в email
   * Результат: нет JS-диалога, входа нет
   */
  test('TC-LOGIN-11: HTML injection in email field', {
    tag: ['@high', '@login', '@security'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: `email ${HTML_INJECTION_EMAIL}` },
      { type: 'expected', description: 'нет XSS-диалога, URL /login' },
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
   * Результат: нет XSS-диалога, форма логина видна
   */
  test('TC-LOGIN-12: CSS injection in email field', {
    tag: ['@high', '@login', '@security'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: `email ${CSS_INJECTION_EMAIL}` },
      { type: 'expected', description: 'нет XSS-диалога, URL /login' },
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
   * TC-LOGIN-07 | Средний
   * Вход: email с пробелами по краям, верный пароль
   * Результат: остаёмся на /login (trim на фронте нет)
   */
  test('TC-LOGIN-07: login with spaces in email', {
    tag: ['@medium', '@login'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: 'email с пробелами по краям, верный пароль' },
      { type: 'expected', description: 'URL /login' },
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
   * Вход: email в другом регистре, верный пароль
   * Результат: Login failed (сравнение email case-sensitive)
   */
  test('TC-LOGIN-08: login with different email case', {
    tag: ['@medium', '@login'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: 'email в верхнем регистре, верный пароль' },
      { type: 'expected', description: 'Login failed' },
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
});
