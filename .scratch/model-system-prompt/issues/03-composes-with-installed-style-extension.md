# 03: Composes with installed style extension in either load order

**What to build:** The per-model text and the style extension I already have installed both
reach the model. Neither replaces, truncates or reorders the other, and the result does not
depend on which extension loads first.

**Blocked by:** 01: Single model prompt delivered

**Status:** ready-for-agent

- [ ] The system prompt sent to the model contains both the per-model text and the style
      extension's text
- [ ] The composed prompt contains both, in either load order
- [ ] Composition never removes, truncates or reorders the other extension's text
- [ ] With the style extension removed or disabled, the per-model text is still delivered
- [ ] A run where neither extension has anything to say produces a prompt byte-identical to
      the same session without this extension installed
- [ ] Verified against the *real* installed style extension, not only a stub
- [ ] A test fails if the per-model text stops reaching the model whenever another extension
      also writes to the prompt, so this cannot regress while every other test stays green

## Notes

This ticket is where ticket 01's delivery is actually pinned down. 01's criteria are all
judged from what a caller can observe, and a delivery that records the text somewhere pi
later drops passes all of them. Coexisting with an extension that also writes to the prompt
is the condition that makes such a delivery fail visibly, which is why the verification here
targets the real extension rather than a stub: a stub cannot reproduce the failure.

The stub point is not hypothetical. The first implementation's test suite stubbed a context
method that the real extension context does not have, and the suite agreed with the code
because the same hand wrote both. A test that stands in for pi must be checked against pi,
or it only proves the code agrees with the person who wrote it.
