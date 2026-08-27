import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { test as setup, expect } from '@playwright/test';
import { registerAndLogin } from '../helpers/auth-helpers';
import { AUTH_FILE } from '../helpers/test-data';

setup('authenticate', async ({ page }) => {
  await registerAndLogin(page);
  await expect(page).toHaveURL('/');

  mkdirSync(dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
