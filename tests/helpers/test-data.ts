import type { TestUser } from './types';

/** Путь к storageState после login.setup.ts */
export const AUTH_FILE = 'playwright/.auth/user.json';
/** Данные пользователя из login.setup.ts  */
export const SETUP_USER_FILE = 'playwright/.auth/setup-user.json';

export const TEST_PASSWORD = 'Qwerty123!';
export const TEST_USER_NAME = 'Nick';
export const TEST_USER_SURNAME = 'Pavlov';

export const INVALID_EMAIL = 'not-an-email';
export const INVALID_EMAIL_FORMAT = 'user@';
export const UNKNOWN_EMAIL = 'nobody@test.com';
export const WRONG_PASSWORD = 'wrong-password';
/** sql-injection payload в email */
export const SQL_INJECTION_EMAIL = "' OR 1=1 --";
/** XSS/HTML payload в email */
export const HTML_INJECTION_EMAIL = '<script>alert("xss")</script>';
/** CSS-injection payload в email */
export const CSS_INJECTION_EMAIL = 'test@test.com"><style>body{display:none}</style>';

/** HTTP-статусы ответов API */
export const HTTP_OK = 200;
export const HTTP_CREATED = 201;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_UNPROCESSABLE = 422;

/** POST login/register — для трекинга сетевых вызовов */
export const AUTH_API = /\/api\/auth\/(login|register)/;
/** POST transfer — для трекинга сетевых вызовов */
export const TRANSFER_API = /\/api\/users\/transfer/;

export const VALID_PHONE = '+7 999 123 45 67';
export const INVALID_PHONE_NO_PLUS = '79991234567';
export const INVALID_PHONE_SHORT = '+7123';
export const TRANSFER_PURPOSE = 'debt repayment';
export const TOP_UP_AMOUNT = 1000;
export const TRANSFER_AMOUNT = 100;
export const TRANSFER_AMOUNT_OVER_BALANCE = 999_999;
export const INVALID_AMOUNT_ZERO = 0;
export const INVALID_AMOUNT_NEGATIVE = -10;
export const INVALID_NON_POSITIVE_AMOUNTS = [INVALID_AMOUNT_ZERO, INVALID_AMOUNT_NEGATIVE] as const;
export const PARALLEL_TRANSFER_POOL = 100;
export const TRANSFER_FRACTIONAL_AMOUNT = 33.333;
export const AMOUNT_OVERFLOW = 9_999_999_999_999;
export const AMOUNT_WITH_LEADING_ZEROS = '007';
export const PARSED_LEADING_ZERO_AMOUNT = 7;
export const BULK_TRANSACTION_COUNT = 30;

/** Сколько неудачных логинов проверяем на отсутствие lockout */
export const FAILED_LOGIN_ATTEMPTS = 10;

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
