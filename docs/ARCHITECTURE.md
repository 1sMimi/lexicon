# Architecture and acceptance
React + TypeScript + Vite, Dexie IndexedDB, ts-fsrs. Hash routing for static hosting. Static ECDICT dictionary resources separate from private user tables. Word identity is normalized exact spelling, not heuristic stemming; senses and morphology remain source fields. Wordbook membership references global word IDs.

Modules: db.ts (schema and operations), Library.tsx/Study.tsx (P0), Reader.tsx (documents), Insights.tsx (analytics/journal), App.tsx (shell/settings). Local writes are atomic; review event IDs are unique. Backup merge must validate before transaction and never overwrite existing user records silently.

Contracts: Word {id,word,phonetic,translation,definition,pos,exchange,frequency,tags}; Wordbook {id,name,wordIds,source}; UserState {id,status,bookmarked,updatedAt}; Note {id,text,updatedAt}; statuses unassessed/known/unknown/learning/reviewing/mastered. Tables exposed via db. All modules use useLiveQuery.

Acceptance: real source data in four books; cross-book state sharing; persisted notes; spelling and real FSRS due dates; reader import/query/progress; true statistics and editable journal; validated non-destructive backup; production offline navigation; responsive browser QA. Cloud sync and deployment require actual provider configuration and must never be represented as active without it.

## V4 incremental study session
A browser-local draft per study scope stores the event counter, pending recall IDs, first-answer evidence and completed IDs. An eligible recall takes priority over another introduction; an exhausted introduction queue drains pending recall. Only the final rating commits to the existing long-term scheduler. Old FSRS records retain their IDs. Cross-device session restore requires a separate sync extension.
