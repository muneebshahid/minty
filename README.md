# Minty (working title)

Local-first personal finance ledger (CLI-first).

## What’s implemented

- Project scaffold + CLI command stubs
- SQLite schema + simple file-based migrations
- `minty init --user <name>` creates `~/.minty/users/<name>` and initializes `ledger.sqlite`

## Dev

1. Install deps: `npm i`
2. Run CLI: `npm run dev -- --help`

## Init

- `npm run dev -- init --user muneeb`
