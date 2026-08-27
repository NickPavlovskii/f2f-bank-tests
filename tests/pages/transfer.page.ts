import { expect, type Locator, type Page } from '@playwright/test';

export class TransferPage {
  readonly page: Page;
  readonly phoneInput: Locator;
  readonly amountInput: Locator;
  readonly purposeInput: Locator;
  readonly sendButton: Locator;
  readonly phoneError: Locator;
  readonly newTransferButton: Locator;
  readonly successText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.phoneInput = page.locator('input[name="phone"]');
    this.amountInput = page.locator('input[name="amount"]');
    this.purposeInput = page.locator('input[name="purpose"]');
    this.sendButton = page.getByRole('button', { name: 'Send' });
    this.phoneError = page.locator('.field-error');
    this.newTransferButton = page.getByRole('button', { name: 'New transfer' });
    this.successText = page.locator('.success-block .success-text');
  }

  async expectSuccess() {
    await expect(this.page.locator('.snackbar.success')).toContainText('Transfer completed successfully');
    await expect(this.successText).toBeVisible();
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.phoneInput).toBeVisible();
  }

  async fill(phone: string, amount: string | number, purpose: string) {
    await this.phoneInput.fill(phone);
    await this.amountInput.fill(String(amount));
    await this.purposeInput.fill(purpose);
  }

  async submit() {
    await this.sendButton.click();
  }

  async transfer(phone: string, amount: string | number, purpose: string) {
    await this.fill(phone, amount, purpose);
    await this.submit();
  }

  async expectFormVisible() {
    await expect(this.phoneInput).toBeVisible();
    await expect(this.amountInput).toBeVisible();
    await expect(this.purposeInput).toBeVisible();
  }

  async expectFormEmpty() {
    await expect(this.phoneInput).toHaveValue('');
    await expect(this.purposeInput).toHaveValue('');
  }
}
