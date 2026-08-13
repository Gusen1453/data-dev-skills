# data-dev-skills

Public monorepo of **Agent Skills for data development** — installable via skills registries (e.g. [skills.sh](https://skills.sh) / `npx skills add`).

## Install

```bash
npx skills add Gusen1453/data-dev-skills
```

Forks: replace with your `owner/data-dev-skills`.

## Skills

| Skill | Role |
|-------|------|
| **using-data-dev** | Single entry + smart routing (like `using-creed`) |
| **finance-db-qc** | Financial DB quality checks (time-series + cross-section), DDL/semantics, table-level watchlists |

Unsure which skill applies? Start with **using-data-dev**.

## What finance-db-qc produces

In the **business project** root (not in this skills repo):

```text
data-qc/<schema>.<table>/
  checks.sql      # re-runnable checks (engine-native equivalent)
  watchlist.md    # business assumptions + issues to monitor
  report.md       # latest run: BLOCK / WATCH / INFO
```

## Connection & secrets

- Prefer explicit connection info or variables loaded from **`.env`**
- **Never hardcode** passwords/DSN into `checks.sql`, scripts, or reports
- If hardcoding appears → **alert immediately** and remediate to `.env`
- Default: **read-only** queries

## Layout check

```bash
node scripts/check_repo_layout.cjs
```

## Examples

See `examples/data-qc/demo.equity_daily/` — fictional, desensitized sample deliverables.

## License

MIT
