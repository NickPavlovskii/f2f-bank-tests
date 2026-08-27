import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { TransactionsPage } from '../pages/transactions.page';
import { TransferPage } from '../pages/transfer.page';
import { expectSnackbar } from './assertions';
import { INVALID_NON_POSITIVE_AMOUNTS } from './test-data';
import { readApiBalance } from './wallet-helpers';

/** Общий snackbar для amount ≤ 0 на transfer (TC-TR-03) и add balance (TC-BAL-02) */
export const NON_POSITIVE_AMOUNT_SNACKBAR = 'Amount must be greater than zero';

type TransferApiTracker = {
  expectNone: () => Promise<void>;
};

/** TC-TR-03: 0 и отрицательная сумма — snackbar, POST /transfer не уходит */
export async function expectTransferRejectsNonPositiveAmounts(
  page: Page,
  transferPage: TransferPage,
  api: TransferApiTracker,
  phone: string,
  purpose: string,
): Promise<void> {
  for (const amount of INVALID_NON_POSITIVE_AMOUNTS) {
    await transferPage.transfer(phone, amount, purpose);
    await expectSnackbar(page, NON_POSITIVE_AMOUNT_SNACKBAR);
    await api.expectNone();
  }
}

/** TC-TR-03: пустая сумма — HTML5 required, POST /transfer не уходит */
export async function expectTransferRejectsEmptyAmount(
  transferPage: TransferPage,
  api: TransferApiTracker,
  phone: string,
  purpose: string,
): Promise<void> {
  await transferPage.fill(phone, '', purpose);
  await transferPage.submit();
  await expect(transferPage.amountInput).toHaveJSProperty('validity.valueMissing', true);
  await api.expectNone();
}

/** TC-BAL-02: сумма ≤ 0 в модалке — баланс не меняется */
export async function expectAddBalanceRejectsNonPositiveAmount(
  transactionsPage: TransactionsPage,
  request: APIRequestContext,
  balanceBefore: number,
  amount: number,
): Promise<void> {
  await transactionsPage.openAddBalanceModal();
  await transactionsPage.modalAmountInput.fill(String(amount));
  await transactionsPage.modalAddButton.click();
  await expect(transactionsPage.modal).toBeVisible();
  expect(await readApiBalance(request)).toBe(balanceBefore);
}
