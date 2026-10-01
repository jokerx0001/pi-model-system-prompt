# 01: Single model prompt delivered

**What to build:** When a model has a prompt file written for it, that file's content
appears at the end of the system prompt on the next message sent to that model. Models
without a file are completely unaffected: their prompt is exactly what it would have been
with no extension installed at all.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A model with a prompt file has that file's content present in the system prompt
- [ ] The content appears *after* everything pi and other extensions already contributed,
      not before it and not in place of it
- [ ] The content is delivered as a whole: not truncated, not reflowed, not reformatted
- [ ] A model with no prompt file receives a system prompt byte-identical to the same
      session running with the extension absent
- [ ] An empty or whitespace-only file behaves exactly like no file
- [ ] A run with no model selected changes nothing and reports no error
- [ ] The prompt is delivered by appending to the system prompt *as pi has already rendered
      it for this run*, not by rebuilding the prompt from its parts — so a delivery
      mechanism that merely records a change pi later discards cannot pass these criteria
- [ ] A test drives the registered lifecycle handler through a stub extension object and
      asserts only the value handed back to pi, with no pi runtime and no network
- [ ] Verified end to end in one live session: a message sent to a configured model shows
      the text in the outgoing request
