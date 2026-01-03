# Minty (working title) — Implementation Plan (Playwright-first, CLI-based personal finance ledger)

**Stack:** Node + npm + TypeScript + tsx + commander + Playwright + better-sqlite3 + drizzle + AI SDK + zod + ora + chalk + vitest  
**Mode:** self-hosted, local-first, **single-profile** SQLite database  
**MVP focus:** Human-assisted login → **restrained Playwright UI driving** → capture (screenshots + DOM + optional downloads) → **LLM extraction to canonical transactions** → LLM categorize → LLM subscription detection → CLI reports  
**Safety:** “read-only” automation (Minty may navigate/click/scroll to reach & paginate transaction views, but must avoid any money-moving or account-changing flows)

---

## 0) Background & intent

People want a clear view of where their money goes across accounts. The hardest parts are:

- inconsistent merchant strings and noisy descriptions
- getting data out of bank UIs reliably
- categorization that users can trust and correct
- identifying recurring charges (“subscriptions”) and spending drift

This project aims to be:

- **local-first** (data stays on device; artifacts stored locally)
- **automation-friendly** (CLI, scriptable)
- **generic** (works across many sites with human-in-the-loop navigation)
- **extensible** (connectors later, but MVP is generic capture)

---

## 1) Product goals (MVP)

### Must ship

1. Initialize local profile (directories + sqlite)
2. Add/list/remove accounts (metadata)
3. **Ingest from the web (generic):**
   - open a persistent Playwright browser profile
   - user logs in + navigates to transactions page
   - Minty captures artifacts (screenshot(s) + DOM snapshot + URL/title; optionally detects downloads)
   - Minty sends artifacts through an LLM to extract canonical transactions
   - Minty stores extracted transactions and dedupes
4. Categorize using LLM (and cache decisions)
5. Detect recurring charges/subscriptions using LLM over transaction history
6. Provide basic CLI reports:
   - monthly summary (total, by category, by merchant)
   - uncategorized list
   - subscriptions detected + upcoming expected charges

### Non-goals for MVP

- Fully automatic login / bypassing 2FA (human-assisted)
- Perfect “works on every bank website” DOM scraping
- UI (no React yet)
- Server/hosting
- Web search for subscriptions by default (privacy); keep the option as a later add-on

---

## 2) Core UX (CLI commands)

### Initialize

- `minty init`

Creates:

- `~/.minty/ledger.sqlite`
- `~/.minty/config.json`
- `~/.minty/rules.json` (reserved for future; MVP is LLM-first)
- `~/.minty/browser/` (persistent Playwright profile)
- `~/.minty/captures/` (artifacts for debugging + reproducibility)

### Accounts (metadata)

- `minty accounts add --name "N26" --currency EUR`
- `minty accounts list`
- `minty accounts remove --name "N26"` or `--id <uuid>`

### Web ingest (generic, restrained UI driving)

Single “do the thing” command:

- `minty ingest web --account "N26"`

Suggested flags:

- `--url <loginUrl>` (optional starting URL)
- `--headless false` (default: false for MVP; user can see browser)
- `--capture <fullpage|viewport>` (default: fullpage)
- `--pages <n>` (optional: repeat capture N times with user scrolling between)

Implementation behavior:

1. Open Playwright with persistent profile under `~/.minty/browser/`
2. Print instructions:
   - “Log in (human-assisted), then Minty will take over to collect history”
   - “Press Enter to start; Ctrl+C to stop”
3. Drive + capture:
   - Minty uses a bounded loop (max steps/time) to navigate/paginate/scroll and collect transaction history views.
   - Minty captures a screenshot + HTML snapshot + URL/title after each step.
4. Run LLM extraction to canonical JSON transactions
5. Insert into DB with dedupe
6. Print summary: inserted/skipped, plus where artifacts were stored

### Categorize (LLM-first)

- `minty classify [--since YYYY-MM-DD] [--dry-run]`

### Subscriptions (LLM-first)

- `minty subscriptions detect`
- `minty subscriptions upcoming --days 60`

### Reports

- `minty report month --month 2026-01`
- `minty report uncategorized [--limit 50]`
- `minty report merchants --month 2026-01 [--top 20]`

---

## 3) Repository structure

Keep a single package, but separate capture/extraction from ledger logic:

```
minty/
  src/
    cli/
      commands/
        init.ts
        accounts.ts
        ingest.ts
        classify.ts
        reports.ts
        subscriptions.ts
    core/
      browser/
        session.ts
        capture.ts
        safety.ts
      extract/
        llmExtract.ts
        schema.ts
      ingest/
        web/
          ingestWeb.ts
      categorize/
        llmCategorize.ts
      subscriptions/
        llmDetect.ts
      db/
      config/
    shared/
      dates.ts
      money.ts
      errors.ts
  test/
```

---

## 4) Data model (SQLite via Drizzle)

Keep existing ledger tables, add a minimal capture lineage.

### Money representation

- Store money as **minor units integer** (e.g., cents) in DB.

### Tables (existing)

- `users` (single row, name `"default"`)
- `accounts`
- `transactions` (deduped)
- `ingest_runs` (sourceType includes `"web"`)
- `subscriptions`

### Tables (new, MVP)

#### `captures`

- `id` (text pk)
- `accountId` (text fk)
- `kind` (text: `"screenshot+dom"` | `"download"` | `"mixed"`)
- `dir` (text; filesystem path under `~/.minty/captures/<id>/`)
- `url` (text)
- `title` (text nullable)
- `createdAt` (integer ms)

#### `extractions`

- `id` (text pk)
- `captureId` (text fk)
- `model` (text)
- `provider` (text)
- `status` (text: `"success" | "failed"`)
- `error` (text nullable)
- `createdAt` (integer ms)

Optional (nice-to-have):

- store the extracted JSON in DB for reproducibility

---

## 5) LLM strategy

### Provider choice

Use **AI SDK** (provider-agnostic), default to **Anthropic Claude** for:

- strong vision extraction quality
- reliable structured JSON output when constrained + validated with zod

Support OpenAI as an alternative (config switch).

### Privacy defaults

- Send only what’s needed (artifacts are sensitive; users opt-in to sending screenshots to LLM)
- Default: do **not** send raw description if user disables it, but for web capture MVP screenshots are inherently “raw”
- Always store artifacts locally first so users can inspect what is being sent

### Structured output

All LLM calls must return strict JSON validated with zod:

**Extraction output:**

```json
{
  "transactions": [
    {
      "postedAt": "YYYY-MM-DD",
      "amount": -1234,
      "currency": "EUR",
      "rawDescription": "…",
      "externalId": "…?"
    }
  ]
}
```

**Categorization output:**

```json
{ "category": "Groceries", "confidence": 0.0, "reason": "…" }
```

**Subscription detection output:**

```json
{
  "subscriptions": [
    {
      "merchant": "NETFLIX",
      "period": "monthly",
      "confidence": 0.9,
      "avgAmount": 1299
    }
  ]
}
```

### Caching (still “LLM-first”)

To keep behavior stable and costs down:

- Cache categorization decisions by `(normalizedMerchant, currency)` with a confidence threshold.
- Cache extraction results by capture id.

---

## 6) Browser safety (restrained UI driving)

MVP rule: Minty may drive navigation within the site, but must remain “read-only”.

### Hard constraints

- **No form filling after login** (no typing into inputs; no password/OTP handling).
- **No submissions**: do not click elements that submit forms or confirm actions.
- **No money movement**: block interactions likely to transfer/send/pay or change settings.

### Action allowlist (post-login)

Allowed actions are limited to:

- scroll within the page
- click navigation tabs/links that look like “Activity”, “Transactions”, “Statements”
- click pagination controls (next/previous page)
- expand/collapse transaction row details
- (future) open “Export/Download statement” only if explicitly enabled

### Text/role-based blocklist

Deny clicks on elements whose accessible name contains (case-insensitive):

`transfer`, `send`, `pay`, `withdraw`, `deposit`, `top up`, `chargeback`, `confirm`, `submit`, `save`, `settings`, `beneficiary`

### Guardrails

- Allowlist origins: warn/stop on cross-origin navigation once logged in.
- Step limit + time limit per ingest run.
- Full action log (what Minty clicked, where, why) persisted alongside captures.

---

## 7) Deduping

If `externalId` is unavailable:

`hash = sha256("${postedAt}|${amount}|${currency}|${normalizedRawDesc}|${accountId}")`

Insert transactions with conflict-ignore semantics.

---

## 8) Reporting (MVP)

Same as original plan (month totals, uncategorized, merchants, subscriptions).

---

## 9) Implementation milestones (agent-executable)

### Milestone 1 — Project scaffolding (done)

- TS project + commander CLI entry
- basic DB + migrations + init

### Milestone 2 — Browser harness (restrained driving)

- Add Playwright dependency
- `minty ingest web` opens persistent profile under `~/.minty/browser/`
- user completes login (human-assisted), then Minty runs a bounded “navigate → paginate/scroll → capture” loop

Acceptance:

- Browser opens and artifacts are saved under `~/.minty/captures/...`

### Milestone 3 — LLM extraction

- AI SDK wiring (provider config)
- send screenshot + DOM to LLM
- zod-validate extracted canonical transactions

Acceptance:

- extraction produces valid JSON for at least one captured page

### Milestone 4 — Web ingest to DB

- create ingest_run with sourceType `"web"`
- insert extracted transactions with dedupe

Acceptance:

- ingesting the same capture twice yields 0 new transactions

### Milestone 5 — LLM categorization

- `minty classify` calls LLM for uncategorized txns
- cache by normalizedMerchant

### Milestone 6 — LLM subscription detection

- `minty subscriptions detect` calls LLM with recent txn history grouped by merchant
- store results in `subscriptions`

### Milestone 7 — Reports

- month/uncategorized/merchants/subscriptions outputs

---

## 10) Testing plan (vitest)

- Unit: money/date parsing, normalization, dedupe hash stability
- Unit: mapping/zod validation for extraction output
- Integration: fake capture → LLM stubbed → ingest to DB → dedupe behavior

---

## 11) Deliverables checklist

- [ ] README (install + web ingest workflow)
- [ ] `minty ingest web` + artifacts saved locally
- [ ] LLM extraction + DB ingest
- [ ] LLM categorize + subscriptions + reports
- [ ] tests passing
