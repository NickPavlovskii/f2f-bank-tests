import { test, expect } from '@playwright/test';
import { expectHomePage } from '../helpers/assertions';
import { HeaderPage } from '../pages/header.page';
import { ProfilePage } from '../pages/profile.page';
import { TransactionsPage } from '../pages/transactions.page';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expectHomePage(page);
  });

  /**
   * TC-NAV-01 | Средний
   * Вход: авторизованный пользователь, навигация по шапке
   * Результат: Home → Profile → Transactions → Home без logout
   */
  test('TC-NAV-01: home profile transactions home via header', {
    tag: ['@medium', '@navigation'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: 'Main → Profile → Transactions → Main' },
      { type: 'expected', description: 'все страницы открываются, сессия сохраняется' },
    ],
  }, async ({ page }) => {
    const header = new HeaderPage(page);
    const profilePage = new ProfilePage(page);
    const transactionsPage = new TransactionsPage(page);

    await header.openProfile();
    await profilePage.expectProfileVisible();

    await header.openTransactions();
    await transactionsPage.expectVisible();

    await header.openMain();
    await expectHomePage(page);
  });

  /**
   * TC-NAV-02 | Высокий
   * Вход: Logout на /profile
   * Результат: редирект на /login
   */
  test('TC-NAV-02: logout from profile redirects to login', {
    tag: ['@high', '@navigation', '@logout'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'Logout с /profile' },
      { type: 'expected', description: 'редирект на /login' },
    ],
  }, async ({ page }) => {
    const header = new HeaderPage(page);

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile/);

    await header.logout();
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-NAV-02 | Высокий
   * Вход: Logout на /transactions
   * Результат: редирект на /login
   */
  test('TC-NAV-02: logout from transactions redirects to login', {
    tag: ['@high', '@navigation', '@logout'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'Logout с /transactions' },
      { type: 'expected', description: 'редирект на /login' },
    ],
  }, async ({ page }) => {
    const header = new HeaderPage(page);

    await page.goto('/transactions');
    await expect(page).toHaveURL(/\/transactions/);

    await header.logout();
    await expect(page).toHaveURL(/\/login/);
  });
});
