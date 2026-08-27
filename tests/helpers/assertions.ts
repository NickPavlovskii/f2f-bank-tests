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

export async function expectHomePage(page: Page) {
  await expect(page).toHaveURL('/');
  await expect(page.locator('input[name="phone"]')).toBeVisible();
  await expect(page.locator('input[name="amount"]')).toBeVisible();
  await expectHeaderBalance(page);
}

export function watchForDialogs(page: Page) {
  let dialogShown = false;
  page.on('dialog', async (dialog) => {
    dialogShown = true;
    await dialog.dismiss();
  });
  return {
    expectNone: () => expect(dialogShown, 'XSS dialog must not appear').toBe(false),
  };
}
