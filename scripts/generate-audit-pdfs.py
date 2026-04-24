#!/usr/bin/env python3
"""
Regenerate the two Pre-ICO PDF deliverables from audit/findings.json:

    - PRE_ICO_AUDIT_REPORT.pdf   (findings, verdict, remediation plan)
    - PRE_ICO_WHITE_PAPER.pdf    (repository explanation + product / token
                                   model + audit summary)

Run from the repo root:

    pip install reportlab
    python3 scripts/generate-audit-pdfs.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import (
        PageBreak,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )
except ImportError:  # pragma: no cover
    sys.stderr.write(
        "reportlab is required. Install with: pip install reportlab\n"
    )
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
FINDINGS = ROOT / "audit" / "findings.json"
AUDIT_PDF = ROOT / "PRE_ICO_AUDIT_REPORT.pdf"
WHITE_PAPER_PDF = ROOT / "PRE_ICO_WHITE_PAPER.pdf"

SEV_COLORS = {
    "High": colors.HexColor("#b91c1c"),
    "Medium": colors.HexColor("#b45309"),
    "Low": colors.HexColor("#1d4ed8"),
}
SEV_WEIGHTS = {"High": 12, "Medium": 4, "Low": 1}


def load_findings() -> dict:
    with FINDINGS.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def compute_score(data: dict) -> tuple[int, dict]:
    counts = {"High": 0, "Medium": 0, "Low": 0}
    for f in data.get("findings", []):
        if f.get("status", "open") != "open":
            continue
        counts[f["severity"]] = counts.get(f["severity"], 0) + 1
    score = (
        100
        - SEV_WEIGHTS["High"] * counts["High"]
        - SEV_WEIGHTS["Medium"] * counts["Medium"]
        - SEV_WEIGHTS["Low"] * counts["Low"]
    )
    return score, counts


def make_styles() -> dict:
    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "title", parent=base["Title"], fontSize=22, leading=26, spaceAfter=14
        ),
        "h1": ParagraphStyle(
            "h1", parent=base["Heading1"], fontSize=16, leading=20,
            spaceBefore=14, spaceAfter=8, textColor=colors.HexColor("#111827"),
        ),
        "h2": ParagraphStyle(
            "h2", parent=base["Heading2"], fontSize=13, leading=16,
            spaceBefore=10, spaceAfter=4, textColor=colors.HexColor("#111827"),
        ),
        "body": ParagraphStyle(
            "body", parent=base["BodyText"], fontSize=10, leading=14, spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "small", parent=base["BodyText"], fontSize=8, leading=11,
            textColor=colors.HexColor("#374151"),
        ),
        "mono": ParagraphStyle(
            "mono", parent=base["Code"], fontSize=8, leading=11,
            textColor=colors.HexColor("#111827"),
            backColor=colors.HexColor("#f3f4f6"),
        ),
        "bullet": ParagraphStyle(
            "bullet", parent=base["BodyText"], fontSize=10, leading=14,
            leftIndent=14, bulletIndent=2, spaceAfter=2,
        ),
    }
    return styles


def esc(text: str) -> str:
    """Escape < > & for ReportLab paragraphs."""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


# ---------------------------------------------------------------------------
# Audit report
# ---------------------------------------------------------------------------
def build_audit_report(data: dict, styles: dict) -> list:
    score, counts = compute_score(data)
    meta = data["metadata"]
    story: list = []

    story.append(Paragraph(meta["title"], styles["title"]))
    story.append(Paragraph(
        f"Repository: <b>{esc(meta['repository'])}</b> &nbsp;|&nbsp; "
        f"Date: {esc(meta['auditDate'])} &nbsp;|&nbsp; "
        f"Auditor: {esc(meta['auditor'])}",
        styles["small"],
    ))
    story.append(Spacer(1, 0.4 * cm))

    # Readiness score card
    verdict_color = (
        colors.HexColor("#065f46") if score >= meta.get("passThreshold", 70)
        else colors.HexColor("#991b1b")
    )
    score_tbl = Table(
        [[
            Paragraph(f"<b>Readiness score</b><br/><font size=22>{score}%</font>", styles["body"]),
            Paragraph(
                f"<b>Open findings</b><br/>"
                f"<font color='{SEV_COLORS['High']}'>High: {counts['High']}</font> &nbsp; "
                f"<font color='{SEV_COLORS['Medium']}'>Medium: {counts['Medium']}</font> &nbsp; "
                f"<font color='{SEV_COLORS['Low']}'>Low: {counts['Low']}</font>",
                styles["body"],
            ),
            Paragraph(
                f"<b>Verdict</b><br/><font color='{verdict_color}'>"
                f"{esc(data['verdict']['overall'])}</font>",
                styles["body"],
            ),
        ]],
        colWidths=[5.5 * cm, 6.5 * cm, 5 * cm],
    )
    score_tbl.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f9fafb")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(score_tbl)
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph(
        f"Score formula: <font face='Courier'>{esc(meta['scoreFormula'])}</font>. "
        f"Threshold for a passing CI enforcement: {meta.get('passThreshold', 70)}%.",
        styles["small"],
    ))
    story.append(Spacer(1, 0.3 * cm))

    # Executive summary
    story.append(Paragraph("Executive summary", styles["h1"]))
    story.append(Paragraph(esc(data["verdict"]["summary"]), styles["body"]))

    # Scope
    story.append(Paragraph("Scope", styles["h2"]))
    for s in meta["scope"]:
        story.append(Paragraph(f"• {esc(s)}", styles["bullet"]))
    story.append(Paragraph("Out of scope", styles["h2"]))
    for s in meta["outOfScope"]:
        story.append(Paragraph(f"• {esc(s)}", styles["bullet"]))

    # Findings summary table
    story.append(PageBreak())
    story.append(Paragraph("Findings summary", styles["h1"]))
    header = ["#", "Sev.", "Area", "File : lines", "Title"]
    rows = [header]
    for f in data["findings"]:
        rows.append([
            f["id"],
            f["severity"],
            f["area"],
            f"{f['file']}:{f['lines']}",
            Paragraph(esc(f["title"]), styles["small"]),
        ])
    summary_tbl = Table(
        rows,
        colWidths=[1.4 * cm, 1.4 * cm, 3.1 * cm, 4.8 * cm, 6.3 * cm],
        repeatRows=1,
    )
    sstyle = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]
    for i, f in enumerate(data["findings"], start=1):
        sstyle.append(("TEXTCOLOR", (1, i), (1, i), SEV_COLORS[f["severity"]]))
        sstyle.append(("FONTNAME", (1, i), (1, i), "Helvetica-Bold"))
    summary_tbl.setStyle(TableStyle(sstyle))
    story.append(summary_tbl)

    # Detailed findings
    story.append(PageBreak())
    story.append(Paragraph("Detailed findings", styles["h1"]))
    for f in data["findings"]:
        story.append(Paragraph(
            f"<b>{esc(f['id'])} — {esc(f['title'])}</b> "
            f"<font color='{SEV_COLORS[f['severity']]}'>[{f['severity']}]</font>",
            styles["h2"],
        ))
        story.append(Paragraph(
            f"<b>Area:</b> {esc(f['area'])} &nbsp;&nbsp; "
            f"<b>Location:</b> <font face='Courier'>{esc(f['file'])}:{esc(f['lines'])}</font>",
            styles["body"],
        ))
        story.append(Paragraph(
            f"<font face='Courier' size=8>{esc(f['excerpt'])}</font>",
            styles["mono"],
        ))
        story.append(Paragraph(f"<b>Risk.</b> {esc(f['risk'])}", styles["body"]))
        story.append(Paragraph(f"<b>Fix.</b> {esc(f['fix'])}", styles["body"]))
        story.append(Spacer(1, 0.2 * cm))

    # Remediation plan
    story.append(PageBreak())
    story.append(Paragraph("Prioritized remediation plan", styles["h1"]))
    for sev in ("High", "Medium", "Low"):
        items = [f for f in data["findings"] if f["severity"] == sev]
        if not items:
            continue
        story.append(Paragraph(f"{sev} priority", styles["h2"]))
        for f in items:
            story.append(Paragraph(
                f"• <b>{esc(f['id'])}</b> — {esc(f['file'])}:{esc(f['lines'])} — "
                f"{esc(f['title'])}",
                styles["bullet"],
            ))

    # Gaps
    story.append(Paragraph(
        "Gaps remaining before a Pre-ICO Independent Audit",
        styles["h1"],
    ))
    for g in data.get("gaps", []):
        story.append(Paragraph(f"• {esc(g)}", styles["bullet"]))

    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph(
        "This report is generated from <font face='Courier'>audit/findings.json</font>. "
        "Update that file and re-run <font face='Courier'>python3 scripts/generate-audit-pdfs.py</font> "
        "to refresh the PDF. The CI job <b>Pre-ICO Readiness Score</b> recomputes the score "
        "on every PR.",
        styles["small"],
    ))
    return story


# ---------------------------------------------------------------------------
# White paper
# ---------------------------------------------------------------------------
def build_white_paper(data: dict, styles: dict) -> list:
    score, counts = compute_score(data)
    story: list = []

    story.append(Paragraph("Influencer CRM — Pre-ICO White Paper", styles["title"]))
    story.append(Paragraph(
        "A token-gated CRM for creator / influencer outreach, with an on-chain "
        "contribution and vesting flow.",
        styles["body"],
    ))
    story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph("1. Product overview", styles["h1"]))
    story.append(Paragraph(
        "Influencer CRM is a Next.js 15 web application that helps brand marketers "
        "discover, contact and track relationships with social-media creators. "
        "Contributor access and premium dashboards are gated by an ERC-20 utility "
        "token sold through an on-chain token-sale contract with linear vesting. "
        "KYC / AML is performed by SumSub before any contribution is accepted.",
        styles["body"],
    ))

    story.append(Paragraph("2. Repository explanation", styles["h1"]))
    repo_rows = [
        ["Path", "Purpose"],
        ["app/", "Next.js App Router pages (dashboard, login, token-sale, legal pages: privacy / terms / DPA / cookie-policy / data-export / data-practices)."],
        ["components/", "UI building blocks (FilterBar, InfluencerCard, modals, cookie consent, error boundary)."],
        ["components/web3/", "Wallet connection, contribution form, SIWE flow, KYC banner, whitelist manager, vesting schedule, transaction receipt, Web3Provider."],
        ["context/", "AuthContext — SIWE-aware login state, idle timeout, user-profile cache."],
        ["lib/", "API (axios), CSRF helpers, CSP builder, sanitization (DOMPurify), redirect guard, rate-limit util, KYC helpers, config + env validation."],
        ["lib/web3/", "wagmi/viem config, contract ABIs/addresses, hooks (useContribute / useUserContribution / useVesting etc.), SIWE builder/verifier."],
        ["middleware.ts", "Edge middleware: auth gate, role gate (admin routes), security headers, CSP with per-request nonce, open-redirect guard."],
        ["next.config.mjs", "Security headers, SRI, build-time validation of NEXT_PUBLIC_API_URL / NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID."],
        ["audit/findings.json", "Machine-readable audit findings — source of truth for the readiness score."],
        ["scripts/", "compute-audit-score.mjs (CI), generate-audit-pdfs.py (this file)."],
        [".github/workflows/ci.yml", "Lint → test → build → CodeQL → dependency review → npm audit → Pre-ICO readiness score."],
    ]
    t = Table(repo_rows, colWidths=[4.5 * cm, 12.5 * cm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)

    story.append(Paragraph("3. Architecture", styles["h1"]))
    story.append(Paragraph(
        "• <b>Frontend.</b> Next.js 15 App Router, Server Components where possible, "
        "Tailwind for styling, TanStack Query for remote state caching, RainbowKit + wagmi "
        "+ viem for wallet UX.<br/>"
        "• <b>Auth.</b> SIWE (EIP-4361) message signed in the wallet, verified by the "
        "backend, which then issues an httpOnly JWT cookie. CSRF uses the double-submit "
        "cookie pattern (XSRF-TOKEN read on the client, echoed in X-XSRF-TOKEN header).<br/>"
        "• <b>KYC.</b> SumSub. The frontend fetches an applicant token from the backend, "
        "renders SumSub's SDK, and polls an is-verified endpoint before enabling the "
        "contribution form.<br/>"
        "• <b>On-chain.</b> The contribution form calls <font face='Courier'>contribute()</font> "
        "on the sale contract with a chain-id guard and SIWE-authenticated wallet. "
        "Vesting is read from a separate vesting contract; claims are triggered by the user.<br/>"
        "• <b>Security headers.</b> CSP with Trusted Types, per-request nonce, "
        "<font face='Courier'>base-uri 'self'</font>, <font face='Courier'>frame-ancestors 'none'</font>, "
        "<font face='Courier'>object-src 'none'</font>, SRI, HSTS, "
        "X-Content-Type-Options, Permissions-Policy.",
        styles["body"],
    ))

    story.append(Paragraph("4. Token model (summary)", styles["h1"]))
    story.append(Paragraph(
        "• Utility token used to unlock premium CRM features and contributor dashboards.<br/>"
        "• Pre-ICO allocation sold via a whitelisted, KYC-gated contribution contract.<br/>"
        "• Vesting enforced on-chain; cliff + linear release per tranche.<br/>"
        "• Expected chain id is validated client-side (EXPECTED_CHAIN_ID) and again by the "
        "wallet at signing time. Domain + chain id + nonce + issued-at are bound into every "
        "SIWE message to prevent replay across chains or deployments.",
        styles["body"],
    ))

    story.append(Paragraph("5. Compliance posture", styles["h1"]))
    story.append(Paragraph(
        "Dedicated legal pages are served under /privacy, /terms, /dpa, /cookie-policy, "
        "/data-practices. /data-export implements GDPR Art. 20 (portability). A cookie "
        "consent banner is rendered before any non-essential storage is written. KYC / "
        "AML is mandatory for any contribution above zero. Final legal review by qualified "
        "counsel is still pending (see gaps).",
        styles["body"],
    ))

    story.append(PageBreak())
    story.append(Paragraph("6. Security audit summary", styles["h1"]))
    verdict_color = (
        colors.HexColor("#065f46") if score >= data["metadata"].get("passThreshold", 70)
        else colors.HexColor("#991b1b")
    )
    story.append(Paragraph(
        f"Readiness score: <b>{score}%</b> &nbsp; "
        f"Verdict: <font color='{verdict_color}'><b>{esc(data['verdict']['overall'])}</b></font><br/>"
        f"Open findings: High <b>{counts['High']}</b>, Medium <b>{counts['Medium']}</b>, "
        f"Low <b>{counts['Low']}</b>. Formula: "
        f"<font face='Courier'>{esc(data['metadata']['scoreFormula'])}</font>.",
        styles["body"],
    ))
    story.append(Paragraph(esc(data["verdict"]["summary"]), styles["body"]))

    story.append(Paragraph("Top-severity items", styles["h2"]))
    for f in data["findings"]:
        if f["severity"] != "High":
            continue
        story.append(Paragraph(
            f"• <b>{esc(f['id'])}</b> — {esc(f['file'])}:{esc(f['lines'])} — "
            f"{esc(f['title'])}",
            styles["bullet"],
        ))

    story.append(Paragraph("7. Gaps before a Pre-ICO Independent Audit", styles["h1"]))
    for g in data.get("gaps", []):
        story.append(Paragraph(f"• {esc(g)}", styles["bullet"]))

    story.append(Paragraph("8. Roadmap", styles["h1"]))
    story.append(Paragraph(
        "1. Close all High and Medium findings (see <font face='Courier'>AUDIT_CHECKLIST.md</font>).<br/>"
        "2. Commission an independent backend security audit and a smart-contract formal "
        "verification engagement.<br/>"
        "3. Run a third-party penetration test against the staging environment.<br/>"
        "4. Launch a managed bug-bounty program 4–6 weeks before public sale.<br/>"
        "5. Finalize legal review of Privacy Policy, Terms and DPA.<br/>"
        "6. Stand up monitoring (CSP violation reports, 401 spikes, tx-failure rate) and "
        "document the incident-response plan.<br/>"
        "7. Re-run the full audit, enable <font face='Courier'>--enforce</font> on the "
        "readiness-score CI step, and publish the signed report.",
        styles["body"],
    ))

    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph(
        "This white paper is generated from audit/findings.json alongside the audit "
        "report. Cross-reference PRE_ICO_AUDIT_REPORT.pdf for per-finding detail.",
        styles["small"],
    ))
    return story


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
def render(pdf_path: Path, story: list) -> None:
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=pdf_path.stem.replace("_", " "),
        author="Pre-ICO Security Audit",
    )
    doc.build(story)


def main() -> int:
    if not FINDINGS.exists():
        sys.stderr.write(f"Missing findings file: {FINDINGS}\n")
        return 1
    data = load_findings()
    styles = make_styles()

    render(AUDIT_PDF, build_audit_report(data, styles))
    render(WHITE_PAPER_PDF, build_white_paper(data, styles))

    score, _ = compute_score(data)
    print(f"Wrote {AUDIT_PDF.relative_to(ROOT)} ({AUDIT_PDF.stat().st_size} bytes)")
    print(f"Wrote {WHITE_PAPER_PDF.relative_to(ROOT)} ({WHITE_PAPER_PDF.stat().st_size} bytes)")
    print(f"Readiness score: {score}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
