import { expect, type Locator, type Page } from '@playwright/test';
import type { TestUser } from '../helpers/types';

export class ProfilePage {
  readonly page: Page;
  readonly info: Locator;

  constructor(page: Page) {
    this.page = page;
    this.info = page.locator('.profile__info');
  }

  async goto() {
    await this.page.goto('/profile');
  }

  async expectProfileVisible() {
    await expect(this.page).toHaveURL(/\/profile/);
    await expect(this.info).toBeVisible();
  }

  async expectUser(user: Pick<TestUser, 'name' | 'surname' | 'email'>) {
    await expect(this.info).toContainText(`Name: ${user.name}`);
    await expect(this.info).toContainText(`Surname: ${user.surname}`);
    await expect(this.info).toContainText(`Email: ${user.email}`);
  }
}
