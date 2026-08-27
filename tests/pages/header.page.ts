import type { Locator, Page } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;
  readonly root: Locator;
  readonly mainLink: Locator;
  readonly profileLink: Locator;
  readonly transactionsLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('header');
    this.mainLink = this.root.getByRole('link', { name: 'Main' });
    this.profileLink = this.root.getByRole('link', { name: 'Profile' });
    this.transactionsLink = this.root.getByRole('link', { name: 'Transactions' });
    this.logoutButton = this.root.getByRole('button');
  }

  async openMain() {
    await this.mainLink.click();
  }

  async openProfile() {
    await this.profileLink.click();
  }

  async openTransactions() {
    await this.transactionsLink.click();
  }

  async logout() {
    await this.logoutButton.click();
  }
}
