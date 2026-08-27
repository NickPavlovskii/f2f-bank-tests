import { test as base } from '@playwright/test';
import { readApiBalance } from './wallet-helpers';

export const test = base.extend<{ balanceBefore: number }>({
  balanceBefore: async ({ request }, use) => {
    await use(await readApiBalance(request));
  },
});

export { expect } from '@playwright/test';
