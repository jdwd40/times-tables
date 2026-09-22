# Model usage — Times Tables chunk 3

Run: 20260922-171410-53e87e. No provider token telemetry is exposed to this
session, so all figures below are conservative rounded estimates, clearly
marked. Source: session role mapping from JD's factory model discipline
(factory v0.4) plus direct observation of this session.

| Model | Role | Calls (est.) | Input (est.) | Output (est.) | Notes |
|---|---|---|---|---|---|
| Luna (Codex gpt-5.6-sol) | Orchestration (chunk dispatch, this brief) | 1 | ~4k tok | ~1.5k tok | Prompt+brief in; dispatch text out. Estimated from brief size. |
| Kimi (kimi-for-coding) | Coding (chunk 3 implementation, this session) | ~45 tool calls | ~60k tok | ~25k tok | Full source reads, review.md, 6 files written, 2 test/probe runs, docs. Estimated from transcript volume. |
| Grok 4.6 | Review (chunk 1–2) | 1 | ~12k tok | ~3k tok | review.md length + repo diff scope. Actual review file exists; token figures estimated. |

Totals (estimated): ~47 calls, ~76k input tokens, ~30k output tokens.

Actual measured artifacts (not estimates):
- `npm test`: 37/37 pass.
- CDP probe: 17/17 pass, 0 console errors.

If exact per-call token counts are needed, pull them from the provider
dashboards; nothing in this repo exposes them.
