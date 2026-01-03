# Minty (working title)

Local-first personal finance ledger, built to be scriptable, explainable, and extensible.

## Status

Early MVP scaffolding. Current direction is **Playwright-first web ingest** (generic, restrained UI driving) with LLM extraction.

- CLI skeleton (commands wired, most are stubs)
- SQLite schema + lightweight migrations
- Profile initialization: `minty init`

## Install (local dev)

Prereqs: Node.js 22.x (required for `better-sqlite3`).

```sh
cd minty
nvm install
nvm use
npm i
```

### Use as a CLI (`minty ...`)

```sh
npm link
minty --help
minty init
```

To uninstall the linked binary:

```sh
npm unlink
```

### Run without linking

```sh
npm run minty -- --help
npm run minty -- init
```

## Data location

Minty stores everything locally under:

- `~/.minty/ledger.sqlite`
- `~/.minty/config.json`
- `~/.minty/rules.json`

## Commands (planned MVP surface)

Currently implemented:

- `minty init`
- `minty accounts add|list|remove`
- `minty ingest csv --account <name> --file <path> [--date-col ...] [--amount-col ...] [--description-col ...]`

Scaffolded (not implemented yet):

- `minty accounts add|list|remove ...`
- `minty ingest web --account <name>` (Playwright restrained UI driving + capture + LLM extraction)
- `minty ingest json ...`
- `minty classify ...`
- `minty rules add|export ...`
- `minty txn set-category ...`
- `minty report month|uncategorized|merchants ...`
- `minty subscriptions detect|upcoming ...`
- `minty export csv|json ...`

## Development

```sh
npm run dev -- --help
npm run lint
npm run format
npm test
```

## Notes

- Local-first: no server; no data leaves your machine unless you enable an LLM provider (future milestone).
- Money is stored as minor units integers in the DB (e.g., cents).
