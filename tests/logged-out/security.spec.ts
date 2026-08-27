import { test, expect } from '@playwright/test';
import { apiLogin, apiRegister } from '../helpers/api-helpers';
import { clearSession, registerUser } from '../helpers/auth-helpers';
import {
  ACCESS_TOKEN_COOKIE,
  defaultUser,
  FAILED_LOGIN_ATTEMPTS,
  HTTP_CREATED,
  HTTP_TOO_MANY_REQUESTS,
  HTTP_UNAUTHORIZED,
  WRONG_PASSWORD,
} from '../helpers/test-data';
import { LoginPage } from '../pages/login.page';

test.describe('Security', () => {
  test.afterEach(async ({ page }) => {
    await clearSession(page);
  });

  /**
   * TC-SEC-01 | Высокий | acceptance
   * Вход: успешный login
   * Результат: access_token cookie с HttpOnly и SameSite
   * Регрессия: упадёт, если при рефакторинге снимут защитные флаги cookie
   */
  test('TC-SEC-01: login cookie has HttpOnly and SameSite flags', {
    tag: ['@high', '@security', '@login'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'успешный UI login' },
      { type: 'expected', description: 'access_token: HttpOnly + SameSite Lax|Strict' },
    ],
  }, async ({ page }) => {
    const user = await registerUser(page);
    const loginPage = new LoginPage(page);
    await loginPage.login(user.email, user.password);
    await expect(page).toHaveURL('/');

    const sessionCookie = (await page.context().cookies()).find(
      (cookie) => cookie.name === ACCESS_TOKEN_COOKIE,
    );
    expect(sessionCookie, `cookie ${ACCESS_TOKEN_COOKIE} must be set`).toBeDefined();
    expect(sessionCookie!.httpOnly).toBe(true);
    expect(['Lax', 'Strict']).toContain(sessionCookie!.sameSite);
  });

  /**
   * TC-SEC-02 | Средний | security gap (documenting test)
   * Вход: N неудачных POST /login подряд
   * Результат: все 401, нет 429 — фиксируем отсутствие rate limiting
   * При внедрении защиты assertion на отсутствие 429 упадёт → обновить тест на позитивную проверку
   */
  test('TC-SEC-02: repeated failed logins are not rate-limited (documents gap)', {
    tag: ['@medium', '@security', '@login', '@api', '@finding'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: `${FAILED_LOGIN_ATTEMPTS}× POST /login с неверным паролем` },
      {
        type: 'finding',
        description: 'rate limiting отсутствует; при появлении 429 обновить тест на позитивную проверку',
      },
    ],
  }, async ({ request }) => {
    const user = defaultUser();
    const registerResponse = await apiRegister(request, user);
    expect(registerResponse.status()).toBe(HTTP_CREATED);

    const statuses: number[] = [];
    for (let i = 0; i < FAILED_LOGIN_ATTEMPTS; i++) {
      const response = await apiLogin(request, user.email, WRONG_PASSWORD);
      statuses.push(response.status());
    }

    expect(statuses.every((status) => status === HTTP_UNAUTHORIZED)).toBe(true);
    expect(statuses).not.toContain(HTTP_TOO_MANY_REQUESTS);
  });
});
