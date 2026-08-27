import { apiTransfer } from '../helpers/api-helpers';
import { expectSnackbar } from '../helpers/assertions';
import { clearSession, registerAndLogin } from '../helpers/auth-helpers';
import { test, expect } from '../helpers/fixtures';
import {
  AMOUNT_OVERFLOW,
  AMOUNT_WITH_LEADING_ZEROS,
  AUTH_FILE,
  BULK_TRANSACTION_COUNT,
  HTTP_BAD_REQUEST,
  HTTP_OK,
  PARALLEL_TRANSFER_POOL,
  PARSED_LEADING_ZERO_AMOUNT,
  TOP_UP_AMOUNT,
  TRANSFER_AMOUNT_OVER_BALANCE,
  TRANSFER_FRACTIONAL_AMOUNT,
  TRANSFER_PURPOSE,
  VALID_PHONE,
} from '../helpers/test-data';
import {
  countApiTransactions,
  fundBalance,
  fundBalanceAndReload,
  readApiBalance,
  readHeaderBalance,
  seedDeposits,
} from '../helpers/wallet-helpers';
import { TransactionsPage } from '../pages/transactions.page';
import { TransferPage } from '../pages/transfer.page';

test.describe('Transfer edge cases', () => {
  /**
   * TC-TR-08 | Высокий | race / concurrency
   * Вход: баланс 100, два параллельных POST /transfer по 100
   * Результат: один 200, второй 400; баланс ≥ 0, не уходит в минус
   */
  test('TC-TR-08: parallel full-balance transfers allow only one success', {
    tag: ['@high', '@transfer', '@api', '@edge'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'Promise.all два transfer на весь баланс' },
      { type: 'expected', description: '200 + 400, balance ≥ 0' },
    ],
  }, async ({ page }) => {
    await clearSession(page);
    await registerAndLogin(page);

    await fundBalance(page.request, PARALLEL_TRANSFER_POOL);
    expect(await readApiBalance(page.request)).toBe(PARALLEL_TRANSFER_POOL);

    const [first, second] = await Promise.all([
      apiTransfer(page.request, VALID_PHONE, PARALLEL_TRANSFER_POOL, TRANSFER_PURPOSE),
      apiTransfer(page.request, VALID_PHONE, PARALLEL_TRANSFER_POOL, TRANSFER_PURPOSE),
    ]);

    const statuses = [first.status(), second.status()].sort((a, b) => a - b);
    expect(statuses).toEqual([HTTP_OK, HTTP_BAD_REQUEST]);

    const balance = await readApiBalance(page.request);
    expect(balance).toBeGreaterThanOrEqual(0);
    expect(balance).toBeLessThanOrEqual(PARALLEL_TRANSFER_POOL);
  });

  /**
   * TC-TR-09 | Средний
   * Вход: перевод дробной суммы 33.333
   * Результат: баланс до − после = сумма перевода (с допуском float)
   */
  test('TC-TR-09: fractional transfer amount updates balance consistently', {
    tag: ['@medium', '@transfer', '@edge'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: `amount ${TRANSFER_FRACTIONAL_AMOUNT}` },
      { type: 'expected', description: 'balance delta ≈ amount' },
    ],
  }, async ({ page, request }) => {
    await fundBalanceAndReload(page, request, TOP_UP_AMOUNT);
    const balanceBefore = await readApiBalance(request);

    const transferPage = new TransferPage(page);
    await transferPage.transfer(VALID_PHONE, TRANSFER_FRACTIONAL_AMOUNT, TRANSFER_PURPOSE);
    await transferPage.expectSuccess();

    const balanceAfter = await readApiBalance(request);
    expect(balanceAfter).toBeCloseTo(balanceBefore - TRANSFER_FRACTIONAL_AMOUNT, 2);
  });

  /**
   * TC-TR-10 | Средний
   * Вход: перевод огромной суммы (overflow / insufficient funds)
   * Результат: 400, баланс не ломается
   */
  test('TC-TR-10: huge transfer amount is rejected safely', {
    tag: ['@medium', '@transfer', '@api', '@edge'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: `amount ${AMOUNT_OVERFLOW}` },
      { type: 'expected', description: '400, balance без изменений' },
    ],
  }, async ({ request, balanceBefore }) => {
    const response = await apiTransfer(request, VALID_PHONE, AMOUNT_OVERFLOW, TRANSFER_PURPOSE);

    expect(response.status()).toBe(HTTP_BAD_REQUEST);
    expect(await readApiBalance(request)).toBe(balanceBefore);
  });

  /**
   * TC-TR-11 | Низкий
   * Вход: amount с ведущими нулями (007)
   * Результат: списывается 7, перевод успешен
   */
  test('TC-TR-11: amount with leading zeros is parsed as 7', {
    tag: ['@low', '@transfer', '@edge'],
    annotation: [
      { type: 'priority', description: 'Низкий' },
      { type: 'input', description: 'amount 007' },
      { type: 'expected', description: 'успешный transfer на 7' },
    ],
  }, async ({ page, request }) => {
    await fundBalanceAndReload(page, request, TOP_UP_AMOUNT);

    const balanceBefore = await readApiBalance(request);
    const transferPage = new TransferPage(page);
    await transferPage.transfer(VALID_PHONE, AMOUNT_WITH_LEADING_ZEROS, TRANSFER_PURPOSE);
    await transferPage.expectSuccess();

    expect(await readApiBalance(request)).toBeCloseTo(
      balanceBefore - PARSED_LEADING_ZERO_AMOUNT,
      5,
    );
  });

  /**
   * TC-TR-12 | Низкий
   * Вход: перевод на валидный телефон (у user в профиле phone не хранится)
   * Результат: фиксируем текущее поведение — self-check на бэкенде нет
   */
  test('TC-TR-12: transfer to arbitrary valid phone is allowed', {
    tag: ['@low', '@transfer', '@edge'],
    annotation: [
      { type: 'priority', description: 'Низкий' },
      { type: 'input', description: 'VALID_PHONE как получатель' },
      { type: 'expected', description: 'успех (отдельной политики self-transfer нет)' },
    ],
  }, async ({ request }) => {
    await fundBalance(request, PARSED_LEADING_ZERO_AMOUNT);
    const response = await apiTransfer(
      request,
      VALID_PHONE,
      PARSED_LEADING_ZERO_AMOUNT,
      TRANSFER_PURPOSE,
    );
    expect(response.status()).toBe(HTTP_OK);
  });
});

test.describe('Balance edge cases', () => {
  test.beforeEach(async ({ page }) => {
    await new TransactionsPage(page).goto();
  });

  /**
   * TC-BAL-05 | Низкий
   * Вход: дважды нажать Add balance при открытой модалке
   * Результат: одна модалка, не две
   */
  test('TC-BAL-05: double click Add balance opens single modal', {
    tag: ['@low', '@balance', '@edge'],
    annotation: [
      { type: 'priority', description: 'Низкий' },
      { type: 'input', description: 'двойной клик Add balance' },
      { type: 'expected', description: 'один .modal-overlay' },
    ],
  }, async ({ page }) => {
    const transactionsPage = new TransactionsPage(page);

    await transactionsPage.addBalanceButton.dblclick();
    await expect(transactionsPage.modalOverlay).toHaveCount(1);
    await expect(transactionsPage.modal).toBeVisible();
  });
});

test.describe('Transactions edge cases', () => {
  /**
   * TC-TX-05 | Средний
   * Вход: неудачный transfer (insufficient funds)
   * Результат: в API нет новой транзакции (нет optimistic UI)
   */
  test('TC-TX-05: failed transfer does not add API transaction', {
    tag: ['@medium', '@transactions', '@edge'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: 'transfer > balance' },
      { type: 'expected', description: 'count транзакций не растёт' },
    ],
  }, async ({ page, request }) => {
    await fundBalanceAndReload(page, request, TOP_UP_AMOUNT);
    const countBefore = await countApiTransactions(request);

    const transferPage = new TransferPage(page);
    await transferPage.transfer(VALID_PHONE, TRANSFER_AMOUNT_OVER_BALANCE, TRANSFER_PURPOSE);
    await expectSnackbar(page, 'Transfer failed. Check your balance.');

    expect(await countApiTransactions(request)).toBe(countBefore);
  });

  /**
   * TC-TX-06 | Средний
   * Вход: 30 deposit через API
   * Результат: все 30 строк в таблице (пагинации нет)
   */
  test('TC-TX-06: many transactions are all listed without pagination', {
    tag: ['@medium', '@transactions', '@edge'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: `${BULK_TRANSACTION_COUNT} deposits` },
      { type: 'expected', description: 'все строки в таблице' },
    ],
  }, async ({ page, request }) => {
    await clearSession(page);
    await registerAndLogin(page);
    const countBefore = await countApiTransactions(page.request);
    await seedDeposits(page.request, BULK_TRANSACTION_COUNT, 1);

    const transactionsPage = new TransactionsPage(page);
    await transactionsPage.goto();
    await transactionsPage.expectTransactionCount(countBefore + BULK_TRANSACTION_COUNT);
  });

  /**
   * TC-TX-07 | Низкий
   * Вход: одна операция, сравнить дату в UI и created_at в API
   * Результат: день в таблице совпадает с локальной датой операции
   */
  test('TC-TX-07: transaction date in table matches API created_at day', {
    tag: ['@low', '@transactions', '@edge'],
    annotation: [
      { type: 'priority', description: 'Низкий' },
      { type: 'input', description: 'deposit + сверка даты' },
      { type: 'expected', description: 'день в UI = день из API (local)' },
    ],
  }, async ({ page }) => {
    await clearSession(page);
    await registerAndLogin(page);
    await fundBalance(page.request, 1);

    const apiResponse = await page.request.get('/api/users/transactions');
    const [latest] = await apiResponse.json();
    const uiDate = await page.evaluate(
      (iso) => new Date(iso).toLocaleString(),
      latest.created_at,
    );

    const transactionsPage = new TransactionsPage(page);
    await transactionsPage.goto();
    await expect(transactionsPage.table.locator('tbody tr').first()).toContainText(uiDate);
  });
});

test.describe('Multi-tab balance', () => {
  /**
   * TC-WALLET-01 | Средний
   * Вход: два context с одним user, пополнение в одном
   * Результат: после reload в обоих вкладках баланс совпадает
   */
  test('TC-WALLET-01: balance syncs across tabs after reload', {
    tag: ['@medium', '@edge'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: '2 browser context, fund в первом' },
      { type: 'expected', description: 'после reload баланс одинаковый' },
    ],
  }, async ({ browser }) => {
    const contextA = await browser.newContext({ storageState: AUTH_FILE });
    const contextB = await browser.newContext({ storageState: AUTH_FILE });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      await fundBalance(contextA.request, TOP_UP_AMOUNT);

      await pageA.goto('/');
      await pageB.goto('/');
      await pageA.reload();
      await pageB.reload();

      const balanceA = await readHeaderBalance(pageA);
      const balanceB = await readHeaderBalance(pageB);
      expect(balanceA).toBe(balanceB);
      expect(balanceA).toBeGreaterThanOrEqual(TOP_UP_AMOUNT);
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
