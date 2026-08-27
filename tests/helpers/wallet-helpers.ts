import type { APIRequestContext, Page } from '@playwright/test';
import { apiAddBalance, getBalance } from './api-helpers';
import { HTTP_OK } from './test-data';
import type { BalanceResponse } from './types';

export async function fundBalance(request: APIRequestContext, amount: number): Promise<void> {
  const response = await apiAddBalance(request, amount);
  if (response.status() !== HTTP_OK) {
    throw new Error(`Failed to fund balance: ${response.status()} ${await response.text()}`);
  }
}

export async function fundBalanceAndReload(
  page: Page,
  request: APIRequestContext,
  amount: number,
): Promise<void> {
  await fundBalance(request, amount);
  await page.reload();
}

export async function readApiBalance(request: APIRequestContext): Promise<number> {
  const response = await getBalance(request);
  const body = (await response.json()) as BalanceResponse;
  return body.amount;
}

export async function readHeaderBalance(page: Page): Promise<number> {
  const text = await page.locator('header').innerText();
  const match = text.match(/Balance:\s*([\d.]+)/);
  if (match) {
    return Number(match[1]);
  }
  throw new Error(`Balance not found in header: ${text}`);
}
