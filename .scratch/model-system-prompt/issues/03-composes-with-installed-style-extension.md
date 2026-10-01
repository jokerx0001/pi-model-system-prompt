# 03: Composes with installed style extension in either load order

**What to build:** The per-model text and the style extension I already have installed both
reach the model. Neither replaces, truncates or reorders the other, and the result does not
depend on which extension loads first.

**Blocked by:** 01: Single model prompt delivered

**Status:** ready-for-agent

- [ ] Both the per-model text and the installed style extension's text are present in the
      system prompt sent to the model
- [ ] The composed prompt contains both regardless of which extension loads first
- [ ] Composition never removes, truncates or reorders the other extension's text
- [ ] Removing or disabling the style extension leaves the per-model text intact
- [ ] Verified against the *real* installed extension, not only a stub: a stub cannot
      reproduce the failure this guards against
- [ ] A test fails if the per-model text stops being an append to the prompt as rendered,
      so this cannot regress silently while every other test stays green
