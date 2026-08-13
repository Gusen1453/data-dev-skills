#!/usr/bin/env node
/**
 * Layout + content contract checks for data-dev-skills.
 * Exit 0 = pass; non-zero = fail with messages on stderr.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const errors = [];

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function mustExist(rel) {
  if (!exists(rel)) errors.push(`missing file: ${rel}`);
}

function mustContain(rel, needles, label = rel) {
  if (!exists(rel)) return;
  const text = read(rel);
  for (const n of needles) {
    if (!text.includes(n)) errors.push(`${label}: missing required text "${n}"`);
  }
}

function mustNotMatch(rel, patterns, label = rel) {
  if (!exists(rel)) return;
  const text = read(rel);
  for (const re of patterns) {
    if (re.test(text)) errors.push(`${label}: forbidden pattern ${re}`);
  }
}

function frontmatterName(rel, expected) {
  if (!exists(rel)) return;
  const text = read(rel);
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) {
    errors.push(`${rel}: missing YAML frontmatter`);
    return;
  }
  const name = m[1].match(/^name:\s*(.+)$/m);
  if (!name || name[1].trim() !== expected) {
    errors.push(`${rel}: expected name: ${expected}`);
  }
}

// --- Task 1 baseline ---
mustExist("README.md");
mustContain("README.md", [
  "using-data-dev",
  "finance-db-qc",
  "data-qc/",
  ".env",
  "skills add",
]);

// --- Skills (added as tasks land; keep required for full green) ---
mustExist("skills/using-data-dev/SKILL.md");
frontmatterName("skills/using-data-dev/SKILL.md", "using-data-dev");
mustContain("skills/using-data-dev/SKILL.md", ["finance-db-qc", "Skill map"]);
mustNotMatch("skills/using-data-dev/SKILL.md", [
  /\bCONNECT\b/i,
  /WRITE\s+data-qc/i,
]);

mustExist("skills/finance-db-qc/SKILL.md");
frontmatterName("skills/finance-db-qc/SKILL.md", "finance-db-qc");
mustContain("skills/finance-db-qc/SKILL.md", [
  "业务假设",
  "references/",
  "BLOCK",
  "WATCH",
  "INFO",
]);

const refs = [
  "skills/finance-db-qc/references/deliverable-contract.md",
  "skills/finance-db-qc/references/security-credentials.md",
  "skills/finance-db-qc/references/check-catalog.md",
  "skills/finance-db-qc/references/semantic-conventions.md",
  "skills/finance-db-qc/references/engine-adapters.md",
];
for (const r of refs) mustExist(r);

mustContain("skills/finance-db-qc/references/deliverable-contract.md", [
  "checks.sql",
  "watchlist.md",
  "report.md",
]);
mustContain("skills/finance-db-qc/references/security-credentials.md", [
  "hardcode",
  ".env",
  "告警",
]);
mustContain("skills/finance-db-qc/references/check-catalog.md", [
  "结构",
  "语义",
  "时空",
  "BLOCK",
  "WATCH",
  "INFO",
]);
mustContain("skills/finance-db-qc/references/semantic-conventions.md", [
  "命名",
  "描述",
  "取值",
]);
mustContain("skills/finance-db-qc/references/engine-adapters.md", [
  "MySQL",
  "PostgreSQL",
  "ClickHouse",
  "Mongo",
]);

// --- Example fixture ---
const ex = "examples/data-qc/demo.equity_daily";
mustExist(`${ex}/checks.sql`);
mustExist(`${ex}/watchlist.md`);
mustExist(`${ex}/report.md`);
mustContain(`${ex}/watchlist.md`, ["业务假设"]);
mustContain(`${ex}/report.md`, ["WATCH"]);
mustNotMatch(
  `${ex}/checks.sql`,
  [/password\s*=/i, /mysql:\/\/[^:]+:[^@]+@/i, /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/i],
  `${ex}/checks.sql`
);
mustNotMatch(
  `${ex}/watchlist.md`,
  [/password\s*=/i, /mysql:\/\/[^:]+:[^@]+@/i],
  `${ex}/watchlist.md`
);
mustNotMatch(
  `${ex}/report.md`,
  [/password\s*=/i, /mysql:\/\/[^:]+:[^@]+@/i],
  `${ex}/report.md`
);

if (errors.length) {
  console.error(`FAIL (${errors.length}):`);
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
console.log("PASS: repo layout and contracts OK");
