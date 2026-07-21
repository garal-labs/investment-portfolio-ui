# Manual Smoke Checklist

`@playwright/test` is not installed yet — see the Phase 1 apply-progress notes
for why. Until Phase 4 (task 4.3) decides whether to add real Playwright
specs, use this checklist to verify auth flows end-to-end against a running
backend.

## Route protection (Phase 1)

- [ ] Visiting `/dashboard`, `/movimientos`, `/analisis`, or `/ajustes`
      without a session cookie redirects to `/login` with no protected
      content flash.
- [ ] Visiting `/login`, `/register`, `/forgot-password`, or
      `/reset-password` renders normally with no session cookie.

## Full auth flow (Phase 2/3 — revisit once those land)

- [ ] Register → login → dashboard works end-to-end.
- [ ] Forgot-password → reset-password works end-to-end.
- [ ] Logout clears the session and redirects to `/login`.
