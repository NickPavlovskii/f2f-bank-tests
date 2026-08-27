import { test, expect } from '@playwright/test';
import { fetchProtectedUserApis } from '../helpers/api-helpers';
import { HTTP_OK } from '../helpers/test-data';

test.describe('Authenticated API', () => {
  test('TC-API-01: current/balance/transactions available with cookie', {
    tag: ['@high', '@api'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'GET /api/users/* с access_token из storageState' },
      { type: 'expected', description: '200 OK, тело ответа не пустое' },
    ],
  }, async ({ request }) => {
    const { currentUser, balance, transactions } = await fetchProtectedUserApis(request);

    expect(currentUser.status()).toBe(HTTP_OK);
    expect(balance.status()).toBe(HTTP_OK);
    expect(transactions.status()).toBe(HTTP_OK);

    const userBody = await currentUser.json();
    const balanceBody = await balance.json();

    expect(userBody).toHaveProperty('email');
    expect(balanceBody).toHaveProperty('amount');
  });
});
