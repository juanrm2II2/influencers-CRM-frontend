# Audit artifacts

This directory is the machine-readable source of truth for the Pre-ICO security audit.

| File | Purpose |
|---|---|
| [`findings.json`](./findings.json) | Structured findings consumed by CI and the PDF generator |
| [`../AUDIT_CHECKLIST.md`](../AUDIT_CHECKLIST.md) | Human-readable checklist, kept in sync with the JSON |
| [`../scripts/compute-audit-score.mjs`](../scripts/compute-audit-score.mjs) | Reads `findings.json` and computes `100 − 12H − 4M − 1L` |
| [`../scripts/generate-audit-pdfs.py`](../scripts/generate-audit-pdfs.py) | Regenerates `PRE_ICO_AUDIT_REPORT.pdf` and `PRE_ICO_WHITE_PAPER.pdf` from `findings.json` |
| [`../PRE_ICO_AUDIT_REPORT.pdf`](../PRE_ICO_AUDIT_REPORT.pdf) | Full audit report (findings, verdict, remediation plan) |
| [`../PRE_ICO_WHITE_PAPER.pdf`](../PRE_ICO_WHITE_PAPER.pdf) | Repository / product white paper including audit summary |

## Regenerating the PDFs

```bash
pip install reportlab
python3 scripts/generate-audit-pdfs.py
```

## CI

`.github/workflows/ci.yml` runs the readiness-score job on every PR / push and emits
the score to the GitHub Actions step summary. Flip the script to `--enforce` to make
it a required check once the remediation plan reaches your target threshold.
