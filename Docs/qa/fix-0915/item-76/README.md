# Item 76 — the toast's entrance rises, it does not fade (ORDER-FIX-0915)

**Probe finding.** sonner ships `[data-sonner-toast] { opacity: 0; transition:
transform 400ms, opacity 400ms, height 400ms, box-shadow 200ms }` and flips
opacity to 1 once the toast is mounted (`node_modules/sonner/dist/styles.css`),
so for the first frames the whole toast — its text included — is composited
over the page at partial opacity. Measured on the BUILT app before the fix
(`probe-before.md`, a `vite build` with `VITE_DEFAULT_DATASET=active` served by
`vite preview`, sampled in page time after the Approve click):

| t after the click | toast opacity | description as rendered | at rest |
|---|---|---|---|
| +51 ms | 0 | 1:1 | 13.62:1 |
| +85 ms | 0.14 | 1.34:1 | 13.62:1 |
| +168 ms | 0.50 | 4.27:1 | 13.62:1 |
| +401 ms | 1.00 | 13.53:1 | 13.62:1 |

Under AA for the first ~170 ms of every toast. axe started at +80 ms happened
to pass in that run (as MOTION-0914/B's did); TEST-0915 proof E's catch was a
matter of timing, which is why the regression test below reads the opacity
and the transition, not axe alone. Under reduced motion sonner's own block
(`transition: none !important`) already gave the end state at the first
sample — opacity 1, transform settled.

**Fix.** One unlayered rule in `src/styles/globals.css` (override 7b), keyed on
the two classes `ui/sonner.tsx` puts on the region and on every toast:

```css
.toaster .cn-toast {
  transition-property: transform, visibility, height, box-shadow;
}
```

Only the property list changes, so sonner keeps its durations (the second slot
names a property the toast never changes, so the shipped durations line up by
index: transform 400, height 400, box-shadow 200), its `transition: none`
while a toast is swiped, and its reduced-motion block. Specificity (0,2,0)
beats the shipped (0,1,0) whichever stylesheet the browser reads last (sonner
injects its own `<style>` at runtime — after ours in a build, before it on the
dev server), which is why this one is not a `:where`. The rise stays; the exit
becomes a cut (the removed state still sets opacity 0, now without the ramp).
No hand edit under `components/ui/`, none of sonner's data attributes in the
selector (CLAUDE.md rule 3). Ruled D-FIX-0915-C.

**Measured after the fix** (`probe-after.md`, the same build pipeline):

| t after the click | toast opacity | description as rendered | translateY |
|---|---|---|---|
| +53 ms | 1 | 13.62:1 | 68 px |
| +87 ms | 1 | 13.62:1 | 57 px |
| +169 ms | 1 | 13.62:1 | 26 px |
| +402 ms | 1 | 13.62:1 | 0 px |

The transition-property reads `transform, visibility, height, box-shadow`; axe
at +80 ms clean; reduced motion: opacity 1 and `matrix(1, 0, 0, 1, 0, 0)` at
+45 ms — the end state. Screenshots `toast-*.png`; the probe is
`scripts/probe-fix-0915-toast.ts`.

**The +80 ms sample in the suite.** `e2e/today-queue.spec.ts` — "@axe the
Approve toast is readable from its first frame — it rises, it does not fade
(item 76)": Approve, wait 80 ms, the toast's computed opacity must be `1` and
its transition-property must not contain `opacity`, then axe's color-contrast
rule must be clean. Proven by breaking: with the rule keyed off (the selector
renamed) the test fails at +80 ms with `Received: "0.31429"`
(`today-queue-rule-broken.log`); with the rule, 9 / 9 before and after the
revert (`today-queue-with-rule.log`, `today-queue-reverted.log`), each run
alone at `--workers=1`.

**Cheap checks on this tree.** `lint.log` · `typecheck.log` · `guard-static.log`
· `unit.log` 825 / 825 in 73 files · `static-e2e.log` **117 passed / 0 failed /
90 skipped** in one worker (`Running 207 tests using 1 worker`; the commit message
says 116 — a slip of one, the log is the record).
