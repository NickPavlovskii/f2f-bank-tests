import { apiAddBalance, getBalance } from '../helpers/api-helpers';
import { expectHeaderBalance } from '../helpers/assertions';
import { test, expect } from '../helpers/fixtures';
import {
  HTTP_OK,
  INVALID_NON_POSITIVE_AMOUNTS,
  TOP_UP_AMOUNT,
} from '../helpers/test-data';
import type { BalanceResponse } from '../helpers/types';
import { readApiBalance } from '../helpers/wallet-helpers';
import { TransactionsPage } from '../pages/transactions.page';

test.describe('Add balance', () => {
  test.beforeEach(async ({ page }) => {
    const transactionsPage = new TransactionsPage(page);
    await transactionsPage.goto();
  });

  /**
   * TC-BAL-01 | Критический
   * Вход: пополнить на валидную сумму через UI
   * Результат: баланс в шапке вырос, в списке есть пополнение
   */
  test('TC-BAL-01: add balance increases header balance and transaction list', {
    tag: ['@critical', '@balance'],
    annotation: [
      { type: 'priority', description: 'Критический' },
      { type: 'input', description: `Add balance ${TOP_UP_AMOUNT}` },
      { type: 'expected', description: 'Balance ↑, deposit в таблице' },
    ],
  }, async ({ page, balanceBefore }) => {
    const transactionsPage = new TransactionsPage(page);

    await transactionsPage.addBalance(TOP_UP_AMOUNT);

    await expectHeaderBalance(page, balanceBefore + TOP_UP_AMOUNT);
    await transactionsPage.expectTransactionWithAmount(TOP_UP_AMOUNT);
  });

  for (const amount of INVALID_NON_POSITIVE_AMOUNTS) {
    /**
     * TC-BAL-02 | Высокий
     * Вход: сумма ≤ 0 в модалке
     * Результат: запрос не уходит, баланс не меняется
     */
    test(`TC-BAL-02: amount ${amount} does not add balance`, {
      tag: ['@high', '@balance', '@validation'],
      annotation: [
        { type: 'priority', description: 'Высокий' },
        { type: 'input', description: `amount ${amount}` },
        { type: 'expected', description: 'баланс без изменений' },
      ],
    }, async ({ page, request, balanceBefore }) => {
      const transactionsPage = new TransactionsPage(page);

      await transactionsPage.openAddBalanceModal();
      await transactionsPage.modalAmountInput.fill(String(amount));
      await transactionsPage.modalAddButton.click();
      await expect(transactionsPage.modal).toBeVisible();

      expect(await readApiBalance(request)).toBe(balanceBefore);
    });
  }

  /**
   * TC-BAL-03 | Средний
   * Вход: закрыть модалку без Submit
   * Результат: баланс без изменений
   */
  test('TC-BAL-03: cancel modal keeps balance unchanged', {
    tag: ['@medium', '@balance'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: 'Cancel в модалке Add balance' },
      { type: 'expected', description: 'баланс не меняется' },
    ],
  }, async ({ page, request, balanceBefore }) => {
    const transactionsPage = new TransactionsPage(page);

    await transactionsPage.openAddBalanceModal();
    await transactionsPage.modalAmountInput.fill(String(TOP_UP_AMOUNT));
    await transactionsPage.closeAddBalanceModal();

    expect(await readApiBalance(request)).toBe(balanceBefore);
  });

  /**
   * TC-BAL-04 | Высокий
   * Вход: POST /api/users/balance/add с cookie
   * Результат: 200 { result: ok }, GET balance отражает сумму
   */
  test('TC-BAL-04: add balance API returns ok and updates balance', {
    tag: ['@high', '@balance', '@api'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'POST /api/users/balance/add' },
      { type: 'expected', description: '200, balance обновлён' },
    ],
  }, async ({ request, balanceBefore }) => {
    const response = await apiAddBalance(request, TOP_UP_AMOUNT);

    expect(response.status()).toBe(HTTP_OK);
    expect(await response.json()).toEqual({ result: 'ok' });

    const balanceResponse = await getBalance(request);
    const body = (await balanceResponse.json()) as BalanceResponse;
    expect(body.amount).toBe(balanceBefore + TOP_UP_AMOUNT);
  });
});
