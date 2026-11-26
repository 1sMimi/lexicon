# Lexicon
Read. Learn. Remember.

**[Open Lexicon](https://1smimi.github.io/lexicon/)** is the live app. No installation or account is needed to try it.

A local-first personal vocabulary and reading workspace. React, TypeScript, Vite, Dexie and FSRS; no AI account required. Learning data stays in the current browser by default. Hosted sign-in needs owner configuration before use.

## Run
Requires Node 24 and pnpm 11.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm exec vite preview --host 127.0.0.1
```

Use the production preview for service-worker/offline tests. First visit requires network access to download the application and dictionary. Subsequent installed resources and IndexedDB records work locally. Browser data can be evicted: use Settings → Export full backup regularly. Restore merges rather than resetting the database.

## Deployment
The Pages workflow validates and deploys pushes to `main`. Create a GitHub repository, push the source, and select **GitHub Actions** as the Pages source in repository Settings. The live app is already hosted on GitHub Pages. Relative Vite base and hash routing support repository subpaths and route refreshes. For another static host, publish `dist` over HTTPS. Test service worker scope and installability on your actual host/device. Mainland China connectivity to overseas hosting is not guaranteed.

## Privacy and attribution
No automatic upload of notes, study events, screenshots or reading files. ECDICT is third-party MIT dictionary data, not an official complete exam list. See public/data provenance and license files. Fonts are bundled through Fontsource with their distribution licenses. Speech is synthetic and device-dependent; offline voices are not guaranteed.

## Product and progress
See docs/PRODUCT.md, docs/ARCHITECTURE.md, TASKS.md and MEMORY.md. The design-skill waiver is recorded in AGENTS.md. Incomplete features and verification limitations are recorded in TASKS.md; do not equate an interface or provider contract with configured cloud sync.

## Verified delivery state
Typecheck, 16 unit/integration tests and production build passed. Chromium production flows passed: persisted notes/status, FSRS study, reader lookup/chapter wordbook, journal, PDF/EPUB import, backup roundtrip, mobile route overflow checks, offline reload and dictionary lookup. Desktop/mobile screenshots are in outputs.

Optional cloud setup is documented in docs/SYNC.md and supabase/migrations/001_sync.sql. Hosted email and GitHub sign-in setup is documented in [docs/FIREBASE.md](docs/FIREBASE.md). Live cloud sign-in and two-device sync have not yet been verified. Remaining scope includes reliable lemma/sense disambiguation, cloud document storage, richer question types, expanded analytics and full original-PDF-view acceptance. See TASKS.md.
