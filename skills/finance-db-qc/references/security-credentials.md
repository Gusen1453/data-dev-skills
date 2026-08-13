# Security & credentials

## Rules

1. Load connection settings from **`.env`** or user-explicit DSN/profile.
2. **Never hardcode** passwords, tokens, or full DSN with secrets into `checks.sql`, scripts, `watchlist.md`, or `report.md`.
3. If hardcode is detected → **立即告警**, stop using the secret string, and help the user move it to `.env` (合规化).
4. Default query mode: **read-only**. Do not UPDATE/DELETE/DDL unless the user explicitly overrides (out of scope for this skill’s default).
5. Public examples must be fictional; never commit real account numbers, holdings, or live hosts.

## Detection heuristics (non-exhaustive)

- `password=`, `PWD=`, `MysqlPwd`
- URLs like `mysql://user:pass@host`, `postgres://user:pass@`, `mongodb://user:pass@`
- Private keys / PEM blocks in QC artifacts

## Remediation pattern

```bash
# .env (business project; gitignored)
DATABASE_URL=mysql://readonly_user:***@host:3306/db
```

Re-run checks using the environment — keep SQL free of secrets.
