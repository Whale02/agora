---
name: agora-cycle
description: Publish one new source-grounded Agora philosopher debate using Claude Code's signed-in subscription, with no separate Anthropic API generation or eval calls.
---

# Agora cycle: subscription-first, no external model API

Goal: produce and publish ONE new philosophical debate for the GitHub Pages site. Work within the current repo. The repository's Anthropic API key is reserved for the separately approved, manual API workflow and visitor replies; do not use it here.

1. Confirm this Claude Code session is authenticated with the claude.ai subscription. If it is running against Anthropic Console/API billing instead, stop and report that billing risk. Check git status and pull --ff-only; preserve existing changes. Never trigger heartbeat.yml, npm run heartbeat, npm run respond, Anthropic SDK messages.create, any external LLM judge, or a model-based hallucination test.
2. Read docs/data/topics.json and docs/data/philosophers.json. Pick exactly one UNUSED topic, preferably one with clear disagreement between 2-3 of its suggested philosophers. Read the relevant philosophers' identity, positions, voice, relationships, and works. Do not read every corpus JSON into your context.
3. For every turn, retrieve relevant pages using the local ownPages function from engine/lib.mjs, with the exact topic and prior drafted messages. For example, use a short node --input-type=module script importing ownPages and printing a handful of results. Its retrieval runs locally without a model/API key. Only quote verbatim language that appears on those returned pages (or in the previous conversation). If pages are absent, argue without inventing quotations. Keep the public-domain translations and original language intact. Consult writing/de-ai-slop-rulebook.md.
4. Create /tmp/agora-draft.json containing exactly this shape:
   {
     "topic": "EXACT unused question from docs/data/topics.json",
     "participants": ["first-philosopher-slug", "second-philosopher-slug"],
     "heat": 0.65,
     "messages": [
       {"speaker": "first-philosopher-slug", "content": "A substantive, grounded opening position of at least 30 characters."},
       {"speaker": "second-philosopher-slug", "content": "A direct, grounded challenge of at least 30 characters."},
       {"speaker": "first-philosopher-slug", "content": "An actual response to that challenge."},
       {"speaker": "second-philosopher-slug", "content": "A further response that develops the disagreement."}
     ]
   }
   These are illustrative strings, not content to publish. Write 4-8 actual turns, 2-4 short paragraphs maximum per turn, with every seated thinker speaking. Heat is an editorial estimate in 0..1, never an API-judged score. Keep replies in the original project's English dialogue style; the site's UI already switches English/Chinese.
5. Run npm ci if dependencies are missing, then:
   - node --check scripts/publish-local.mjs
   - node engine/test-retrieve.mjs
   - node scripts/publish-local.mjs /tmp/agora-draft.json --check
   The publisher checks roster, topic uniqueness, prose tells and exact long quotations against the local retrieved pages. Fix the draft using the same subscription session if it fails. No paid API test is authorized.
6. When those commands pass, run node scripts/publish-local.mjs /tmp/agora-draft.json. This writes the conversation JSON, marks its topic used, rebuilds the index, OG share page and Atom feed without a model API call. Inspect git diff --stat and the new conversation. Commit only intended docs/ changes and push to the connected repository if permitted. If cloud GitHub permissions require a branch/PR, create one and report that instead of claiming the website is live. Do not alter unrelated files.
7. Report the conversation URL, commit or PR URL, tests run, and a clear statement of whether any separate paid API was used.

Do not schedule this skill from GitHub Actions. For subscription-based unattended runs, use Claude Code's cloud /schedule feature with the repo connected and request execution of /agora-cycle; that schedule is managed in Claude's product and is subject to subscription usage limits.
