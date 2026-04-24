#!/usr/bin/env node
/**
 * Pre-ICO audit readiness score.
 *
 * Reads audit/findings.json and computes:
 *     score = 100 - 12*H - 4*M - 1*L
 * where H/M/L count findings with status === "open" for each severity.
 *
 * Exit codes:
 *   0 - score >= metadata.passThreshold (default 70)
 *   1 - score below threshold OR findings.json is malformed
 *
 * Invocation:
 *     node scripts/compute-audit-score.mjs            # print only, exit 0 (CI-safe)
 *     node scripts/compute-audit-score.mjs --enforce  # exit 1 if score < threshold
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const findingsPath = resolve(__dirname, '..', 'audit', 'findings.json');

const WEIGHTS = { High: 12, Medium: 4, Low: 1 };

function load() {
  try {
    const raw = readFileSync(findingsPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[audit-score] Failed to read ${findingsPath}: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  const enforce = process.argv.includes('--enforce');
  const data = load();
  const findings = Array.isArray(data.findings) ? data.findings : [];

  const counts = { High: 0, Medium: 0, Low: 0 };
  for (const f of findings) {
    if (f.status && f.status !== 'open') continue;
    if (counts[f.severity] === undefined) {
      console.error(`[audit-score] Unknown severity "${f.severity}" on finding ${f.id}`);
      process.exit(1);
    }
    counts[f.severity]++;
  }

  const score =
    100 - WEIGHTS.High * counts.High - WEIGHTS.Medium * counts.Medium - WEIGHTS.Low * counts.Low;
  const threshold = data.metadata?.passThreshold ?? 70;

  console.log('Pre-ICO Audit Readiness');
  console.log('-----------------------');
  console.log(`Open High   : ${counts.High}  (weight ${WEIGHTS.High})`);
  console.log(`Open Medium : ${counts.Medium}  (weight ${WEIGHTS.Medium})`);
  console.log(`Open Low    : ${counts.Low}  (weight ${WEIGHTS.Low})`);
  console.log(`Formula     : 100 - 12H - 4M - 1L`);
  console.log(`Score       : ${score}%`);
  console.log(`Threshold   : ${threshold}%`);

  // Emit GitHub Actions summary / output if available.
  if (process.env.GITHUB_STEP_SUMMARY) {
    const md = [
      '## Pre-ICO Audit Readiness',
      '',
      `| Severity | Open | Weight |`,
      `|---|---|---|`,
      `| High | ${counts.High} | ${WEIGHTS.High} |`,
      `| Medium | ${counts.Medium} | ${WEIGHTS.Medium} |`,
      `| Low | ${counts.Low} | ${WEIGHTS.Low} |`,
      '',
      `**Score:** ${score}%   **Threshold:** ${threshold}%`,
      '',
      `Formula: \`100 - 12H - 4M - 1L\``,
      '',
    ].join('\n');
    try {
      const { appendFileSync } = await import('node:fs');
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
    } catch {
      /* ignore */
    }
  }
  if (process.env.GITHUB_OUTPUT) {
    try {
      const { appendFileSync } = await import('node:fs');
      appendFileSync(process.env.GITHUB_OUTPUT, `score=${score}\n`);
    } catch {
      /* ignore */
    }
  }

  if (!enforce) {
    console.log(
      `[audit-score] Report-only mode (score ${score < threshold ? 'below' : 'at/above'} threshold). ` +
        'Pass --enforce to fail the build below threshold.',
    );
    process.exit(0);
  }
  if (score < threshold) {
    console.error(
      `[audit-score] FAIL: score ${score}% is below threshold ${threshold}%. ` +
        'Close High/Medium findings in audit/findings.json or update the threshold.',
    );
    process.exit(1);
  }
  console.log(`[audit-score] PASS: score ${score}% >= threshold ${threshold}%.`);
}

await main();
