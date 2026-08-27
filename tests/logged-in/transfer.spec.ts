import { expectSnackbar, watchForDialogs } from '../helpers/assertions';
import {
  expectTransferRejectsEmptyAmount,
  expectTransferRejectsNonPositiveAmounts,
} from '../helpers/amount-validation';
import { test, expect } from '../helpers/fixtures';
import { trackTransferApiCalls } from '../helpers/network-helpers';
import {
  INVALID_PHONE_NO_PLUS,
  INVALID_PHONE_SHORT,
  TOP_UP_AMOUNT,
  TRANSFER_AMOUNT,
  TRANSFER_AMOUNT_OVER_BALANCE,
  TRANSFER_PURPOSE,
  VALID_PHONE,
  XSS_PURPOSE_PAYLOAD,
} from '../helpers/test-data';
import { fundBalanceAndReload, readApiBalance, readHeaderBalance } from '../helpers/wallet-helpers';
import { TransactionsPage } from '../pages/transactions.page';
import { TransferPage } from '../pages/transfer.page';

test.describe('Transfer', () => {
  test.beforeEach(async ({ page }) => {
    const transferPage = new TransferPage(page);
    await transferPage.goto();
  });

  /**
   * TC-TR-01 | Критический
   * Вход: валидный телефон, сумма ≤ баланса, purpose
   * Результат: успех, баланс уменьшился, в Transactions есть запись
   */
  test('TC-TR-01: successful transfer decreases balance and creates transaction', {
    tag: ['@critical', '@transfer'],
    annotation: [
      { type: 'priority', description: 'Критический' },
      { type: 'input', description: `${VALID_PHONE}, amount ${TRANSFER_AMOUNT}` },
      { type: 'expected', description: 'успех, баланс ↓, запись в Transactions' },
    ],
  }, async ({ page, request }) => {
    await fundBalanceAndReload(page, request, TOP_UP_AMOUNT);

    const balanceBefore = await readHeaderBalance(page);
    const transferPage = new TransferPage(page);

    await transferPage.transfer(VALID_PHONE, TRANSFER_AMOUNT, TRANSFER_PURPOSE);

    await transferPage.expectSuccess();

    const balanceAfter = await readHeaderBalance(page);
    expect(balanceAfter).toBe(balanceBefore - TRANSFER_AMOUNT);

    const transactionsPage = new TransactionsPage(page);
    await transactionsPage.goto();
    await transactionsPage.expectTransactionWithAmount(TRANSFER_AMOUNT);
  });

  /**
   * TC-TR-02 | Высокий
   * Вход: невалидный phone (пустой / без + / мало цифр)
   * Результат: FE-ошибка, POST /api/users/transfer не уходит
   */
  test('TC-TR-02: invalid phone does not call transfer API', {
    tag: ['@high', '@transfer', '@validation'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'пустой phone, без +, короткий phone' },
      { type: 'expected', description: 'field-error, no POST transfer' },
    ],
  }, async ({ page }) => {
    const transferPage = new TransferPage(page);
    const api = trackTransferApiCalls(page);

    try {
      await transferPage.fill('', TRANSFER_AMOUNT, TRANSFER_PURPOSE);
      await transferPage.submit();
      await expect(transferPage.phoneError).toContainText('Phone number is required');
      await api.expectNone();

      await transferPage.fill(INVALID_PHONE_NO_PLUS, TRANSFER_AMOUNT, TRANSFER_PURPOSE);
      await transferPage.phoneInput.blur();
      await expect(transferPage.phoneError).toContainText(/Must start with \+/);
      await transferPage.submit();
      await api.expectNone();

      await transferPage.fill(INVALID_PHONE_SHORT, TRANSFER_AMOUNT, TRANSFER_PURPOSE);
      await transferPage.phoneInput.blur();
      await expect(transferPage.phoneError).toContainText(/10–15 digits/);
      await transferPage.submit();
      await api.expectNone();
    } finally {
      api.dispose();
    }
  });

  /**
   * TC-TR-03 | Высокий
   * Вход: сумма 0 / отрицательная / пустая
   * Результат: snackbar или HTML5-валидация, перевод не проходит
   */
  test('TC-TR-03: invalid amount blocks transfer', {
    tag: ['@high', '@transfer', '@validation'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'amount 0, negative, empty' },
      { type: 'expected', description: 'snackbar / required, transfer не проходит' },
    ],
  }, async ({ page, request }) => {
    await fundBalanceAndReload(page, request, TOP_UP_AMOUNT);

    const transferPage = new TransferPage(page);
    const api = trackTransferApiCalls(page);

    try {
      await expectTransferRejectsNonPositiveAmounts(
        page,
        transferPage,
        api,
        VALID_PHONE,
        TRANSFER_PURPOSE,
      );
      await expectTransferRejectsEmptyAmount(
        transferPage,
        api,
        VALID_PHONE,
        TRANSFER_PURPOSE,
      );
    } finally {
      api.dispose();
    }
  });

  /**
   * TC-TR-04 | Высокий
   * Вход: сумма больше баланса
   * Результат: Transfer failed. Check your balance., баланс не меняется
   */
  test('TC-TR-04: transfer over balance shows error', {
    tag: ['@high', '@transfer'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: `amount ${TRANSFER_AMOUNT_OVER_BALANCE}` },
      { type: 'expected', description: 'Transfer failed snackbar, баланс без изменений' },
    ],
  }, async ({ page, request }) => {
    await fundBalanceAndReload(page, request, TOP_UP_AMOUNT);

    const balanceBefore = await readApiBalance(request);
    const transferPage = new TransferPage(page);

    await transferPage.transfer(VALID_PHONE, TRANSFER_AMOUNT_OVER_BALANCE, TRANSFER_PURPOSE);

    await expectSnackbar(page, 'Transfer failed. Check your balance.');
    expect(await readApiBalance(request)).toBe(balanceBefore);
  });

  /**
   * TC-TR-05 | Средний
   * Вход: пустой purpose
   * Результат: HTML5 required, API не вызывается
   */
  test('TC-TR-05: empty purpose blocks transfer', {
    tag: ['@medium', '@transfer', '@validation'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: 'валидный phone/amount, пустой purpose' },
      { type: 'expected', description: 'validity.valueMissing, no API' },
    ],
  }, async ({ page, request }) => {
    await fundBalanceAndReload(page, request, TOP_UP_AMOUNT);

    const transferPage = new TransferPage(page);
    const api = trackTransferApiCalls(page);

    try {
      await transferPage.fill(VALID_PHONE, TRANSFER_AMOUNT, '');
      await transferPage.submit();
      await expect(transferPage.purposeInput).toHaveJSProperty('validity.valueMissing', true);
      await api.expectNone();
    } finally {
      api.dispose();
    }
  });

  /**
   * TC-TR-06 | Средний
   * Вход: успешный перевод → New transfer
   * Результат: форма сброшена, можно снова вводить
   */
  test('TC-TR-06: new transfer resets form after success', {
    tag: ['@medium', '@transfer'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: 'успешный transfer → New transfer' },
      { type: 'expected', description: 'форма пустая и доступна' },
    ],
  }, async ({ page, request }) => {
    await fundBalanceAndReload(page, request, TOP_UP_AMOUNT);

    const transferPage = new TransferPage(page);
    await transferPage.transfer(VALID_PHONE, TRANSFER_AMOUNT, TRANSFER_PURPOSE);
    await transferPage.expectSuccess();

    await transferPage.newTransferButton.click();
    await transferPage.expectFormVisible();
    await transferPage.expectFormEmpty();
  });

  /**
   * TC-TR-13 | Средний | stored XSS guard
   * Вход: purpose с HTML/script payload
   * Результат: нет JS-диалога; payload не рендерится как HTML в Transactions
   * Примечание: purpose не сохраняется в transaction (28.2026) — тест на будущее
   */
  test('TC-TR-13: XSS payload in purpose does not execute', {
    tag: ['@medium', '@transfer', '@security'],
    annotation: [
      { type: 'priority', description: 'Средний' },
      { type: 'input', description: `purpose ${XSS_PURPOSE_PAYLOAD}` },
      { type: 'expected', description: 'нет alert, нет <script> в DOM таблицы' },
      {
        type: 'note',
        description: 'purpose не отображается в Transactions сейчас — проверяем отсутствие XSS при transfer',
      },
    ],
  }, async ({ page, request }) => {
    await fundBalanceAndReload(page, request, TOP_UP_AMOUNT);

    const dialogGuard = watchForDialogs(page);
    const transferPage = new TransferPage(page);
    await transferPage.transfer(VALID_PHONE, TRANSFER_AMOUNT, XSS_PURPOSE_PAYLOAD);
    await transferPage.expectSuccess();

    const transactionsPage = new TransactionsPage(page);
    await transactionsPage.goto();

    dialogGuard.expectNone();
    await expect(page.locator('.transactions__table')).not.toContainText('<script>');
    await expect(page.locator('.transactions__table')).not.toContainText('alert(1)');
  });
});
