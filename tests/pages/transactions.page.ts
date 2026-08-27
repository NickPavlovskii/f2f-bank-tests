import { expect, type Locator, type Page } from '@playwright/test';

export class TransactionsPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Transactions' });
  }

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/transactions/);
    await expect(this.heading).toBeVisible();
  }
}
