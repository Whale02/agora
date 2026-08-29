Complete the founder-approved outcome in `PLAN.md`. Continue through work slices without handing control back after one item.

The goal is met only when all of these are true:

1. `PLAN.md` contains no unchecked items.
2. Every completed item has objective evidence in `PROGRESS.md` and a coherent commit.
3. The plan's required verification passes on the same `HEAD`: the prose gates exit 0 on the files they cover, `node engine/reindex.mjs` exits 0, the screenshot harness shows the shipped surfaces at 1440 and 390, and `node engine/test-retrieve.mjs` exits 0 once lane D exists.
4. The checkout is clean and pushed.
5. No acceptance criterion, sourcing rule, honesty rule, or design law was weakened.

Read `PLAN.md` and `PROGRESS.md` in full before acting, and again after any compaction. They carry the outcome, the world, the honesty law, the lanes, the run rules, the delegations, and the founder's Inbox. Work the highest-priority unblocked item, verify it with evidence that can fail, commit it path-restricted, push, update durable state, and continue immediately. If an item is externally blocked, record the exact dependency in `PROGRESS.md`, keep it unchecked, and continue independent work. Never mark blocked work complete.

Stop only when the goal is met, a repo-root `STOP` file exists, an unrecoverable authentication/billing/model/access failure prevents further work, or every remaining item is externally blocked and the goal is therefore impossible. There is no elapsed-time, turn, work-slice, or retry-count limit; context compaction is expected and is not a stop condition.
