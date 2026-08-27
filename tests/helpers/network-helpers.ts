import type { Page, Request, Response } from '@playwright/test';
import { expect } from '@playwright/test';
import { AUTH_API, TRANSFER_API } from './test-data';

export function trackAuthApiCalls(page: Page) {
  const urls: string[] = [];
  const onRequest = (req: Request) => {
    if (AUTH_API.test(req.url()) && req.method() === 'POST') {
      urls.push(req.url());
    }
  };
  page.on('request', onRequest);

  return {
    expectNone: async () => {
      await expect
        .poll(() => urls.length, { intervals: [100, 200, 300], timeout: 1200 })
        .toBe(0);
    },
    dispose: () => {
      page.off('request', onRequest);
    },
    get urls() {
      return urls;
    },
  };
}

export async function waitForAuthResponse(
  page: Page,
  path: 'login' | 'register',
  action: () => Promise<void>,
): Promise<Response> {
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes(`/api/auth/${path}`) && res.request().method() === 'POST',
    ),
    action(),
  ]);
  return response;
}

export function trackTransferApiCalls(page: Page) {
  const urls: string[] = [];
  const onRequest = (req: Request) => {
    if (TRANSFER_API.test(req.url()) && req.method() === 'POST') {
      urls.push(req.url());
    }
  };
  page.on('request', onRequest);

  return {
    expectNone: async () => {
      await expect
        .poll(() => urls.length, { intervals: [100, 200, 300], timeout: 1200 })
        .toBe(0);
    },
    dispose: () => {
      page.off('request', onRequest);
    },
    get urls() {
      return urls;
    },
  };
}
