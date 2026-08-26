import { test, expect } from '@playwright/test';
import { registerUser } from './helpers';

test.describe('Login', () => {
  /**
   * TC-LOGIN-01 | Критический
   * Вход: email и пароль Qwerty123! зарегистрированного пользователя
   * Результат: переход на /, форма Transfer by phone number, баланс в шапке
   */
  test('TC-LOGIN-01: успешный вход', async ({ page }) => {
    const user = await registerUser(page);

    await page.getByPlaceholder('Type your email').fill(user.email);
    await page.getByPlaceholder('Type your password').fill(user.password);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('Transfer by phone number')).toBeVisible();
    await expect(page.locator('header')).toContainText('Balance:');
  });

  /**
   * TC-AUTH-01 | Критический
   * Вход: открыть / без cookie сессии
   * Результат: редирект на /login
   */
  test('TC-AUTH-01: гость не попадает на главную', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGIN-02 | Высокий
   * Вход: верный email, пароль wrong-password
   * Результат: snackbar Login failed, URL остаётся /login
   */
  test('TC-LOGIN-02: вход с неверным паролем', async ({ page }) => {
    const user = await registerUser(page);

    await page.getByPlaceholder('Type your email').fill(user.email);
    await page.getByPlaceholder('Type your password').fill('wrong-password');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('.snackbar')).toContainText('Login failed');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGIN-03 | Высокий
   * Вход: email nobody@test.com, любой пароль
   * Результат: snackbar Login failed, перехода на главную нет
   */
  test('TC-LOGIN-03: вход с несуществующим email', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Type your email').fill('nobody@test.com');
    await page.getByPlaceholder('Type your password').fill('Qwerty123!');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('.snackbar')).toContainText('Login failed');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGIN-05 | Высокий
   * Вход: пустые email и password, нажать Login
   * Результат: форма не отправляется, URL остаётся /login
   */
  test('TC-LOGIN-05: вход с пустыми полями', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Login to F2F Bank' })).toBeVisible();
  });

  /**
   * TC-LOGIN-09 | Высокий
   * Вход: успешный вход, затем reload страницы /
   * Результат: пользователь остаётся на /, баланс в шапке, повторный логин не нужен
   */
  test('TC-LOGIN-09: сессия сохраняется после reload', async ({ page }) => {
    const user = await registerUser(page);

    await page.getByPlaceholder('Type your email').fill(user.email);
    await page.getByPlaceholder('Type your password').fill(user.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/');

    await page.reload();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('Transfer by phone number')).toBeVisible();
    await expect(page.locator('header')).toContainText('Balance:');
  });

  /**
   * TC-LOGIN-10 | Высокий
   * Вход: email "' OR 1=1 --", любой пароль
   * Результат: вход не выполняется, snackbar Login failed, URL /login
   */
  test('TC-LOGIN-10: SQL-инъекция в поле email', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Type your email').fill("' OR 1=1 --");
    await page.getByPlaceholder('Type your password').fill('Qwerty123!');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('.snackbar')).toContainText('Login failed');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-AUTH-02 | Высокий
   * Вход: открыть /profile и /transactions без авторизации
   * Результат: в обоих случаях редирект на /login
   */
  test('TC-AUTH-02: гость не попадает на профиль и транзакции', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/transactions');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-AUTH-03 | Высокий
   * Вход: GET /api/users/current, /balance, /transactions без cookie
   * Результат: ответ 401 Unauthorized для всех трёх эндпоинтов
   */
  test('TC-AUTH-03: API без cookie возвращает 401', async ({ request }) => {
    const currentUser = await request.get('/api/users/current');
    const balance = await request.get('/api/users/balance');
    const transactions = await request.get('/api/users/transactions');

    expect(currentUser.status()).toBe(401);
    expect(balance.status()).toBe(401);
    expect(transactions.status()).toBe(401);
  });

  /**
   * TC-LOGIN-06 | Средний
   * Вход: email user@, любой пароль
   * Результат: браузерная валидация блокирует отправку, URL /login
   */
  test('TC-LOGIN-06: вход с невалидным форматом email', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Type your email').fill('user@');
    await page.getByPlaceholder('Type your password').fill('Qwerty123!');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGIN-07 | Средний
   * Вход: email с пробелами "  user@test.com  ", верный пароль
   * Результат: Login failed (trim на фронте нет), URL /login
   */
  test('TC-LOGIN-07: вход с пробелами в email', async ({ page }) => {
    const user = await registerUser(page);

    await page.getByPlaceholder('Type your email').fill(`  ${user.email}  `);
    await page.getByPlaceholder('Type your password').fill(user.password);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('.snackbar')).toContainText('Login failed');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGIN-08 | Средний
   * Вход: email в верхнем регистре USER@TEST.COM, верный пароль
   * Результат: Login failed (email чувствителен к регистру), URL /login
   */
  test('TC-LOGIN-08: вход с другим регистром email', async ({ page }) => {
    const user = await registerUser(page);
    const [local, domain] = user.email.split('@');
    const upperEmail = `${local.toUpperCase()}@${domain}`;

    await page.getByPlaceholder('Type your email').fill(upperEmail);
    await page.getByPlaceholder('Type your password').fill(user.password);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('.snackbar')).toContainText('Login failed');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGIN-04 | Низкий
   * Вход: на /login нажать ссылку Register page
   * Результат: переход на /register, заголовок Register to F2F Bank
   */
  test('TC-LOGIN-04: переход на регистрацию', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Register page' }).click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: 'Register to F2F Bank' })).toBeVisible();
  });
});
