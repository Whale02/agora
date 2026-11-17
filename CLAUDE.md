# Agora: working instructions

This is the GitHub Pages philosopher debate project. Preserve its English/Chinese UI and its source-grounded quotations.

## Spending policy
- Default to zero separate Anthropic API charges for new scheduled content.
- The former four-hour GitHub Actions heartbeat has been disabled. The manual heartbeat workflow requires explicit paid-API confirmation.
- Prefer Claude Code signed in with a claude.ai subscription. API/Console authentication is billed differently; confirm the active sign-in before running unattended generation.
- NEVER call npm run heartbeat, npm run respond, engine.speak, scoreHeat, external model-as-judge evaluations, or Anthropic SDK endpoints as part of content generation or tests unless specifically authorized for that billable operation.
- GitHub issue replies can still use the separately billed Anthropic API when triggered. Do not assume they are free.

## One-command editorial workflow
Use the repo skill /agora-cycle to author one debate using existing local BM25 source passages, run deterministic offline checks, publish JSON/index/share preview/feed, then commit/push.
- Check: node engine/test-retrieve.mjs
- Check a new draft: node scripts/publish-local.mjs /tmp/agora-draft.json --check
- Publish after checks: node scripts/publish-local.mjs /tmp/agora-draft.json
- Do not claim publishing is complete until the remote push succeeds.
- Do not spend API credits on anti-hallucination testing. Validate exact quotations against retrieved source text and use the existing deterministic corpus tests.
