import type { APIRequestContext } from '@playwright/test';

export async function getCurrentUser(request: APIRequestContext) {
  return request.get('/api/users/current');
}

export async function getBalance(request: APIRequestContext) {
  return request.get('/api/users/balance');
}

export async function getTransactions(request: APIRequestContext) {
  return request.get('/api/users/transactions');
}

/** все защищённые user-эндпоинты одним вызовом */
export async function fetchProtectedUserApis(request: APIRequestContext) {
  return {
    currentUser: await getCurrentUser(request),
    balance: await getBalance(request),
    transactions: await getTransactions(request),
  };
}
