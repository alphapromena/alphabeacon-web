# DEMO-0914 §1 — the probe table

What a **fresh account** actually sees, screen by screen, recorded before any
code was written. The two transcripts beside this file are the evidence:
`static-preview/transcript.md` and `live-preview/transcript.md`.

## What was probed, and why both

**The preview this branch will get is STATIC, and that is measured, not
assumed.** `VITE_API_BASE_URL` exists in the Vercel project in exactly two
scopes — `production`, and `preview` **pinned to the `live` branch**. A preview
of `feat/demo-0914` therefore gets no API base at all and boots the fully
static app. So the walk the design owner is about to take is the static one.

The live half is probed anyway, because §1 asks each screen to be classified as
missing seed data / the wire returning nothing / awaiting the backend — and two
of those three can only be told apart against the wire.

| Run                | Target                                        | Account                              |
| ------------------ | --------------------------------------------- | ------------------------------------ |
| **static preview** | the branch's own production build, `vite preview` | signed up fresh, zero network requests |
| **live preview**   | `https://1.malaky.ai` (the `live` branch preview, dev API) | signed up fresh, real org on the dev tenant |

The static target is the built artifact rather than the dev server on purpose:
`DEFAULT_DATASET_ID` is `visitor` in a production build and `active` in a dev
one, so a dev server would have shown the Atlas demo tenant and answered the
wrong question entirely.

## The table

Legend for **why empty**:

- **(A) missing seed data** — the rows are client-side dataset rows and nothing
  puts any there when a workspace is created. Fillable in this order.
- **(B) the wire returns nothing** — the endpoint exists and the fresh org
  genuinely has no rows yet. Not fillable without faking server state.
- **(C) awaiting backend** — no endpoint exists for this at all.

| Screen | Fresh account sees — static preview | Fresh account sees — live | Why empty |
| --- | --- | --- | --- |
| **Today** | "Your queue is clear", then the card "Malaky needs your brand voice first" with **Finish setup**, and **Finish setup to generate** in the header. No slots, no drafts. | "0 need review", "Nothing here — Nothing waiting for review — generate posts to start", **Finish setup to generate**. | **(A)** static: `drafts` and `slots` are dataset rows and the signup path writes none. **(B)** live: the proposals ledger is real (`/alphastudio/posts/runs`) and this org has no runs. |
| **Studio** | **Populated** — all 13 capability cards with their real prices. Only `/studio/jobs` ("Your renders") is empty. | **Populated** — the same 13, granted by the wire. `/studio/jobs` empty. | **(A)** static, for `jobs`/`assets`. **(B)** live: `GET /media/jobs` exists and has none. The grid itself was never the problem. |
| **Brand** | Brand voice: "No rules yet". Tones: **the five sample tones are already there** — this is the existing client-side seeding the order refers to. | Brand voice: "No rules yet". Tones: **"No tones yet — Create your first one"**. | **(A)** static voice. **(B)** live both: `voices`/`tones` endpoints exist, the org has written none. The tone divergence between the two modes is real and is called out below. |
| **Schedule** | `/calendar`: "Nothing scheduled yet". `/calendar/settings`: an untouched form — no active days, no tones picked, "Up to 0 drafts a week, in 0 tones, drafted by —". | Identical wording, same untouched form. | **(A)** static: `schedule`, `slots`, `eventSources`, `events` all start empty. **(B)** live: `/schedules` exists, the org has none. |
| **Connections** | Four cards, all "Not connected", X "Coming soon". Pressing **Connect** simulates a successful OAuth return and the card flips to connected. | The same four cards, and **the same simulated success** — nothing server-side backs it. | **(C)** — there is no connections endpoint anywhere in `src/api`. This screen is not empty; in live mode it is worse than empty, because it reports a connection that does not exist. |
| **Analytics** | "No channels reporting yet — connect a channel and turn its analytics permission on to see reach here", → **Go to Connections**. | Identical. | **(C)** — no analytics endpoint exists, and the instruction it gives cannot be followed to a real result in either mode. The promise is false today. |
| **Billing** | **Populated** — Business $599, Scale $899, Enterprise, Subscribe on each, "No payments yet". Subscribe resolves to an in-app demo route, never Stripe. | The same plans **from the wire**, "No balance yet — subscribe", history empty. Subscribe here is a real Stripe test-mode checkout. | **(B)** — the only genuinely-empty part is billing history, and it is empty because the org has never paid. Nothing to seed, and nothing here may be touched. |
| **Settings** | Organization: empty profile fields + the "Brand setup" checklist with 4 of 6 outstanding (tones already Done). Sources, Topics, Knowledge, Team all empty. | The same, except the checklist has **5** outstanding because tones are empty too. | **(A)** static / **(B)** live for voice, sources, topics. Knowledge and Team are real wires with no rows. |

## Three findings the table does not fit

1. **The static preview loses the account on any full page load.** The static
   world is in memory, so a refresh, a pasted URL or a browser Back to a
   reloaded page drops the fresh account back onto the marketing page. The
   first probe run recorded `/` eleven times for this reason; the second
   navigates in-app, which is what a person clicking the rail does. Worth
   knowing before the walk: click through it, do not refresh.

2. **Tones diverge between the modes** — five in static, none in live. That is
   the existing client-side seeding doing its job in the only mode it reaches.
   It is the precedent this order extends, and the reason the extension is
   static-only too.

3. **The two "Finish setup" routes go to the same place**, `/generate` — the
   header button and the empty card's button, both, from the same screen.
   Decided in §4 of the report.
