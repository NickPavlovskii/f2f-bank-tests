import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { apiAddBalance, getBalance, getTransactions } from './api-helpers';
import { HTTP_OK } from './test-data';
import type { BalanceResponse } from './types';

export async function fundBalance(request: APIRequestContext, amount: number): Promise<void> {
  const response = await apiAddBalance(request, amount);
  if (response.status() !== HTTP_OK) {
    throw new Error(`Failed to fund balance: ${response.status()} ${await response.text()}`);
  }
}

/** Пополнить через API и открыть home, чтобы UI подхватил баланс и форму transfer */
export async function fundBalanceAndReload(
  page: Page,
  request: APIRequestContext,
  amount: number,
): Promise<void> {
  await fundBalance(request, amount);
  await page.goto('/');
  await expect(page.locator('input[name="phone"]')).toBeVisible();
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

export async function countApiTransactions(request: APIRequestContext): Promise<number> {
  const response = await getTransactions(request);
  const body = await response.json();
  return Array.isArray(body) ? body.length : 0;
}

/** Несколько deposit-транзакций через API */
export async function seedDeposits(
  request: APIRequestContext,
  count: number,
  amountEach = 1,
): Promise<void> {
  for (let i = 0; i < count; i++) {
    await fundBalance(request, amountEach);
  }
}
