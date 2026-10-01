# 01: Single model prompt delivered

**What to build:** When a model has a prompt file written for it, that file's content
appears at the end of the system prompt on the next message sent to that model. Models
without a file are completely unaffected: their prompt is exactly what it would have been
with no extension installed at all.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A model with a prompt file has that file's content present in the system prompt
- [ ] The content appears *after* everything else in the prompt, including anything other
      extensions contributed
- [ ] The content is appended as written. The one exception is deliberate and load-bearing:
      blank space at the very start and end is stripped, because that is what makes a
      whitespace-only file behave as no file at all
- [ ] A model with no prompt file receives a system prompt byte-identical to the same
      session running with the extension absent
- [ ] A whitespace-only file behaves exactly like no file
- [ ] A file that cannot be read behaves exactly like no file, and the run continues
- [ ] A run with no model selected changes nothing and reports no error
- [ ] Verification includes a typecheck against the types of the pi that will actually load
      this extension. A test suite driven only by a hand-written stub of the context object
      is blind to the stub disagreeing with the real context shape, which is exactly how the
      first implementation shipped a total no-op
- [ ] The handler is tested by invoking it with a stub and asserting only the value handed
      back to pi — no pi runtime, no network
- [ ] Verified end to end in a live session, with the evidence recorded in this ticket: a
      message sent to a configured model shows the text in the request that actually reaches
      the provider

## Notes

This ticket does not by itself catch every way the text can fail to arrive. A delivery that
records the text somewhere pi later discards would still pass every criterion above, because
all of them are judged from what a caller can see. Two things catch it, and they live
elsewhere on purpose:

- Ticket 03 composes with an extension that also writes to the prompt, which is the
  condition under which a recorded-but-discarded delivery is dropped
- The end-to-end criterion above is the only place the real outgoing request is inspected

The typecheck criterion is a past failure, not a hypothetical: the first implementation read
the active model through a context method that the real extension context does not have, so
every run threw and nothing was ever injected. The test suite passed throughout, because
its stub offered the method the code called. The stub and the code were written by the same
hand and agreed with each other.

The typecheck needs the host pi linked into this project once; see `AGENTS.md`. A fresh
checkout without that step has no typecheck, which is why the criterion names the
typecheck rather than trusting a bare test run.
