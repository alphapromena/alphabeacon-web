# Claims map — Website V1 (rb/02-v1-brief)

Every marketing claim the new site makes, against what the product and API
actually support today (INT-0…5 reality, `.agent/state.md`). Verdicts:

- **true now** — the shipped product/API does this today
- **true by construction** — the architecture enforces it; no launch risk
- **coming soon label** — sellable only with a clear roadmap label
- **founder decision** — the claim sells the V1 target ahead of the build;
  Abdullah signs off (or the copy softens) before launch (brief §34)

Integration reality this table is seeded from — live today: auth,
orgs/teams/invites/roles, brand voices + tones (name/description/preset
only), schedules, event sources (holiday feeds), notifications. Not live:
drafts/Today pipeline, channel connections/publishing, Studio generation,
billing, analytics, source traceability.

| # | Claim on the site | Where | Product reality today | Verdict |
|---|---|---|---|---|
| 1 | "Nothing publishes without you" / approval-before-publish | Hero sub, S5, §23 section, FAQ 1 | The state machine makes an unapproved publish unrepresentable; API + DB enforce transitions | **true by construction** |
| 2 | Team review, roles, invites ("Can my team review and approve?") | FAQ 8 | Orgs, members, invites, roles live (INT-2) | **true now** |
| 3 | You can edit a draft before it goes out | S5, FAQ 9 | Draft editing is core product flow; approval gates publishing | **true by construction** |
| 4 | "It remembers your business" — brand voice, preferences | S3, §21 memory section, FAQ 2 | Brand voices + tones live (name/description/preset). Products/audience/approved-facts/approval-history memory NOT yet in API | **founder decision** (partially true now; the fuller memory story sells the V1 target) |
| 5 | "Malaky knows what's coming" — calendar/occasion awareness | S4, §26 section | Schedules + event sources (regional holiday feeds) live (INT-4) | **true now** (the *awareness* half) |
| 6 | "…and prepares campaigns before the opportunity arrives" | §26 section, hero promise | Drafts/Today pipeline not live yet — nothing is auto-prepared today | **founder decision** |
| 7 | "Built overnight" / "your marketing is already waiting" | S2, workspace section | Same as #6 — the proactive drafting pipeline is the V1 target, not shipped | **founder decision** |
| 8 | Native Arabic generation, real RTL creative | S2 card, §24 section, FAQ 3 | Studio/compose generation not live; RTL presentation on the site itself is real and verified by e2e | **founder decision** (generation) / **true now** (RTL presentation) |
| 9 | Executive/personal LinkedIn content alongside company | §25 section, FAQ 4 | Multi-voice generation not live; tones/voices data model exists | **founder decision** |
| 10 | Channel adaptation — one idea shaped per channel | §22 section | Demonstrated with demo content; generation not live | **founder decision** (as a product capability claim; the demo itself is honest illustration) |
| 11 | Publishing to any SPECIFIC channel | §22 labels, S6, FAQ 5 | Channel connections/publishing not live for ANY channel | **coming soon label** — never name a channel as live-publishing; S6 shows direction, not delivery |
| 12 | "What happens when a channel is not connected?" | FAQ 6 | Workflow answer: drafts still prepared, publishing waits — consistent with the designed flow | **true by construction** (as phrased) |
| 13 | Factual claims traceable to your sources | §27 section, FAQ 7 | Source traceability not live; copy avoids absolutes ("when a factual claim matters, you can see where it came from") | **founder decision** — §27 phrasing stays conditional |
| 14 | Learning loop — "future drafts improve from your decisions", "Memory updated from your approval" | S5 touch, §20 step 5, §21 | Not live; no approval-signal learning in API | **founder decision** |
| 15 | Data protection ("How is my company data protected?") | FAQ 10 | Org-scoped data is real; formal security/compliance story not written | **founder decision** — generic honest answer shipped, specifics flagged |
| 16 | Cancel / change plans | FAQ 11 | Billing not in the API at all | **founder decision** — generic answer shipped, flagged |
| 17 | Analytics / performance feedback | (not claimed on V1 page) | Not live — and deliberately absent from the page | n/a — keep absent |

Rules derived from this table (enforced in copy review, some in verify):

1. No specific channel is ever named as live-publishing (#11). Channel
   names on cards identify FORMAT; roadmap channels carry a visible label.
2. §26/§27 copy stays conditional exactly as written — no "every fact is
   sourced", no autonomous-knowledge claims (#6, #13).
3. Every **founder decision** row is mirrored in `.agent/open-items.md`
   (item 16) and blocks LAUNCH, not this branch's merge — the site sells
   the V1 target per §35; §34 is the launch gate.
