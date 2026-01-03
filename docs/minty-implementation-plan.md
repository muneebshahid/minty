# Minty (working title) — Implementation Plan (CLI-first personal finance ledger)

**Stack:** Node + npm + TypeScript + tsx + commander + better-sqlite3 + drizzle + AI SDK + zod + ora + chalk + vitest  
**Mode:** self-hosted, local-first, single-profile SQLite database (MVP)  
**MVP focus:** CSV/manual ingest → normalize → categorize (rules + optional LLM) → subscription detection → CLI reports  
**Explicitly postponed:** Playwright ingestion + auto-cancellation (design for it, don’t build it yet)

---

## 0) Background & intent

People want a clear view of where their money goes across accounts. The hardest parts are:

- inconsistent merchant strings and noisy descriptions
- categorization that users can trust and correct
- identifying recurring charges (“subscriptions”) and spending drift

This project aims to be:

- **local-first** (data stays on device)
- **automation-friendly** (CLI, scriptable)
- **explainable** (show why a transaction was categorized)
- **extensible** (importers as plugins; later add Playwright)

---

## 1) Product goals (MVP)

### Must ship

1. Initialize a user profile (local directories + sqlite)
2. Import transactions from CSV (and a generic JSON import format)
3. Normalize merchant strings deterministically
4. Categorize using:
   - rules-first (user-editable)
   - optional LLM fallback via AI SDK (BYO API key)
   - manual corrections that become rules
5. Detect recurring charges and generate a “subscriptions” list
6. Provide basic CLI reports:
   - monthly summary (total, by category, by merchant)
   - uncategorized list
   - subscriptions detected + upcoming expected charges

### Non-goals for MVP

- Fully automated login / bypassing 2FA (we support user-assisted auth later)
- Fully generic “works on every bank website” DOM scraping
- UI (no React yet)
- No hosting / server

---

## 2) Core UX (CLI commands)

### Initialize

- `minty init`

Creates:

- `~/.minty/ledger.sqlite`
- `~/.minty/rules.json`
- `~/.minty/config.json`

### Accounts (metadata only for now)

- `minty accounts add --name "N26" --currency EUR`
- `minty accounts list`
- `minty accounts remove --name "N26"`

### Ingest

- `minty ingest csv --account "N26" --file ./statement.csv`
- `minty ingest json --account "N26" --file ./txns.json`

### Categorize

- `minty classify [--since YYYY-MM-DD] [--dry-run]`
- `minty rules add --match contains --pattern "REWE" --category Groceries [--merchant "REWE"]`
- `minty txn set-category --id <txnId> --category "Dining" [--learn-rule]`

### Reports

- `minty report month --month 2026-01`
- `minty report uncategorized [--limit 50]`
- `minty report merchants --month 2026-01 [--top 20]`
- `minty subscriptions detect`
- `minty subscriptions upcoming --days 60`

### Export (optional but useful for adoption)

- `minty export csv --out ./ledger.csv`
- `minty export json --out ./ledger.json`

---

## 3) Repository structure

Single package first (keep it simple), but organized for later splitting:

```
minty/
  package.json
  tsconfig.json
  src/
    cli/
      index.ts
      commands/
        init.ts
        accounts.ts
        ingest.ts
        classify.ts
        rules.ts
        txn.ts
        reports.ts
        subscriptions.ts
        export.ts
      ui/
        output.ts
        table.ts
        spinner.ts
    core/
      config/
        paths.ts
        loadConfig.ts
      db/
        client.ts
        schema.ts
        migrations/
        migrate.ts
      ingest/
        csv/
          parseCsv.ts
          mapping.ts
        json/
          parseJson.ts
        dedupe.ts
      normalize/
        merchant.ts
        text.ts
      categorize/
        categories.ts
        rulesEngine.ts
        llmCategorizer.ts
        classify.ts
      subscriptions/
        detect.ts
        predict.ts
      reports/
        month.ts
        uncategorized.ts
        merchants.ts
    shared/
      errors.ts
      dates.ts
      money.ts
      logger.ts
  test/
    fixtures/
```

---

## 4) Data model (SQLite via Drizzle)

Use Drizzle SQLite schema. Keep it explicit and migration-friendly.

### Money representation

- Store money as **minor units integer** (e.g., cents) in the DB.
- Convert to human-readable string only at the CLI output layer.

### Tables

#### `users`

- `id` (text, primary key)
- `name` (text, unique)
- `createdAt` (integer ms)

#### `accounts`

- `id` (text pk)
- `userId` (text fk)
- `name` (text)
- `currency` (text, nullable)
- `createdAt` (integer ms)
- unique(userId, name)

#### `ingest_runs`

- `id` (text pk)
- `userId` (text fk)
- `accountId` (text fk)
- `sourceType` (text: "csv" | "json" | later "playwright")
- `sourceMeta` (text JSON)
- `startedAt`, `endedAt` (integer ms)
- `status` (text: "success" | "failed")
- `error` (text nullable)

#### `transactions`

- `id` (text pk)
- `userId` (text fk)
- `accountId` (text fk)
- `postedAt` (text ISO date `YYYY-MM-DD`)
- `amount` (integer minor units; negative = expense, positive = income)
- `currency` (text)
- `rawDescription` (text)
- `normalizedMerchant` (text)
- `category` (text nullable)
- `categoryConfidence` (real nullable 0..1)
- `categorySource` (text: "rule" | "llm" | "manual" | "none")
- `externalId` (text nullable)
- `hash` (text)
- `createdAt` (integer ms)

Indexes/constraints:

- unique(accountId, externalId) where externalId is not null
- unique(accountId, hash)

#### `rules`

- `id` (text pk)
- `userId` (text fk)
- `matchType` (text: "contains" | "equals" | "regex")
- `pattern` (text)
- `merchantOverride` (text nullable)
- `category` (text)
- `priority` (integer)
- `createdAt` (integer ms)

#### `subscriptions`

- `id` (text pk)
- `userId` (text fk)
- `normalizedMerchant` (text)
- `currency` (text)
- `period` (text: "weekly" | "monthly" | "annual" | "unknown")
- `avgAmount` (integer)
- `confidence` (real)
- `lastSeenAt` (text YYYY-MM-DD)
- `nextExpectedAt` (text nullable)
- `updatedAt` (integer ms)

Unique:

- unique(userId, normalizedMerchant, currency)

---

## 5) Config & rules format

### `config.json` (per user)

Path: `~/.minty/config.json`

Zod schema fields:

- `defaultCurrency?: string`
- `categories?: string[]` (use defaults if missing)
- `llm`:
  - `provider`: `"openai" | "anthropic" | "ollama" | "none"`
  - `model?: string`
  - `apiKeyEnv?: string` (env var name, e.g. `OPENAI_API_KEY`)
  - `enabled: boolean`
- `privacy`:
  - `sendRawDescriptionToLLM: boolean` (default false)
  - `sendAmountsToLLM: boolean` (default true)
  - `sendDatesToLLM: boolean` (default true)

### Rules storage approach (MVP decision)

- **DB is source of truth** for rules.
- Optional command `minty rules export --out rules.json` for sharing.

---

## 6) CSV ingest details (critical)

### Input format strategy

Support:

- Generic CSV import (header-based)
- Auto-mapping by common header names
- Explicit column mapping via flags (fallback when headers are non-standard)

### Column mapping (canonical)

Map any CSV to:

- `postedAt`
- `amount`
- `currency` (optional; fallback to account currency)
- `rawDescription`
- `externalId` (optional)

### Dedupe

Compute stable `hash` if externalId missing:

- `hash = sha256("${postedAt}|${amount}|${currency}|${normalizedRawDesc}|${accountId}")`

Where `normalizedRawDesc` is:

- trimmed
- whitespace collapsed
- optionally uppercased

Insert with conflict-ignore semantics.

### Amount parsing

- handle comma decimals (`1.234,56`) and dot decimals (`1,234.56`)
- store in minor units integer
- document expected sign convention (if bank exports expenses as positive, allow `--expenses-positive` flag)

---

## 7) Merchant normalization pipeline

Goal: deterministic, explainable normalization that helps dedupe + categorization.

Steps:

1. Unicode normalize, trim, consistent casing
2. Collapse whitespace
3. Remove common noise:
   - card digit groups
   - reference IDs (`REF`, `TRX`, `VISA`, etc.)
4. Apply merchant override (if a matching rule specifies one)

Keep it conservative for MVP.

---

## 8) Categorization design

### Categories (defaults)

Groceries, Dining, Transport, Utilities, Rent, Subscriptions, Shopping, Health, Travel, Entertainment, Income, Fees, Transfers, Other, Uncategorized

### Rules-first

- Evaluate rules by `priority desc`.
- match types:
  - `contains`: substring match
  - `equals`: exact match (prefer on normalizedMerchant)
  - `regex`: regex against rawDescription

If rule matches:

- set category
- confidence = 1.0
- source = `rule`
- apply `merchantOverride` if present

### LLM fallback (optional)

Only for remaining Uncategorized:

Prompt must:

- constrain output to known categories
- require JSON output:
  - `{ "category": "...", "confidence": 0-1, "reason": "short" }`

Validate via zod.
Cache by normalizedMerchant (and optionally amount band).

### Manual corrections

`minty txn set-category ... --learn-rule`:

- sets categorySource to `manual`
- inserts a new rule:
  - matchType: `equals`
  - pattern: normalizedMerchant
  - priority: e.g. 50

---

## 9) Subscription detection (MVP)

### Inputs

Expense transactions only (amount < 0).

Group by:

- (userId, normalizedMerchant, currency)

Require:

- ≥ 3 occurrences

Compute:

- sorted dates
- deltas between consecutive occurrences (days)
- median delta

Classify:

- weekly if median in [5..9]
- monthly if median in [25..35]
- annual if median in [330..400]
- else unknown

Amount stability:

- coefficient of variation (stddev / mean) on absolute amounts
- stable if cv ≤ 0.15

Confidence:

- +0.4 if period known
- +0.3 if stable
- +0.3 if occurrences ≥ 4
  Clamp to 0..1

Next expected:

- if period known: lastSeenAt + (7/30/365)
- else null

Upsert into subscriptions table.

---

## 10) Reporting (MVP)

### Month report

Input: `--month YYYY-MM`

Compute:

- total expenses (sum of negative amounts)
- total income (sum of positive amounts)
- totals by category
- top merchants by spend

Output:

- Chalk headings
- Simple column formatter (padEnd)
- Money formatted from minor units

### Uncategorized report

List:

- id, date, merchant, amount, rawDescription snippet

### Subscriptions report

List:

- merchant, period, avg amount, next expected, confidence

---

## 11) Tooling & scripts (package.json)

Minimum scripts:

- `dev`: `tsx src/cli/index.ts`
- `build`: `tsup src/cli/index.ts --format esm --dts`
- `test`: `vitest run`
- `test:watch`: `vitest`
- `db:migrate`: `tsx src/core/db/migrate.ts`

Drizzle migrations:

- Use drizzle-kit (dev dependency) and document the flow.

---

## 12) Implementation milestones (agent-executable)

### Milestone 1 — Project scaffolding

- [ ] TS project + tsconfig
- [ ] commander CLI entry `minty`
- [ ] `minty --help` shows commands
- [ ] chalk + ora wrappers
- [ ] vitest setup

Acceptance:

- `npm run dev -- --help` works.

### Milestone 2 — DB layer

- [ ] Path helpers (`~/.minty/`)
- [ ] drizzle + better-sqlite3 client init
- [ ] schema + migrations + migrate runner
- [ ] `minty init` creates `~/.minty` profile

Acceptance:

- init is idempotent.

### Milestone 3 — Accounts

- [ ] accounts CRUD
- [ ] add/list/remove commands

### Milestone 4 — CSV ingest

- [ ] CSV parser with delimiter detection
- [ ] format detection + mapping (auto + generic)
- [ ] normalization + dedupe + inserts
- [ ] ingest run tracking

Acceptance:

- importing same file twice adds 0 on second run.

### Milestone 5 — Rules + classify

- [ ] rules CRUD
- [ ] rules engine
- [ ] classify orchestrator (rules-first)
- [ ] `minty classify`

Acceptance:

- added rules change output.

### Milestone 6 — LLM categorizer

- [ ] config zod + env reading
- [ ] AI SDK provider selection
- [ ] response validation + caching
- [ ] `minty classify` uses LLM when enabled

Acceptance:

- without LLM enabled, still works.

### Milestone 7 — Subscriptions

- [ ] detect algorithm
- [ ] upsert subscriptions
- [ ] detect + upcoming commands

### Milestone 8 — Reports

- [ ] month report
- [ ] uncategorized report
- [ ] merchants report

---

## 13) Testing plan (vitest)

Unit tests:

- normalization
- CSV parsing quirks
- dedupe hash stability
- rules matching
- subscription detection
- month aggregation math

Integration test:

- fixture CSV → ingest → classify with rules → subscriptions detect → month totals

Use fixtures under `test/fixtures`.

---

## 14) Error handling & UX rules

- Validate CLI args with zod.
- Print friendly errors; show stack trace only with `--debug`.
- Use ora spinner for long actions.
- Never write partial data without wrapping an ingest run (record failed runs too).

---

## 15) Privacy & security constraints (MVP)

- Store everything locally.
- LLM is BYO key; read key from env only.
- Default privacy: do NOT send rawDescription to LLM unless user enables it.
- Optional future: `minty profile reset` to wipe local data.

---

## 16) Future-proofing for Playwright (design now)

Define an importer interface now:

- `Importer.ingest(ctx): Promise<IngestResult>`

MVP importers:

- CSV
- JSON

Later:

- Playwright exporter:
  - persistent browser profile per user
  - human-in-the-loop auth pause/resume
  - export-first (download statements instead of scraping tables)

Core ledger pipeline stays unchanged.

---

## 17) Deliverables checklist

- [ ] README (install + workflow)
- [ ] init, accounts, ingest csv, classify, subscriptions detect, report month
- [ ] tests passing
- [ ] fixture data included
