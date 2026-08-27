import type { APIRequestContext } from '@playwright/test';
import type { TestUser } from './types';

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

export async function apiRegister(request: APIRequestContext, user: TestUser) {
  return request.post('/api/auth/register', {
    data: {
      name: user.name,
      surname: user.surname,
      email: user.email,
      password: user.password,
      role: 'user',
    },
  });
}

export async function apiLogin(request: APIRequestContext, email: string, password: string) {
  return request.post('/api/auth/login', {
    data: { email, password },
  });
}
