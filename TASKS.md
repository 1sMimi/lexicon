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

## Release readiness audit
- Optional in-app reminder with time/weekdays and same-day dismissal passed Chromium mobile verification. Background notifications remain outside implemented scope.
- TypeScript, 22 tests and the production build pass. Static release ZIP includes font and dictionary licenses; verified ZIP integrity and direct-upload file constraints.
- Full V2–V4 acceptance matrix is in outputs/ACCEPTANCE.md. Remote main was verified at 09eac4f after another Git transport timeout. GitHub Pages has not published. A serving account or a GitHub plan that supports private repository Pages is needed.

## Public GitHub Pages release
- User explicitly approved public repository visibility. GitHub now serves https://1smimi.github.io/lexicon/ via Actions run 45774260784 from commit aa5282d.
- Git push succeeded using HTTP/1.1 with the GitHub CLI credential helper after earlier transport timeouts. The Pages deploy variable is enabled.
- Chromium verified the live HTTPS subpath, latest reminder screen, registered service worker and an offline dictionary lookup. Native phone installation and cross-device cloud sync remain separate acceptance work.

## Today readability and assessment
- Raised default text weights using bundled font variants. Today lists High Frequency 3000, TOEFL, IELTS, then GRE and shows Quick Assessment before the study tiles. The assessment explains Known versus skipping a question. TypeScript, all 22 tests, and production build passed.

## App update recovery
- Confirmed the published Today order in a fresh Chromium profile. Added a visible update prompt for a waiting service worker and foreground/reconnect checks. Chromium verified a waiting update, explicit activation and preservation of existing browser storage.

## Manual mastery
- New-word recognition can mark a word manually mastered and advance. The mark persists across reloads, is reversible in the dictionary, and is distinguished in Insights. It creates no FSRS card, review log, or study attempt. Chromium verified persistence and isolation across independent browser profiles; typecheck, 23 tests and production build passed. Sense-level scheduling remains outstanding.

## Focused meaning and sign-in
- Dictionary entries can save a personal study meaning. Recognition, delayed recall, and due reviews use that clue; existing word-level FSRS scheduling is unchanged. TypeScript, 23 tests, build and Chromium workflow passed.
- User requests email and GitHub sign-in for cross-device sync without Supabase. Firebase Auth and a private per-user storage adapter require a user-owned Firebase project and account authorization; neither is live yet.

## Firebase hosted sign-in readiness
- Added optional Firebase email/password and GitHub sign-in, a Firestore sync provider and per-user access rules. Verified typecheck, 24 tests, both production builds and Chromium guest/settings rendering with and without test Web App configuration. Project `lexicon-2dcaa` exists per user. Dashboard control timed out; real providers, public Web App config, rules, and two-device account verification remain pending.

## Meaning selection and mobile typography
- Added reversible per-gloss exclusion with tap, double-click and hold-drag. Filtered prompts preserve the existing word-level FSRS record and keep one meaning active. Bundled Zhuque Fangsong with OFL notice for Chinese content on mobile. TypeScript, 25 tests, production build and Chromium gesture/font loading passed.

## Firebase console and live typography verification
- User registered the Firebase Web App for `lexicon-2dcaa`. Enabled Email/Password in Firebase Authentication and verified the provider state. The Firestore console connection timed out; database rules, authorized domain, GitHub OAuth and live two-device verification are pending. Hosted sync remains off.
- Retried Git push successfully. The Pages deployment of `af4bf65` completed, and the official URL passed mobile FangSong and meaning exclusion checks.

## Single current wordbook and bulk mastery
- Today shows one current book and links to All wordbooks. Six built-ins include ECDICT CET-4 (3,846) and CET-6 (5,406). Private imports remain available. Quick Assessment entry retired. Bulk mastery writes shared status but does not delete FSRS history or generate new events. TypeScript, 26 tests, production build and mobile Chromium flow passed.
- User created the default Firestore database in production mode. Console connection timed out before publishing per-user rules. A copy of the reviewed rules is in outputs/lexicon-firestore.rules. Hosted sign-in remains off until rules, authorized domain and real verification are complete.

## Hosted email rollout
- User confirmed publishing the Firestore rules. Set public Firebase Web App configuration as a Pages build variable. Actions run 45833987668 verified anonymous record reads return PERMISSION_DENIED and deployed hosted email sign-in. Chromium verified the live guest workspace and email sign-in/registration controls. GitHub OAuth remains gated until its provider is configured. Authenticated two-device validation and cross-account rule testing remain pending.

## Hosted GitHub login rollout
- User confirmed completing the OAuth console setup. Enabled the production sign-in button and verified that Actions run 45835958186 passed build/deploy. A fresh Chromium session verified the live Settings button and its redirect to GitHub sign-in. Account authorization, return to Lexicon and authenticated cross-device sync remain to be verified.

## Verification email delivery
- User reports no verification email received. An earlier Apple relay attempt showed Firebase accepted the send request. Delivery to a regular inbox is also reported missing and has not been independently verified. Firebase console navigation timed out before inspecting the verification template. End-to-end acceptance requires receiving and opening a real message, then confirming sync access.
- The owner's Firebase screenshot confirms the project uses the default verification template, the project noreply address and the hosted Firebase action handler. This confirms the mail can be identified by sender, not that it was delivered.
- The hosted verification handler returned HTTP 200. The owner found zero matching messages in Gmail, including spam and trash. A proposed production test with a disposable inbox did not run because automatic approval review rejected sending a test verification token to that third-party inbox. A controlled inbox is still needed for delivery verification.
- A Chromium test registered a temporary account using the owner's designated 163.com inbox through the live Lexicon UI. Firebase accepted one verification send request with HTTP 200, and the owner confirmed receipt. The cause of the earlier Gmail non-delivery, temporary account cleanup, link completion and authenticated sync have not been verified. Do not record the recipient address in project files.
- A separate live sign-up test to the owner's Gmail inbox received HTTP 200 for one verification request and HTTP 200 for cleanup of the temporary test account. Gmail receipt is pending user confirmation.
- The owner independently confirmed that the app displays the successful send status while signed in to their Gmail address, but no verification email arrived. That narrows the unresolved issue to delivery after Firebase accepted the request. Existing logs do not establish delivery to the mailbox.

## Google sign-in
- Added hosted Google sign-in behind a Pages build switch. TypeScript, 26 tests and production build passed. Chromium at 390px and 1280px showed all three login controls with the switch enabled. The Firebase console timed out before provider configuration. Activation and real Google sign-in/sync are pending.
- The implementation is committed locally as `ae8f9f8`. The Git transport timed out twice. GitHub main was last verified at `dca61ce` during this rollout.

## Password recovery
- Added Forgot password to hosted email sign-in. TypeScript, 26 tests and a production build passed. Chromium at 390px and 1280px verified that the reset requires a valid email, sends no password, and shows the same generic success message for known and unknown recipients. Browser checks used a mocked reset endpoint and did not send real mail.
- Pushed `ba8658d` and verified GitHub Pages run 46045475051 succeeded. A live Chromium check confirmed the reset button is present and rejects a blank email before submission. Account deletion is pending confirmation of scope.

## Authentication account reset
- The owner confirmed deleting all production Firebase Authentication users while preserving Firestore records and device data. The Firebase users console timed out both on navigation and reconnection, so no account deletion was attempted. Completion requires authorized console access and verification that the user list is empty.
- The owner opened the Users page, but the browser connection still timed out and no accounts were deleted. The Dynamic Links banner applies to legacy mobile email-link and Cordova flows. Lexicon uses web email/password and Firebase-hosted email actions.

## Parallel hosting and account migration
- The owner chose to replace both hosting and the account/sync backend. Added Cloudflare Workers Static Assets configuration and a managed Supabase sign-in form with registration, GitHub OAuth, and PKCE password recovery. The form uses deployment configuration and requires no project setup from visitors. It reuses the existing Supabase sync protocol and per-user SQL policy. Account cleanup and old cloud data are outside this migration step.
- TypeScript, 27 tests, a hosted production build and Cloudflare deployment dry run passed. Desktop and mobile Chromium verified signup, recovery callback/password update and GitHub redirect against mocked API responses. No real accounts or email were used.
- Wrangler has no Cloudflare authentication on this machine. Project-owner access, a Supabase project with production SMTP, and live RLS, mail delivery, two-device sync and migration verification are required before replacing the public URL.
- The owner reported Supabase was ready and Cloudflare's dashboard was unreachable. Local checks returned 403 for Cloudflare login and 200 for Netlify's dashboard. Added a Netlify fallback configuration and verified its missing-variable gate and successful local build (27 tests). The Supabase project and Netlify deploy have not been accessed or configured through the browser.
- The owner created the new Supabase project `gtyeviqcollurlytpzju`. Auth and REST endpoints both responded HTTP 401 without an application key, confirming connectivity only. Connecting to the dashboard timed out. The SQL migration and hosted mail/site setup have not been applied or verified.
- The owner's SQL Editor reported PostgreSQL 42710 because the named read policy already exists. Made the bootstrap transaction repeatable. Local PostgreSQL reproduced the original error and verified two corrected runs, retained existing test rows, owner writes, and denied anonymous/cross-user reads. The corrected migration has not been run on the hosted project.
- The owner reported Success when running the corrected script on the hosted Supabase project. Verification through the hosted Data API still needs the public project key. Production mail and the replacement site are pending.
- The owner provided the publishable configuration. Live Auth health returned 200. Anonymous record reads and write function calls both returned 401. A production build using the real Supabase project rendered the sign-in controls at 390px and 1280px. No test accounts were created and no emails were sent. The attempted temporary Cloudflare upload failed before publication. The owner specified a permanent deployment, so do not retry temporary hosting.
- The owner deployed `https://lexicon-bbu5.netlify.app/`. A clean browser reached Netlify Team Protection (HTTP 401). The Supabase dashboard connection timed out before configuring the final Site URL and redirect allowlist. Live mail, two-device sync and anonymous site access remain unverified.

## TOEFL default
- TOEFL is the current wordbook fallback. Existing explicit selections still take priority, and High Frequency 3000 remains in the catalog. TypeScript, 27 tests and a Supabase-configured production build passed. Chromium at 390px and 1280px verified the default, the TOEFL study shortcut and preservation of a manually selected book across reload.
- Local commit `d973df6` is ready. Two pushes timed out and the GitHub migration branch was still at `a24dd0b` when checked. The Netlify release of this change is pending.
- Published the exact `d973df6` commit to the GitHub migration branch through the Git Database API without force. Netlify did not report a build status to GitHub during the first check, and unauthenticated site access still returns 401. The owner reported completing the Supabase redirect settings; console access timed out before independent confirmation.
- The owner's Netlify Versions screenshot shows `d973df6` as **Live** and **Production deploy**, confirming the TOEFL build is deployed. Project visibility is a separate setting.

## Public deployment and auth check
- Netlify now returns HTTP 200 to guests. Fresh desktop and mobile Chromium sessions showed TOEFL and the hosted email sign-in, registration and password reset controls. Supabase Auth reported email confirmation enabled and GitHub enabled. Its public OAuth endpoint returned a GitHub redirect with the expected callback. Anonymous database access remained denied.
- The live GitHub button was missing even though the provider was enabled. Added its non-secret switch to the Netlify production build and verified the build with 27 passing tests. Live email delivery, the completed GitHub return and dual-device sync remain unverified.
