# F2F Bank — Playwright E2E

End-to-end тесты для [F2F Bank](http://localhost): регистрация, авторизация, переводы, баланс, транзакции, edge- и security-сценарии.

**Автор:** Nick Pavlovskij (`npavlovskij`)

---

## Требования

| Инструмент | Версия |
|------------|--------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | актуальная |
| [Node.js](https://nodejs.org/) | 18+ |
| Git | любая |

---

## Запуск приложения

```bash
git clone <ссылка-на-репозиторий>
cd f2f-bank-tests

docker compose up -d --build
```

Приложение доступно по адресу **http://localhost**.

Остановка:

```bash
docker compose down
```

Сброс данных БД:

```bash
docker compose down -v
```

---

## Запуск тестов

Установка зависимостей (один раз):

```bash
npm install
npx playwright install chromium
```

### Основные команды

| Команда | Описание |
|---------|----------|
| `npm test` | полный прогон (67 тестов) |
| `npm run test:ui` | UI-режим Playwright (отладка) |
| `npm run test:report` | HTML-отчёт после прогона |
| `npm run test:smoke` | только `@critical` |
| `npm run test:high` | `@critical` + `@high` |
| `npm run test:auth` | проект `logged-out` |
| `npm run test:logged-in` | setup + авторизованные тесты |

Пример:

```bash
docker compose up -d
npm test
npm run test:report
```

### Структура Playwright

| Project | Назначение |
|---------|------------|
| `setup` | регистрация + login → `playwright/.auth/user.json` |
| `logged-out` | гостевые сценарии, login, register, validation, security |
| `logged-in` | сценарии с `storageState` (transfer, balance, profile и др.) |

Конфигурация: `playwright.config.ts` — TypeScript, Chromium, `baseURL: 'http://localhost'`.

---

## Сценарии и приоритеты

**67 автотестов**, **64 тест-кейса** в `NOTES.md` (№1–№64).

Приоритеты: **Критический** → **Высокий** → **Средний** → **Низкий**.

| Область | Файл | Ключевые TC | Приоритет |
|---------|------|-------------|-----------|
| Регистрация | `register.spec.ts` | TC-REG-01, TC-REG-02 (+alias) | Критический / Средний |
| Логин | `login.spec.ts` | TC-LOGIN-01…12 | Критический / Высокий / Средний |
| Гостевой доступ | `auth.spec.ts` | TC-AUTH-01…03, TC-TR-07 | Критический / Высокий |
| Валидация FE/BE | `validation.spec.ts` | TC-VAL-FE/B E-UI/API | Средний / Высокий |
| Logout | `logout.spec.ts` | TC-LOGOUT-01…02 | Высокий |
| API | `api.spec.ts` | TC-API-01 | Высокий |
| Профиль | `profile.spec.ts` | TC-PR-01…04 (unicode) | Высокий / Средний |
| Навигация | `nav.spec.ts` | TC-NAV-01…02 | Средний / Высокий |
| Transfer | `transfer.spec.ts` | TC-TR-01…06, TC-TR-13 (XSS) | Критический / Высокий / Средний |
| Balance | `balance.spec.ts` | TC-BAL-01…04 | Критический / Высокий / Средний |
| Transactions | `transactions.spec.ts` | TC-TX-01…04 | Высокий / Средний |
| Wallet edge | `wallet-edge.spec.ts` | TC-TR-08…12, TC-BAL-05, TC-TX-05…07, TC-WALLET-01 | Высокий / Средний / Низкий |
| Security | `security.spec.ts` | TC-SEC-01…03 | Высокий / Средний |

Полное описание каждого кейса (шаги, входные данные, ожидаемый результат) — в **[NOTES.md](./NOTES.md)**.

### Находки

Подтверждённые баги и security gaps — в **[BUGS.md](./BUGS.md)**:

| ID | Суть | Тест |
|----|------|------|
| BUG-01 | Back после logout → bfcache `/` | TC-LOGOUT-02 (fails) |
| BUG-02 | Cookie `access_token` без HttpOnly | TC-SEC-01 (fails) |
| GAP-SEC-01 | Нет rate limiting на login | TC-SEC-02 (documenting) |

Ожидаемый результат полного прогона: **64 passed / 3 failed** (падающие тесты документируют BUG-01 и BUG-02).

---

## Структура тестов

```
tests/
  helpers/       # api, auth, wallet, amount-validation, fixtures
  pages/         # Page Object Model
  logged-out/    # auth, login, register, validation, security
  logged-in/     # transfer, balance, transactions, profile, nav, wallet-edge
playwright.config.ts
NOTES.md         # тест-кейсы
BUGS.md          # баги и gaps
```
