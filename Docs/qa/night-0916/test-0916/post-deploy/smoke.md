# Post-deploy smoke — https://2.malaky.ai — 2026-09-16T00:21:13.494Z

- login panel: beacon true, breathing "ab-ambient-breathe 20s", accent in the form [button Sign in], Sign in radius 8px, frame on the auth page 0; bundle index-Dtgnuihw.js
- signup qa+1789518042093s3@alphapromena.com: verified with 000000 → Dashboard; first light played once, seen for 1803 ms (paint → gone; ceiling 2000) — UNDER
- after reload: first light mounted false (must be false)
- today: h1 "Today", one frame true, console errors on the hop 0
- studio: h1 "Studio", one frame true, console errors on the hop 0
- settings: h1 "Organization", one frame true, console errors on the hop 0
- billing: h1 "Billing", one frame true, console errors on the hop 0
- toast from its first frame: +40 ms → opacity 1, 13.62:1; +80 ms → opacity 1, 13.62:1; +160 ms → opacity 1, 13.62:1; +400 ms → opacity 1, 13.62:1
- deliberate sign-out from Settings: url /, h1 "Brand voice", session in storage false
- mid-session 401 on /billing: revoke → 204; landed on login true (toast true); after sign-in back on /billing true
- console errors total: 3 — Failed to load resource: the server responded with a status of 401 (Unauthorized) | Failed to load resource: the server responded with a status of 401 (Unauthorized) | Failed to load resource: the server responded with a status of 401 (Unauthorized)
