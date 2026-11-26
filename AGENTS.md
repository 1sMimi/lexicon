# Lexicon development rules
- Follow docs/PRODUCT.md and docs/ARCHITECTURE.md. English code/UI/docs; Chinese conversation.
- User explicitly waived ui-design-handoff-fidelity on 2026-11-26. Master Prompt V2.0 and Revised UI V3 are the design authority; no search, install or simulated execution of that skill is required. Use the supplied screenshot as visual direction, never as seed statistics.
- Use karpathy-guidelines and ponytail. Keep a modular monolith, strict TypeScript, local-first writes and truthful empty states.
- Never read credentials or private environment files. Never commit private documents or user data. Public dictionary data requires attribution and provenance.
- Verify with typecheck, tests, production build and desktop/mobile browser interactions. Update TASKS.md after each phase.
- Maintain MEMORY.md for durable decisions. Missing optional tools must not block independent work.
- Parallel agents may own separate modules; coordinate shared contracts before editing.
