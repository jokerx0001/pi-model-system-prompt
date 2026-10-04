# 02: Model switch follows on next message

**What to build:** Switching models mid-session changes which prompt file is used, effective
on my next message. The guidance a model receives always describes the model I am actually
talking to.

**Blocked by:** 01: Single model prompt delivered

**Status:** wontfix

- [ ] After switching models, the next message sent uses the newly selected model's file
- [ ] The active model is resolved at the moment of each run, never captured at load or
      startup — a test that changes the active model between two runs reads two different
      files
- [ ] The switch takes effect without resending, editing or retyping any previous message
- [ ] A run that follows a switch still leaves an unconfigured model byte-identical to a
      session without the extension
- [ ] Accepted and documented, not fixed: a message queued while the agent is streaming is
      delivered to the newly selected model carrying the previous model's text, and a model
      switch inside a running agent loop leaves that loop's text unchanged
- [ ] Verified at the same handler seam as 01, plus one live mid-session switch

## Comments

Withdrawn by maintainer decision. Two reasons, the first structural and the second practical.

**There is nothing to build.** Every behavioural criterion above is already satisfied by 01's
design, and satisfied by the *absence* of machinery rather than by any: the handler reads
`ctx.model` inside the callback on every run, so there is no cached model, no change listener
and no initialisation step that could capture a stale one. "Resolved per run, never at load" is
what a stateless handler does. An agent opening this ticket looking for code to write would be
looking for the speculative machinery the spec's Out of Scope explicitly rejects — a model-change
listener, a cache with invalidation, a registry.

**The one unmet criterion is not reachable by an agent.** Verifying a live mid-session switch
requires switching the model of a running interactive session and watching what the next message
carries. A pi agent cannot re-point its own model mid-session to perform that check, and the
maintainer has judged it not worth a human's session either — it is not this extension's primary
function.

The behaviour is not left unverified in the way that matters. Per-run resolution is structural,
and the "unconfigured model stays byte-identical" criterion was measured rather than argued
during ticket 01: with the extension loaded but no prompt file, the provider payload was
byte-identical to a run where the extension was never loaded. What remains unverifiable is only
the interaction between a switch and a queued message, which the spec already records as an
accepted event-granularity limit rather than a defect.

