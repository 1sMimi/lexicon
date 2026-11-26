# Progress — 2026-11-26
## Implemented
- Git initialized; rules, design waiver, product and architecture documents.
- Real ECDICT: 3000 high frequency, 7504 GRE, 6970 TOEFL, 5038 IELTS; 13916 unique core words; pinned provenance, MIT license, 26 optional packs.
- IndexedDB shared state/notes, real FSRS scheduling, logs/replay, recognition/spelling and weighted meaning questions, study settings.
- Personal TXT/CSV/XLSX import preview/dedup and exports. Dictionary drawer/speech/bookmarks.
- Local reader paste/TXT/MD/DOCX/PDF/EPUB, clickable lookup, chapter vocabulary, position and preferences.
- Real analytics and independent vocabulary journal CRUD/screenshots.
- Validated merge backups preserving note variants; offline resources and PWA configuration.
- Optional Supabase adapter, RLS migration and account isolation; cloud remains unconfigured.
## Verification
- Typecheck passed; 16 automated tests passed with current modules.
- Desktop 1440 and mobile 390 screenshots inspected; no homepage horizontal overflow.
- Vite 7 migration resolved malformed production dynamic imports. Typecheck, production build and generated JavaScript syntax check pass.
- Production browser: notes/status persistence, FSRS, reader lookup/generated book and journal passed. PDF/EPUB import, backup roundtrip, every route at 390px without horizontal overflow, offline production reload and dictionary lookup all passed; no page errors.
## Remaining
- Cloud deployment and live RLS/two-device sync need user-owned provider configuration.
- Original PDF page view implemented but pending runtime acceptance; source-form morphology/lemma disambiguation still limited to exact forms.
- Cloud document storage, richer question types, per-sense editing, comprehensive analytics and remaining acceptance checks incomplete.

## V4 delivery checkpoint
- Implemented global font weight controls and Medium defaults, 30 new words by default with zero allowed, interleaved delayed spelling with configurable interval, first-attempt retention, deferred retries and local queue restore.
- Insights now separates first learning from later reviews, reports unique growth, book completion and capability evidence.
- Original PDF canvas, selectable text and most recent reading restored were verified in Chromium on the preceding baseline. Recheck these during final V4 browser acceptance.
- V4 typecheck, 19 tests and production build pass. Pending browser acceptance for new session flows and fonts.
- Outstanding: sense-level schema migration/cards/notes; quick assessment and extra learning plans; Reader layouts/search/stable annotations/bookmarks; keyboard shortcuts and gestures; bilingual UI; optional reminders; private file sync, synced session resume and real RLS/two-device verification; Pages publishing and installed-device validation.

- Private origin `1sMimi/lexicon` created and `main` pushed. GitHub Pages API rejected this repository on its current plan (HTTP 422). CI remains enabled; deployment waits for Pages eligibility and explicit enablement.

## Local acceptance update
- Quick Assessment supports selecting a wordbook, shared known/unknown state, skip/revisit and bulk selection. A separate uncertain state remains open.
- Reader chapter search, text-offset bookmarks and highlights, annotation editing/deletion and backup through settings are implemented. Reader layout modes and cloud annotation sync remain open.
- Study has stage-aware P/B/Space/1–4 shortcuts; N/Esc and optional gestures remain open.
- 21 tests, TypeScript and production build passed. Chromium at 390px verified interleaved recall after refresh and final FSRS rating, font preference persistence, assessment persistence, chapter search and bookmark annotation persistence. Production offline reload and dictionary lookup passed.
