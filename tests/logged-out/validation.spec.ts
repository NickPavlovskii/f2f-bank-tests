import { test, expect } from '@playwright/test';
import { apiLogin, apiRegister } from '../helpers/api-helpers';
import { expectSnackbar } from '../helpers/assertions';
import {
  clearSession,
  defaultUser,
  deleteTestUser,
  registerUser,
  uniqueEmail,
} from '../helpers/auth-helpers';
import { trackAuthApiCalls, waitForAuthResponse } from '../helpers/network-helpers';
import {
  HTTP_BAD_REQUEST,
  HTTP_CREATED,
  HTTP_UNAUTHORIZED,
  HTTP_UNPROCESSABLE,
  INVALID_EMAIL,
  INVALID_EMAIL_FORMAT,
  TEST_PASSWORD,
  UNKNOWN_EMAIL,
  WRONG_PASSWORD,
} from '../helpers/test-data';
import { LoginPage } from '../pages/login.page';
import { RegisterPage } from '../pages/register.page';


test.describe('Frontend validation (no API call)', () => {
  test.afterEach(async ({ page }) => {
    await clearSession(page);
  });

  /**
   * TC-VAL-FE-01 | Средний | frontend
   * Вход: на /login нажать Login с пустыми полями
   * Результат: URL /login, POST /api/auth/login не уходит
   */
  test('TC-VAL-FE-01: login empty fields does not call API', {
    tag: ['@medium', '@login', '@validation'],
    annotation: [
      { type: 'layer', description: 'frontend' },
      { type: 'expected', description: 'no POST /api/auth/login' },
    ],
  }, async ({ page }) => {
    const api = trackAuthApiCalls(page);
    try {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.submit();

      await expect(page).toHaveURL(/\/login/);
      await api.expectNone();
    } finally {
      api.dispose();
    }
  });

  /**
   * TC-VAL-FE-02 | Средний | frontend
   * Вход: email user@, любой пароль
   * Результат: браузерная валидация, POST /api/auth/login не уходит
   */
  test('TC-VAL-FE-02: login invalid email format does not call API', {
    tag: ['@medium', '@login', '@validation'],
    annotation: [
      { type: 'layer', description: 'frontend (type=email)' },
      { type: 'input', description: INVALID_EMAIL_FORMAT },
      { type: 'expected', description: 'no POST /api/auth/login' },
    ],
  }, async ({ page }) => {
    const api = trackAuthApiCalls(page);
    try {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(INVALID_EMAIL_FORMAT, TEST_PASSWORD);

      await expect(page).toHaveURL(/\/login/);
      await api.expectNone();
    } finally {
      api.dispose();
    }
  });

  /**
   * TC-VAL-FE-03 | Средний | frontend
   * Вход: на /register нажать Register с пустыми полями
   * Результат: URL /register, POST /api/auth/register не уходит
   */
  test('TC-VAL-FE-03: register empty fields does not call API', {
    tag: ['@medium', '@register', '@validation'],
    annotation: [
      { type: 'layer', description: 'frontend' },
      { type: 'expected', description: 'no POST /api/auth/register' },
    ],
  }, async ({ page }) => {
    const api = trackAuthApiCalls(page);
    try {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      await registerPage.submit();

      await expect(page).toHaveURL(/\/register/);
      await api.expectNone();
    } finally {
      api.dispose();
    }
  });

  /**
   * TC-VAL-FE-04 | Средний | frontend
   * Вход: email not-an-email + остальные поля
   * Результат: форма не уходит на API, URL /register
   */
  test('TC-VAL-FE-04: register invalid email does not call API', {
    tag: ['@medium', '@register', '@validation'],
    annotation: [
      { type: 'layer', description: 'frontend (type=email)' },
      { type: 'input', description: INVALID_EMAIL },
      { type: 'expected', description: 'no POST /api/auth/register' },
    ],
  }, async ({ page }) => {
    const api = trackAuthApiCalls(page);
    try {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      await registerPage.register(defaultUser({ email: INVALID_EMAIL }));

      await expect(page).toHaveURL(/\/register/);
      await api.expectNone();
    } finally {
      api.dispose();
    }
  });
});

test.describe('Backend validation via UI', () => {
  test.afterEach(async ({ page }) => {
    await clearSession(page);
  });

  /**
   * TC-VAL-BE-UI-01 | Высокий | backend via UI
   * Вход: верный email, пароль wrong-password
   * Результат: POST /api/auth/login → 401, snackbar Login failed, URL /login
   */
  test('TC-VAL-BE-UI-01: wrong password returns 401 from API', {
    tag: ['@high', '@login', '@validation'],
    annotation: [
      { type: 'layer', description: 'backend via UI' },
      { type: 'expected', description: 'POST /api/auth/login → 401, snackbar Login failed' },
    ],
  }, async ({ page }) => {
    const user = await registerUser(page);
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const response = await waitForAuthResponse(page, 'login', () =>
      loginPage.login(user.email, WRONG_PASSWORD),
    );

    expect(response.status()).toBe(HTTP_UNAUTHORIZED);
    await expectSnackbar(page, 'Login failed');
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TC-VAL-BE-UI-02 | Высокий | backend via UI
   * Вход: email nobody@test.com, любой пароль
   * Результат: POST /api/auth/login → 401, snackbar Login failed
   */
  test('TC-VAL-BE-UI-02: unknown email returns 401 from API', {
    tag: ['@high', '@login', '@validation'],
    annotation: [
      { type: 'layer', description: 'backend via UI' },
      { type: 'expected', description: 'POST /api/auth/login → 401' },
    ],
  }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const response = await waitForAuthResponse(page, 'login', () =>
      loginPage.login(UNKNOWN_EMAIL, TEST_PASSWORD),
    );

    expect(response.status()).toBe(HTTP_UNAUTHORIZED);
    await expectSnackbar(page, 'Login failed');
  });

  /**
   * TC-VAL-BE-UI-03 | Высокий | backend via UI
   * Вход: повторная регистрация с тем же email
   * Результат: POST /api/auth/register → 400, ошибка already exists
   */
  test('TC-VAL-BE-UI-03: duplicate email returns 400 from API', {
    tag: ['@high', '@register', '@validation'],
    annotation: [
      { type: 'layer', description: 'backend via UI' },
      { type: 'expected', description: 'POST /api/auth/register → 400, already exists' },
    ],
  }, async ({ page }) => {
    const user = defaultUser({ email: uniqueEmail() });
    try {
      const registerPage = new RegisterPage(page);

      await registerPage.goto();
      await registerPage.register(user);
      await expect(page).toHaveURL(/\/login/);

      await registerPage.goto();
      const response = await waitForAuthResponse(page, 'register', () =>
        registerPage.register(user),
      );

      expect(response.status()).toBe(HTTP_BAD_REQUEST);
      await expect(registerPage.error).toContainText(/already exists/i);
    } finally {
      await deleteTestUser(user.email);
    }
  });
});

test.describe('Backend validation via API (no UI)', () => {
  /**
   * TC-VAL-BE-API-01 | Высокий | backend API
   * Вход: POST /api/auth/register с валидным телом
   * Результат: 201 Created
   */
  test('TC-VAL-BE-API-01: register creates user with 201', {
    tag: ['@high', '@register', '@api', '@validation'],
    annotation: [
      { type: 'layer', description: 'backend API' },
      { type: 'expected', description: '201 Created' },
    ],
  }, async ({ request }) => {
    const response = await apiRegister(request, defaultUser());
    expect(response.status()).toBe(HTTP_CREATED);
  });

  /**
   * TC-VAL-BE-API-02 | Высокий | backend API
   * Вход: дважды POST /api/auth/register с одним email
   * Результат: второй ответ 400 already exists
   */
  test('TC-VAL-BE-API-02: duplicate email returns 400', {
    tag: ['@high', '@register', '@api', '@validation'],
    annotation: [
      { type: 'layer', description: 'backend API' },
      { type: 'expected', description: '400 User with this email already exists' },
    ],
  }, async ({ request }) => {
    const user = defaultUser({ email: uniqueEmail() });
    try {
      expect((await apiRegister(request, user)).status()).toBe(HTTP_CREATED);

      const duplicate = await apiRegister(request, user);
      expect(duplicate.status()).toBe(HTTP_BAD_REQUEST);
      expect(await duplicate.text()).toMatch(/already exists/i);
    } finally {
      await deleteTestUser(user.email);
    }
  });

  /**
   * TC-VAL-BE-API-03 | Высокий | backend API
   * Вход: POST /api/auth/login с верным email и неверным паролем
   * Результат: 401 Unauthorized
   */
  test('TC-VAL-BE-API-03: login with wrong password returns 401', {
    tag: ['@high', '@login', '@api', '@validation'],
    annotation: [
      { type: 'layer', description: 'backend API' },
      { type: 'expected', description: '401 Invalid email or password' },
    ],
  }, async ({ request }) => {
    const user = defaultUser();
    expect((await apiRegister(request, user)).status()).toBe(HTTP_CREATED);

    const response = await apiLogin(request, user.email, WRONG_PASSWORD);
    expect(response.status()).toBe(HTTP_UNAUTHORIZED);
  });

  /**
   * TC-VAL-BE-API-04 | Средний | backend (Pydantic)
   * Вход: POST /api/auth/login с пустым телом `{}`
   * Результат: 422 Unprocessable Entity
   */
  test('TC-VAL-BE-API-04: login without body fields returns 422', {
    tag: ['@medium', '@login', '@api', '@validation'],
    annotation: [
      { type: 'layer', description: 'backend (Pydantic)' },
      { type: 'expected', description: '422 Unprocessable Entity' },
    ],
  }, async ({ request }) => {
    const response = await request.post('/api/auth/login', { data: {} });
    expect(response.status()).toBe(HTTP_UNPROCESSABLE);
  });

  /**
   * TC-VAL-BE-API-05 | Средний | backend (Pydantic)
   * Вход: POST /api/auth/register с пустым телом `{}`
   * Результат: 422 Unprocessable Entity
   */
  test('TC-VAL-BE-API-05: register without body fields returns 422', {
    tag: ['@medium', '@register', '@api', '@validation'],
    annotation: [
      { type: 'layer', description: 'backend (Pydantic)' },
      { type: 'expected', description: '422 Unprocessable Entity' },
    ],
  }, async ({ request }) => {
    const response = await request.post('/api/auth/register', { data: {} });
    expect(response.status()).toBe(HTTP_UNPROCESSABLE);
  });

  /**
   * TC-VAL-BE-API-06 | Средний | backend (Pydantic)
   * Вход: POST /api/auth/register только с email (без name/surname/password)
   * Результат: 422 Unprocessable Entity
   */
  test('TC-VAL-BE-API-06: register with partial body returns 422', {
    tag: ['@medium', '@register', '@api', '@validation'],
    annotation: [
      { type: 'layer', description: 'backend (Pydantic)' },
      { type: 'input', description: 'только email, без name/surname/password' },
      { type: 'expected', description: '422 Unprocessable Entity' },
    ],
  }, async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: { email: uniqueEmail() },
    });
    expect(response.status()).toBe(HTTP_UNPROCESSABLE);
  });
});
