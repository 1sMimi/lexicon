# Lexicon — Master Development Prompt V2.0 / Revised UI V3
Read. Learn. Remember. Personal offline-first vocabulary and reading PWA. User-approved 2026-11-26. This document records the implementation requirements; the original chat contains the complete submitted specification.

## Execution and scope
Build a functional maintainable modular monolith. No mock dictionary data, statistics, tests or deployment claims. Preserve existing user data. Free/local-first; no mandatory AI. No social, ads, payments, leaderboards, speaking assessment or microphone. P0 precedes P1; P2 must not block delivery. Use independent parallel modules. Maintain AGENTS, MEMORY, architecture, tasks and README.

## Stack
React, strict TypeScript, Vite, CSS tokens, PWA manifest/service worker, Dexie IndexedDB, Router, ts-fsrs. Mature local parsers for PDF, DOCX, EPUB and XLSX. Vitest and browser tests. GitHub Actions/Pages; replaceable Supabase Auth/Postgres/RLS sync. No mandatory dedicated server or proprietary hosting.

## Visual authority
Editorial typography and contemporary minimalism. Background #F8F9FA, surface #FFFFFF, text #191919, secondary #686868, border #E0E2E4. Default accent #D9F36B; selectable #8DAEF5, #BDB4F5 or #F3A16C, never multiple simultaneous dominant accents. 80–90% neutral. Main blocks 0–4px radius, cards 0–6, controls 2–4; thin borders, no decorative shadows/pills/beige. Cormorant Garamond headings/words, Source Serif 4 English reading, Manrope UI, FangSong/STFangsong Chinese definitions/notes. Self-host distributable fonts. Quiet adjustable reading, dark mode, desktop sidebar/mobile navigation. Reference screenshot provides typography/composition, not user statistics. Real browser screenshot and interaction QA required.

## Navigation
Today: new/due tasks, current book, recent reading, progress, resume. Library: four built-ins, personal and reading books, lookup, filters, imports/exports. Reader: folders, books, chapters, lookup/progress. Study: new/review/special practice. Notes: shared notes and sources. Insights: analytics and independent Vocabulary Journal. Global Settings.

## Vocabulary and dictionary
Real ECDICT https://github.com/skywind3000/ECDICT. Reproducible download/parse with license, version, fields, counts and provenance. High Frequency 3000 from reliable frequency rank; TOEFL/IELTS/GRE from actual source tags; GRE prioritized. Third-party lists are not official complete exam lists. Lazy resource downloads and progress. GRE sorting frequency, unfamiliarity, errors, due priority.
Personal books: manual/paste/TXT/CSV/XLSX/reading extraction, custom names, preview/dedup, CSV/JSON export. Many-to-many memberships; global normalized word identity shares status, FSRS, notes, mistakes, bookmark and reading sources. Preserve surface/lemma/POS/senses; conservative reliable morphology, no destructive stemming. States: unassessed, known, unknown, learning, reviewing, mastered. Known is not mastered.
Replaceable DictionaryProvider. Only display actual source translation/definition/phonetic/POS/morphology/frequency/tags. Missing fields explicit. User additions include meanings/examples/collocations/synonyms/mnemonics. Official external Oxford and Cambridge lookup links. No unauthorized commercial scraping. Synthetic UK/US speech, repeat/rate; availability depends on device. MDX/MDD/audio adapters future.

## Reading
Text PDFs with original pages/text layer and feasible extracted mode, EPUB, DOCX, TXT, Markdown, paste. Scans/OCR/DRM/complex math excluded from guaranteed scope. Folders/course categories/books/chapters, recent reading and position restoration. Tap/select word for local lookup, speech, official links, known/uncertain/unknown state, bookmark, target book, note and contextual source sentence/location. Desktop drawer/mobile sheet; preserve position. Toggle state markings; distinguish state beyond color. Immediate shared state updates.
Local extraction: text, tokenization, reliable lemmatization, unique frequency, match shared state, document vocabulary. Frequency/difficulty/state filters, locations, batch status, personal/chapter books and pre-study. Unassessed is not unknown. No automatic upload of private documents; sanitize imported HTML.

## Learning and review
Recognition shows word, source phonetics/definitions/POS/notes/examples; known skip or study. Spelling from definition with feedback/retry/hint/answer; then schedule. ts-fsrs Again/Hard/Good/Easy; persist difficulty/stability/due/retrievability-related state and full unique logs, response time, question type, correctness, rating. Retention/new-word quota configurable; due first. Adaptive weighted random questions from genuine data: meaning choices, recall, definition-to-word, listening, dictation, spelling; context/morphology/synonym/collocation only with valid source evidence. Dimensions recognition/meaning/listening/spelling/recall/application; unassessed where no evidence. Optional AI later.

## Notes and analytics
Global word notes CRUD/search/autosave, text or Markdown, sources, sync. Visible in new learning and review feedback; hide before answer unless preference enabled. Every chart uses real events and globally unique words. Daily new/reviews, cumulative learned/known/mastered, accuracy/time/activity heatmap/growth/book completion/status/question accuracy/difficult words/future due load. Date filters day/week/month/all; explicit calculation definitions.
Vocabulary Journal separate from internal mastery: external test https://preply.com/en/learn/english/test-your-vocab and methodology /how-it-works. Manual historical/current CRUD, optional screenshot, line chart/high/latest/interval/delta. Fields id,testDate,estimatedVocabularySize,sourceName,sourceURL,optionalNotes,optionalScreenshot,createdAt,updatedAt. Preserve historic sources; no assumption cross-source equivalence, public result API or automatic account import.

## Storage, offline and sync
IndexedDB tables: words, word_senses, wordbooks, wordbook_memberships, user_word_states, fsrs_cards, review_logs, notes, documents, document_chapters, reading_positions, word_occurrences, vocabulary_tests, settings, sync_outbox. Schema migration, stable IDs/timestamps/versions/tombstones. Public static dictionary separate from private data; unique event logs prevent double counts.
Offline downloaded study/review/dictionary/docs/states/bookmarks/notes/analytics/journal via service worker and IndexedDB. Resource/storage/offline indicators, quota awareness/persistence request, update handling, validated full JSON backup/merge restore. Browser storage can be evicted.
Replaceable SyncProvider: local writes/outbox/incremental retry/idempotency/conflicts/status/manual sync/last sync. Merge review events and replay scheduling when required. Never silently discard conflicting notes. User-level RLS. Raw files local by default; explicit opt-in private cloud storage only. Launch/foreground/online sync triggers; background not guaranteed. No admin secrets or private records in public repo.

## Deployment and acceptance
GitHub source + Actions install/typecheck/test/build/deploy; Pages static base, hash routing, manifest/scope/HTTPS/update/install/custom domain compatibility. Supply .env.example, SQL migration, setup and deployment docs. GitHub never runtime database. No client long-lived GitHub token. Providers replaceable; Mainland China accessibility not guaranteed. Missing cloud authorization does not block local delivery.
Verify mobile/desktop, fonts/visual style, real four books/GRE priority/shared state/offline dictionary, recognition/spelling/FSRS/adaptive practice, notes persistence, real reader and lookup/bookmarks/extracted books/progress, real analytics/journal, refresh persistence, offline functionality, non-destructive restore, configured sync/conflict preservation, Pages build/PWA paths/privacy and no inert buttons.
P0: infrastructure/data/dictionary/study/review/notes/offline/backup. P1: reader/full analytics/journal/sync/deploy. P2: advanced questions/MDX/audio/web import/OCR/extensions/result extraction/optional AI.

## V4 override
[Final Product Update V4.0](PRODUCT-V4.md) overrides conflicting V2/V3 requirements. Keep unchanged requirements. The final session addendum replaces immediate new-word spelling with interleaved delayed recall. Default new-word quota is 30, including a configurable zero. New reading files are eligible for private cloud sync after sign-in and explicit first-use consent when that feature is implemented.

## Today preferences
List the four built-in books from introductory to advanced: High Frequency 3000, TOEFL, IELTS, GRE. Keep the GRE study tile as the default new-word shortcut. Put a clearly labeled Quick Assessment link above the study tiles; a familiar word is marked Known and omitted from first-time study. Keep Regular available while increasing the default typography weight.
