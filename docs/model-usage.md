# Model usage — Times Tables (chunk 3 + final review fix)

Run: 20260922-171410-53e87e. No provider token telemetry is exposed to this
session, so all figures below are conservative rounded estimates, clearly
marked. Source: session role mapping from JD's factory model discipline
(factory v0.4) plus direct observation of this session.

| Model | Role | Calls (est.) | Input (est.) | Output (est.) | Notes |
|---|---|---|---|---|---|
| Luna (Codex gpt-5.6-sol) | Orchestration (chunk dispatch, final-fix brief) | 2 | ~8k tok | ~3k tok | Prompts+briefs in; dispatch text out. Estimated from brief size. |
| Kimi (kimi-for-coding) | Coding (chunk 3 implementation + duplicate-completion fix, this session) | ~55 tool calls | ~75k tok | ~30k tok | Full source reads, review files, 8 files written, test/probe runs, docs. Estimated from transcript volume. |
| Grok 4.6 | Review (chunk 1–2 first review; final review of chunk 3) | 2 | ~30k tok | ~7k tok | review.md + review-final.md length + repo diff scope. Actual review files exist; token figures estimated. |

Totals (estimated): ~57 calls, ~113k input tokens, ~40k output tokens.

Actual measured artifacts (not estimates):
- `npm test`: 38/38 pass (24 engine + 14 storage) after the final-review fix
  (37/37 before it).
- Final CDP probe (chunk 3): 28/28 pass, 0 console errors.
- Focused duplicate-completion probe: 7/7 pass on fixed code; verified to fail
  5 checks on pre-fix code.

If exact per-call token counts are needed, pull them from the provider
dashboards; nothing in this repo exposes them.
