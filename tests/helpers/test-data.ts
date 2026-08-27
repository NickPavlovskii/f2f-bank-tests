import type { TestUser } from './types';

/** Путь к storageState после login.setup.ts */
export const AUTH_FILE = 'playwright/.auth/user.json';

export const TEST_PASSWORD = 'Qwerty123!';
export const TEST_USER_NAME = 'Nick';
export const TEST_USER_SURNAME = 'Pavlov';

export const INVALID_EMAIL = 'not-an-email';
export const INVALID_EMAIL_FORMAT = 'user@';
export const UNKNOWN_EMAIL = 'nobody@test.com';
export const WRONG_PASSWORD = 'wrong-password';
export const SQL_INJECTION_EMAIL = "' OR 1=1 --";

/** HTTP-статусы ответов API */
export const HTTP_OK = 200;
export const HTTP_UNAUTHORIZED = 401;

export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@test.com`;
}

export function defaultUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    name: TEST_USER_NAME,
    surname: TEST_USER_SURNAME,
    email: uniqueEmail(),
    password: TEST_PASSWORD,
    ...overrides,
  };
}
