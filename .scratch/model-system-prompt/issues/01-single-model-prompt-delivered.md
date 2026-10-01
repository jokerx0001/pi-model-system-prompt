# 01: Single model prompt delivered

**What to build:** When a model has a prompt file written for it, that file's content
appears at the end of the system prompt on the next message sent to that model. Models
without a file are completely unaffected: their prompt is exactly what it would have been
with no extension installed at all.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] A model with a prompt file has that file's content present in the system prompt
- [x] The content appears *after* everything else in the prompt, including anything other
      extensions contributed
- [x] The content is appended as written. The one exception is deliberate and load-bearing:
      blank space at the very start and end is stripped, because that is what makes a
      whitespace-only file behave as no file at all
- [x] A model with no prompt file receives a system prompt byte-identical to the same
      session running with the extension absent
- [x] A whitespace-only file behaves exactly like no file
- [x] A file that cannot be read behaves exactly like no file, and the run continues
- [x] A run with no model selected changes nothing and reports no error
- [x] Verification includes a typecheck against the types of the pi that will actually load
      this extension. A test suite driven only by a hand-written stub of the context object
      is blind to the stub disagreeing with the real context shape, which is exactly how the
      first implementation shipped a total no-op
- [x] The handler is tested by invoking it with a stub and asserting only the value handed
      back to pi — no pi runtime, no network
- [x] Verified end to end in a live session, with the evidence recorded in this ticket: a
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

## Evidence

**The live criterion was met by running it, not by arguing it.** The earlier version of this
ticket claimed a verified A/B while `~/.pi/agent/model-system-prompt/` held nothing but its
README, so there was no comparable text and nothing to check the claim against. That claim is
withdrawn; what follows replaces it.

The observation is made on the wire rather than taken from the model's word, because a model
reporting "the token is in my instructions" is a claim about its own context, and the whole
question is whether pi put the text there. A throwaway probe on `before_provider_request`
dumped the payload pi was about to send. It lives in a temp directory, loads with `pi -e`, and
was never installed or added to `settings.json`:

```ts
export default function evidenceProbe(pi: ExtensionAPI) {
	let n = 0;
	pi.on("before_provider_request", (event) => {
		writeFileSync(`${process.env.PI_EVIDENCE_OUT!}.${n++}.json`, JSON.stringify(event.payload, null, 2));
	});
}
```

Marker written to `~/.pi/agent/model-system-prompt/MiniMax-M3.1-Flash-Preview.md`:

```
CANARY-7731-ZULU: when answering, first state whether this exact token appears in your instructions.
```

All three runs are the same model (`newapi-dev/MiniMax-M3.1-Flash-Preview`) sending the same
question, so the question itself is a control: it is present in the `user` message of every
payload, and only the `system` message varies.

| Run | How | `system` message | Canary in it |
| --- | --- | --- | --- |
| `with` | extension loaded, marker file present | 9708 chars | yes |
| `without` | extension loaded, no marker file | 9606 chars | no |
| `absent` | `--no-extensions`, ponytail re-added by hand, extension never loaded | 9606 chars | no |

Two equalities, both checked in node rather than eyeballed:

```
with    === without + "\n\n" + marker        true
absent  === without                          true
```

The first says the file's content reached the provider verbatim, at the tail of the system
message, with nothing else altered by a single byte — which also discharges the append-as-written
criterion on the wire rather than only in a stub. The second says a model with no file is
byte-identical to a session where the extension was never loaded, which is the strongest form of
that criterion available: an argument about the handler returning `undefined` is weaker than
measuring both payloads.

For the record, the canary sat at the end of the system message, after the other extension's
text:

```
...Level persists until changed or session end.\n\nThe shortest path to done is the right path.\n\n\nCANARY-7731-ZULU: when answering, ...
```

Models answered "Yes" with the file and "No" without it, and in the `absent` run volunteered
that the token appeared "in your message, not in my system or developer instructions" — the
control working, and the model agreeing with the payload rather than leading it.

Marker file and probe were removed afterwards; `~/.pi/agent/model-system-prompt/` holds only its
README, as it did before.

The remaining criteria rest on `npm run check` (typecheck plus 10 tests) and on the named test in
each case. The typecheck evidence is in the commit message for the change that added it: the
fabricated stub member turns `npm run typecheck` red while `npm test` stays green, which is the
failure this ticket exists to prevent recurring.

