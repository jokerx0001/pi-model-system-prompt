# 02: Model switch follows on next message

**What to build:** Switching models mid-session changes which prompt file is used, effective
on my next message. The guidance a model receives always describes the model I am actually
talking to.

**Blocked by:** 01: Single model prompt delivered

**Status:** ready-for-agent

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
