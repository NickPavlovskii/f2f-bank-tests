import { test, expect } from '@playwright/test';
import { expectHomePage } from '../helpers/assertions';
import { HeaderPage } from '../pages/header.page';

/**
 * Использует storageState из login.setup.ts.
 * Каждый тест получает новый browser context с копией cookies —
 * logout в одном тесте не ломает соседние.
 */
test.describe('Logout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expectHomePage(page);
  });

  test('TC-LOGOUT-01: logout redirects to login', {
    tag: ['@high', '@logout'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'авторизованный пользователь (storageState), Logout' },
      { type: 'expected', description: 'редирект на /login; повторный / тоже на /login' },
    ],
  }, async ({ page }) => {
    const header = new HeaderPage(page);

    await header.logout();
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-LOGOUT-02 | Высокий
   * Вход: Logout → Back в браузере
   * Результат: защищённый экран недоступен, URL `/login`
   */
  test('TC-LOGOUT-02: browser Back after logout', {
    tag: ['@high', '@logout', '@security'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'Logout → Back в браузере' },
      { type: 'expected', description: 'редирект на /login, защищённый экран недоступен' },
    ],
  }, async ({ page }) => {
    const header = new HeaderPage(page);

    await header.logout();
    await expect(page).toHaveURL(/\/login/);

    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
  });
});
