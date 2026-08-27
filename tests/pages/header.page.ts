import type { Locator, Page } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;
  readonly root: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('header');
    this.logoutButton = this.root.getByRole('button');
  }

  async logout() {
    await this.logoutButton.click();
  }
}
