import { expect, type Page } from '@playwright/test';

export async function expectSnackbar(page: Page, text: string | RegExp) {
  const snackbar = page.locator('.snackbar');
  await expect(snackbar).toBeVisible();
  await expect(snackbar).toContainText(text);
}

export async function expectHeaderBalance(page: Page, amount?: string | number) {
  const header = page.locator('header');
  if (amount === undefined) {
    await expect(header).toContainText('Balance:');
    return;
  }
  await expect(header).toContainText(`Balance: ${amount}`);
}
