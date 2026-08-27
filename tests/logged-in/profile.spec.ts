import { test, expect } from '@playwright/test';
import { getCurrentUser } from '../helpers/api-helpers';
import { loadSetupUser } from '../helpers/auth-helpers';
import { HTTP_OK } from '../helpers/test-data';
import { ProfilePage } from '../pages/profile.page';

test.describe('Profile', () => {
  /**
   * TC-PR-01 | Высокий
   * Вход: авторизованный пользователь, открыть /profile
   * Результат: видны name, surname, email текущего user
   */
  test('TC-PR-01: profile shows current user fields', {
    tag: ['@high', '@profile'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'авторизованный пользователь, /profile' },
      { type: 'expected', description: 'видны name, surname, email' },
    ],
  }, async ({ page }) => {
    const user = loadSetupUser();
    const profilePage = new ProfilePage(page);

    await profilePage.goto();
    await profilePage.expectProfileVisible();
    await profilePage.expectUser(user);
  });

  /**
   * TC-PR-02 | Высокий
   * Вход: данные из регистрации в login.setup
   * Результат: на /profile те же name, surname, email, что при register
   */
  test('TC-PR-02: profile data matches registration', {
    tag: ['@high', '@profile'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'user из login.setup' },
      { type: 'expected', description: 'name/surname/email как при регистрации' },
    ],
  }, async ({ page }) => {
    const user = loadSetupUser();
    const profilePage = new ProfilePage(page);

    await profilePage.goto();
    await profilePage.expectUser(user);
  });

  /**
   * TC-PR-03 | Высокий
   * Вход: GET /api/users/current с cookie из storageState
   * Результат: 200 OK, в теле есть name, surname, email
   */
  test('TC-PR-03: current user API returns profile fields', {
    tag: ['@high', '@profile', '@api'],
    annotation: [
      { type: 'priority', description: 'Высокий' },
      { type: 'input', description: 'GET /api/users/current с cookie' },
      { type: 'expected', description: '200, name/surname/email в ответе' },
    ],
  }, async ({ request }) => {
    const user = loadSetupUser();
    const response = await getCurrentUser(request);

    expect(response.status()).toBe(HTTP_OK);

    const body = await response.json();
    expect(body).toMatchObject({
      name: user.name,
      surname: user.surname,
      email: user.email,
    });
  });
});
