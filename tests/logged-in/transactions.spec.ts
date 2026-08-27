import { test, expect } from '@playwright/test';
import { getTransactions } from '../helpers/api-helpers';
import { clearSession, registerAndLogin } from '../helpers/auth-helpers';
import {
  HTTP_OK,
  TOP_UP_AMOUNT,
  TRANSFER_AMOUNT,
  TRANSFER_PURPOSE,
  VALID_PHONE,
} from '../helpers/test-data';
import { fundBalance } from '../helpers/wallet-helpers';
import { TransactionsPage } from '../pages/transactions.page';
import { TransferPage } from '../pages/transfer.page';

test.describe('Transactions', () => {
  /**
   * TC-TX-01 | Высокий
   * Вход: новый пользователь без операций
   * Результат: No transactions yet
   */
  test('TC-TX-01: new user sees empty transactions list', {
    tag: ['@high', '@transactions'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'свежий user после register+login' },
      { type: 'expected', description: 'No transactions yet' },
    ],
  }, async ({ page }) => {
    await clearSession(page);
    await registerAndLogin(page);

    const transactionsPage = new TransactionsPage(page);
    await transactionsPage.goto();
    await transactionsPage.expectEmpty();
  });

  /**
   * TC-TX-02 | Высокий
   * Вход: после пополнения и перевода
   * Результат: в таблице обе операции с суммами
   */
  test('TC-TX-02: deposit and withdrawal appear in transactions table', {
    tag: ['@high', '@transactions'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'add balance + transfer' },
      { type: 'expected', description: '2 строки в таблице' },
    ],
  }, async ({ page }) => {
    await clearSession(page);
    await registerAndLogin(page);
    await fundBalance(page.request, TOP_UP_AMOUNT);

    const transferPage = new TransferPage(page);
    await transferPage.goto();
    await transferPage.transfer(VALID_PHONE, TRANSFER_AMOUNT, TRANSFER_PURPOSE);
    await transferPage.expectSuccess();

    const transactionsPage = new TransactionsPage(page);
    await transactionsPage.goto();
    await transactionsPage.expectTransactionCount(2);
    await transactionsPage.expectTransactionWithAmount(TOP_UP_AMOUNT);
    await transactionsPage.expectTransactionWithAmount(TRANSFER_AMOUNT);
  });

  /**
   * TC-TX-03 | Средний
   * Вход: reload /transactions
   * Результат: список сохраняется (данные с API)
   */
  test('TC-TX-03: transactions persist after reload', {
    tag: ['@medium', '@transactions'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: 'reload после пополнения' },
      { type: 'expected', description: 'та же запись в таблице' },
    ],
  }, async ({ page }) => {
    await clearSession(page);
    await registerAndLogin(page);
    await fundBalance(page.request, TOP_UP_AMOUNT);

    const transactionsPage = new TransactionsPage(page);
    await transactionsPage.goto();
    await transactionsPage.expectTransactionWithAmount(TOP_UP_AMOUNT);

    await page.reload();
    await transactionsPage.expectVisible();
    await transactionsPage.expectTransactionWithAmount(TOP_UP_AMOUNT);
  });

  /**
   * TC-TX-04 | Высокий
   * Вход: GET /api/users/transactions с cookie
   * Результат: 200, массив
   */
  test('TC-TX-04: transactions API returns array with cookie', {
    tag: ['@high', '@transactions', '@api'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'GET /api/users/transactions' },
      { type: 'expected', description: '200, массив' },
    ],
  }, async ({ request }) => {
    await fundBalance(request, TOP_UP_AMOUNT);

    const response = await getTransactions(request);
    expect(response.status()).toBe(HTTP_OK);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('amount');
    expect(body[0]).toHaveProperty('transaction_type');
    expect(body[0]).toHaveProperty('transaction_status');
  });
});
