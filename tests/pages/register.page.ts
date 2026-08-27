import type { Locator, Page } from '@playwright/test';
import type { TestUser } from '../helpers/types';

export class RegisterPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly surnameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly error: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('input[name="name"]');
    this.surnameInput = page.locator('input[name="surname"]');
    this.emailInput = page.locator('input[name="login"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.getByRole('button', { name: 'Register' });
    this.error = page.locator('.error');
    this.heading = page.getByRole('heading', { name: 'Register to F2F Bank' });
  }

  async goto() {
    await this.page.goto('/register');
  }

  async fill(user: TestUser) {
    await this.nameInput.fill(user.name);
    await this.surnameInput.fill(user.surname);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async register(user: TestUser) {
    await this.fill(user);
    await this.submit();
  }
}
