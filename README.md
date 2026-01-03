# Minty (working title)

Local-first personal finance ledger, built to be scriptable, explainable, and extensible.

## Status

Early MVP scaffolding. Implemented today:

- CLI skeleton (commands wired, most are stubs)
- SQLite schema + lightweight migrations
- User initialization: `minty init --user <name>`

## Install (local dev)

Prereqs: Node.js 20+ recommended.

```sh
cd minty
npm i
```

### Use as a CLI (`minty ...`)

```sh
npm link
minty --help
minty init --user muneeb
```

To uninstall the linked binary:

```sh
npm unlink
```

### Run without linking

```sh
npm run minty -- --help
npm run minty -- init --user muneeb
```

## Data location

Minty stores everything locally under:

- `~/.minty/users/<name>/ledger.sqlite`
- `~/.minty/users/<name>/config.json`
- `~/.minty/users/<name>/rules.json`

## Commands (planned MVP surface)

Currently implemented:

- `minty init --user <name>`

Scaffolded (not implemented yet):

- `minty accounts add|list|remove ...`
- `minty ingest csv|json ...`
- `minty classify ...`
- `minty rules add|export ...`
- `minty txn set-category ...`
- `minty report month|uncategorized|merchants ...`
- `minty subscriptions detect|upcoming ...`
- `minty export csv|json ...`

## Development

```sh
npm run dev -- --help
npm test
```

## Notes

- Local-first: no server; no data leaves your machine unless you enable an LLM provider (future milestone).
- Money is stored as minor units integers in the DB (e.g., cents).
