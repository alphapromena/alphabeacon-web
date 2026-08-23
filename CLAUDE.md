# CLAUDE.md — how to work in this repo

Everything about this project lives in `.agent/` and `web-plan.md`. Read them
before you write code, and keep them true as you go. There are no workflow
scripts — the rules below ARE the workflow.

## Structure

| File                     | What it holds                                     |
| ------------------------ | ------------------------------------------------- |
| `.agent/state.md`        | **Where the build stands right now — read first** |
| `web-plan.md`            | The build order: phases W0–W7, each with Verify   |
| `.agent/context.md`      | What this frontend is, personas, screen glossary  |
| `.agent/stack.md`        | Versions, packages, and the commands to run       |
| `.agent/architecture.md` | App shape, data flow, mode isolation, routing     |
| `.agent/conventions.md`  | shadcn rules, design law, testing, do/don't       |
| `.agent/decisions.md`    | Why things are the way they are (decision log)    |
| `.agent/sessions.md`     | Log of what happened each session (progress)      |
| `.agent/open-items.md`   | Manual gates awaiting a human sign-off            |

`screens4.md` is screen truth and `design.md` is the visual system — both live
in the product docs; never contradict them silently. **`design.md` describes
TWO systems since M2:** Parts 1–6 are the signed-in product, Part 7 is the
visitor world (Abdullah's concept-v2, vendored under
`src/features/marketing/concept/`). They are scoped so they cannot reach each
other; don't blur them.

## Hard rules — follow every time, no exceptions

1. **Read first.** Start with `.agent/state.md` — it says which phase is done,
   which branch holds the code, and the traps that have already cost time. Then
   `context.md`, `stack.md`, `architecture.md`, and `conventions.md`. Check
   `decisions.md` before touching architecture, and skim the last entry in
   `sessions.md` for the most recent turn.

2. **Follow the plan.** Work phases W0–W7 in order from `web-plan.md` (the
   INT-NN integration phases follow the same culture: branch per phase, verify
   before advancing). A phase is done ONLY when its **Verify** passes
   (`pnpm verify:wNN`); paste the output into the PR. **The network law
   (amended 2026-07-30, decisions.md):** network code is legal ONLY in
   `src/api/`, only in live mode (`VITE_API_BASE_URL` set). Everywhere else —
   features, ab/, data/ — there is still no `fetch`, no `EventSource`, no base
   URL, ever; and no `http(s)://` literal anywhere in `src/`. Without the env
   var the app is fully static and the e2e suite asserts zero requests —
   static mode must keep working forever. `ab/no-network`, `guard-static` and
   the e2e assert all enforce this; don't fight any of them.

3. **Use the shadcn skill.** Before creating or editing UI, consult it: run
   `shadcn search` / `shadcn docs <component>` (or the MCP tools) to learn the
   real API — never invent component props from memory. Components enter only
   via `pnpm dlx shadcn@latest add`. Files under `src/components/ui/` are never
   hand-edited; customize via tokens, variants, or wrappers in
   `src/components/ab/`, and record kept divergences (`shadcn diff`) in
   `decisions.md`.

4. **All data comes through the provider.** Features read via `DataProvider`
   hooks (`useDrafts()`, `usePlans()`, …) and never import `src/data/entities/*`
   directly. That one rule is what keeps a future backend a swap instead of a
   rewrite — hold it even when a direct import is shorter.

5. **Every screen, all four states.** A screen isn't done until loading, empty,
   error, and populated all render from the dataset + state switchers
   (`/dev/datasets`, `/dev/states`), keyboard works, reduced-motion removes
   signature animation, and axe is clean.

6. **Log every turn.** After EVERY reply where you change code or make a
   decision, append one entry to the bottom of `.agent/sessions.md` using the
   format at the top of that file — last step of your reply, unprompted. If a
   phase closes with a MANUAL check unperformed, add it to
   `.agent/open-items.md`; only a human moves an item to "Signed off".

7. **Obey the conventions.** `conventions.md` beats your habits. Smallest change
   that does the job — no drive-by refactors or reformatting.

8. **Use the project's commands.** Only commands listed in `stack.md`. After
   changing code, run **lint → typecheck → test** before you say you're done.

9. **Record real decisions.** Non-obvious picks (a library, a divergence from a
   shadcn component, a pattern, a fixture-shape change) get a `decisions.md`
   entry. **No new dependencies without one.**

10. **Keep the docs true.** If your change makes anything in `.agent/*.md` or
    `web-plan.md` wrong, fix that file in the same change. Never guess silently —
    if docs and code disagree, flag it and ask. Finishing a phase (or changing
    the plan) means updating `.agent/state.md` in the same turn.

11. **Never store secrets** in `.agent/`, the plan, or code. There are no
    runtime credentials in this app by design — if a task seems to need one,
    stop and flag it.
