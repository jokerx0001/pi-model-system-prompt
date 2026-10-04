# 03: Composes with installed style extension in either load order

**What to build:** The per-model text and the style extension I already have installed both
reach the model. Neither replaces, truncates or reorders the other, and the result does not
depend on which extension loads first.

**Blocked by:** 01: Single model prompt delivered

**Status:** ready-for-agent

- [x] The system prompt sent to the model contains both the per-model text and the style
      extension's text
- [x] The composed prompt contains both, in either load order
- [x] Composition never removes, truncates or reorders the other extension's text
- [x] With the style extension removed or disabled, the per-model text is still delivered
- [x] A run where neither extension has anything to say produces a prompt byte-identical to
      the same session without this extension installed
- [x] Verified against the *real* installed style extension, not only a stub
- [x] A test fails if the per-model text stops reaching the model whenever another extension
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

## Evidence

**Most of this ticket was already delivered and verified under ticket 01, and that is not an
accident — it is where 01's criteria pointed.** Composition is not a feature built after 01; it is
01's append-to-the-rendered-prompt decision, and it could not have worked any other way. The
composition test has been in the suite since the first commit, and 01's wire-level evidence run
already observed the real style extension and this extension coexisting in one payload. Criteria
1, 3, 6 and 7 are discharged by that.

This ticket's current wording postdates 01 and asks for three things 01 did not check, so those
were measured. Same probe as 01 — a throwaway `before_provider_request` hook, loaded with `pi -e`
from a temp directory, never installed — same model, same question every run, so the question is
a control present in every payload while only the `system` message varies.

| Run | Loaded | Marker file | `system` chars | Canary |
| --- | --- | --- | --- | --- |
| `A` | this extension only (`--no-extensions`, no style ext) | yes | 4180 | **yes** |
| `B` | this extension only | no | 4078 | no |
| `C` | neither extension | no | 4078 | no |

```
A === B + "\n\n" + marker      true    (criterion 4, byte-exact)
B === C                        true    (criterion 5, byte-identical)
```

Criterion 4 — style extension removed, per-model text still delivered — is the `A` row: the
canary is in the system message with nothing else installed. Criterion 5 is `B === C`: a run where
this extension has nothing to say produces a payload byte-identical to a run where it was never
loaded.

The 4078 versus 9606 character gap between these runs and 01's is itself the measurement: it is
almost entirely the style extension's own contribution, which is what makes the 01 run and these
three jointly check both sides of coexistence.

Two honest limits on the ticks. Criterion 2's "either load order" is covered for the order that
actually occurs by a live payload (style extension first, this one second, as installed) and for
the reverse order only by the handler test, since the load order is fixed by the packages list in
`settings.json` and cannot be inverted from a flag. Criterion 3's no-reorder guarantee rests on
byte equality of everything preceding the canary, which is measured for the real order and
asserted by the stub test for the reverse one.

Marker file and probe removed afterwards.

