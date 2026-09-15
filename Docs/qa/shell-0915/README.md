# Item 77 — the signed-in shell is a layout route, mounted once (ORDER-SHELL-0915)

**Probe.** 33 `<AppShell>` render sites in 15 files under `src/features/`,
four props (`title`, `context`, `actions`, `children`); the settings
sub-layout renders one too with its own `NavIndicator` under the tablist. No
unit test renders a screen. 21 specs touch the rail (`[data-sidebar="sidebar"]`)
or the busy markers; none depends on a per-screen shell. The content entrance
(`data-ab-enter`) was keyed on "this shell's first `ready`", which only meant
"per arrival" because every screen mounted its own shell. `MarketingLayout`
already gates `/` (bare outlet when signed in). First light lives above the
router in `app.tsx`. `useScreenPhase` is provider-wide, not per screen.

**Fix.** `src/components/ab/app-shell.tsx` — `AppFrame` is the chrome (rail,
top bar, banners, the section rhythm, the content entrance) and mounts ONCE;
`AppShell` keeps the props every screen passes and DECLARES its top bar to the
frame through `ShellChromeContext` (`shell-chrome.ts`) in a layout effect,
rendering its children into the frame's `main`; a screen with no frame above
throws. The entrance re-arms per location key (a new arrival inside the
previous play's 600 ms restarts clean). The rail and the top bar's chips are
memoised so a declaration costs the header, not the whole chrome.
`src/routes.tsx` — `WorldLayout` above both worlds: signed in with a
workspace on a non-marketing path → `<AppFrame><Outlet/></AppFrame>`; the
marketing paths and `/` otherwise → `<MarketingLayout/>`; an app path outside
the frame world → a bare outlet, so every guard answers as before. The app
routes and `/` are its children; the auth screens, the redirects and the dev
pages stay outside. `RouteFallback` centres in the frame's main when inside
one. No screen file changed. Ruled D-SHELL-0915-A.

**Route arrivals — proof E's clock, measured before and after.** From `/`
(Dashboard), a client-side return between hops (proof E's `go()`: pushState +
popstate — a reload re-validates every module of the next chunk against the
dev server and measures the network, ≈350 ms; see
`timings-before-reload-method.md`), click a rail link, until `main` carries
the screen's own text. Three runs per route per mode; the first run of each
route is the cold chunk load, the next two the warm hops the range describes.
Today's marker is "Needs review" (proof E's "ready for review" also sits in
the Dashboard's notifications, so that hop read as arrived at once).

| route | before (warm, motion) | after | before (reduced) | after |
|---|---|---|---|---|
| Today | 73, 65 | 52, 48 | 77, 71 | 49, 49 |
| Billing | 65, 62 | 25, 23 | 68, 64 | 24, 22 |
| Settings | 95, 94 | 67, 65 | 86, 82 | 67, 67 |
| Studio | 58, 55 | 32, 30 | 57, 55 | 31, 30 |
| Calendar | 56, 52 | 35, 35 | 53, 56 | 34, 32 |
| median, all hops | 73 | **52** | 77 | **49** |

Every route arrives sooner; nothing regressed above the post-A2 range. The
indicator: re-created on 15 of 15 hops before, the same node on 15 of 15 after,
in both modes (`timings-before.md`, `timings-after.md`, `.json`). TEST-0915's
own probe re-run unchanged on Part A's tip (`test0915-reduced-before.log`)
reads Today 69 · Billing 355 · Settings 671 · Studio 343 · Calendar 326 ms —
its `go()` is client-side too, but its five hops are each a route's FIRST
visit in that context (the cold chunk), which is why the morning's 53–90 ms
are the warm numbers and the table above compares warm with warm.

**Identity.** `e2e/shell-identity.spec.ts` (static): the rail's indicator is
tagged on the Dashboard; through Today, Billing, Calendar and Settings the
tagged node is still there, the rail and the `main` are the same nodes, one
`main` and one rail indicator at every stop (Settings' tablist indicator is
scoped out); the same walk under reduced motion. Green 2 / 2
(`identity-with-frame.log`); with a second `AppFrame` around Billing both
walks fail at Billing with `mains: 2, indicators: 2`
(`identity-second-frame.log`); green again after the revert
(`identity-reverted.log`). Each run alone at `--workers=1`.
`src/components/ab/app-shell.test.tsx` holds the seams (the declaration, the
throw, the same nodes across a hop, the entrance per arrival), 4 / 4 —
jsdom needs a `ResizeObserver` that notifies on observe, as the browser does,
because the indicator's first measurement comes from that notification.

**One static red, and what it said.** The first full static run
(`static-e2e-run1.log`: 118 passed / 1 failed / 90 skipped) went red on
`design-layer.spec.ts` "keyboard-only walk of the app shell": the spec
started tabbing the moment `main` was visible, and the persistent frame makes
that true before the Dashboard's chunk has arrived — the busy fallback sits
inside `main` — so thirteen chrome stops ran out before any content stop
(`design-layer-alone.log`, deterministic). A walk dump on this tree reaches
`main` at press 14 once the Dashboard is there. The spec now waits for the
Dashboard's own heading (declared by the screen on arrival) and for the busy
marker to clear — licensed in D-SHELL-0915-A — and passes alone
(`design-layer-after-wait.log`, 4 / 4).

**Cheap checks on this tree (second run, after the spec wait).** `lint.log` ·
`typecheck.log` · `guard-static.log` clean · `unit.log` 829 / 829 in 74 files ·
`static-e2e.log` **119 passed / 0 failed / 90 skipped** in 360 s, one worker
(`Running 209 tests using 1 worker`).
