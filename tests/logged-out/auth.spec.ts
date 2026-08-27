import { test, expect } from '@playwright/test';
import { fetchProtectedUserApis } from '../helpers/api-helpers';
import { HTTP_UNAUTHORIZED } from '../helpers/test-data';

test.describe('Guest access', () => {
  /**
   * TC-AUTH-01 | Критический
   * Вход: открыть `/` без cookie сессии
   * Результат: редирект на `/login`
   */
  test('TC-AUTH-01: guest cannot open home page', {
    tag: ['@critical', '@auth'],
    annotation: [
      { type: 'priority', description: 'Критический' },
      { type: 'input', description: 'открыть / без cookie сессии' },
      { type: 'expected', description: 'редирект на /login' },
    ],
  }, async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-AUTH-02 | Высокий
   * Вход: открыть `/profile` и `/transactions` без авторизации
   * Результат: в обоих случаях редирект на `/login`
   */
  test('TC-AUTH-02: guest cannot open profile and transactions', {
    tag: ['@high', '@auth'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'открыть /profile и /transactions без авторизации' },
      { type: 'expected', description: 'редирект на /login' },
    ],
  }, async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/transactions');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-AUTH-03 | Высокий
   * Вход: GET `/api/users/current`, `/balance`, `/transactions` без cookie
   * Результат: ответ 401 Unauthorized для всех трёх эндпоинтов
   */
  test('TC-AUTH-03: API returns 401 without cookie', {
    tag: ['@high', '@auth', '@api'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'GET /api/users/* без cookie' },
      { type: 'expected', description: '401 Unauthorized' },
    ],
  }, async ({ request }) => {
    const { currentUser, balance, transactions } = await fetchProtectedUserApis(request);

    expect(currentUser.status(), 'GET /api/users/current').toBe(HTTP_UNAUTHORIZED);
    expect(balance.status(), 'GET /api/users/balance').toBe(HTTP_UNAUTHORIZED);
    expect(transactions.status(), 'GET /api/users/transactions').toBe(HTTP_UNAUTHORIZED);
  });
});
