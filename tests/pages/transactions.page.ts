import { expect, type Locator, type Page } from '@playwright/test';

export class TransactionsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emptyState: Locator;
  readonly table: Locator;
  readonly addBalanceButton: Locator;
  readonly modal: Locator;
  readonly modalAmountInput: Locator;
  readonly modalAddButton: Locator;
  readonly modalCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Transactions' });
    this.emptyState = page.getByText('No transactions yet');
    this.table = page.locator('.transactions__table');
    this.addBalanceButton = page.getByRole('button', { name: 'Add balance' });
    this.modal = page.locator('.modal');
    this.modalAmountInput = this.modal.locator('input[name="balance"]');
    this.modalAddButton = this.modal.getByRole('button', { name: 'Add' });
    this.modalCancelButton = this.modal.getByRole('button', { name: 'Cancel' });
  }

  async goto() {
    await Promise.all([
      this.page.waitForResponse(
        (res) => res.url().includes('/api/users/transactions') && res.request().method() === 'GET',
      ),
      this.page.goto('/transactions'),
    ]);
    await this.expectVisible();
  }

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/transactions/);
    await expect(this.heading).toBeVisible();
  }

  async expectEmpty() {
    await expect(this.emptyState).toBeVisible();
    await expect(this.table.locator('tbody tr')).toHaveCount(0);
  }

  async openAddBalanceModal() {
    await this.addBalanceButton.click();
    await expect(this.modal).toBeVisible();
  }

  async closeAddBalanceModal() {
    await this.modalCancelButton.click();
    await expect(this.modal).toBeHidden();
  }

  async addBalance(amount: number) {
    await this.openAddBalanceModal();
    await this.modalAmountInput.fill(String(amount));
    await this.modalAddButton.click();
    await expect(this.modal).toBeHidden();
  }

  async expectTransactionCount(count: number) {
    await expect(this.table.locator('tbody tr')).toHaveCount(count);
  }

  async expectTransactionWithAmount(amount: number) {
    await expect(this.table.locator('tbody')).toContainText(String(amount));
  }
}
