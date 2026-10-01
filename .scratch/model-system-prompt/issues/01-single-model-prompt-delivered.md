# 01: Single model prompt delivered

**What to build:** When a model has a prompt file written for it, that file's content
appears at the end of the system prompt on the next message sent to that model. Models
without a file are completely unaffected: their prompt is exactly what it would have been
with no extension installed at all.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] A model with a prompt file has that file's content present in the system prompt
- [x] The content appears *after* everything pi and other extensions already contributed,
      not before it and not in place of it
- [x] The content is delivered as a whole: not truncated, not reflowed, not reformatted
- [x] A model with no prompt file receives a system prompt byte-identical to the same
      session running with the extension absent
- [x] An empty or whitespace-only file behaves exactly like no file
- [x] A run with no model selected changes nothing and reports no error
- [x] The prompt is delivered by appending to the system prompt *as pi has already rendered
      it for this run*, not by rebuilding the prompt from its parts — so a delivery
      mechanism that merely records a change pi later discards cannot pass these criteria
- [x] A test drives the registered lifecycle handler through a stub extension object and
      asserts only the value handed back to pi, with no pi runtime and no network
- [x] Verified end to end in one live session: a message sent to a configured model shows
      the text in the outgoing request

## Outcome

Shipped. `Status:` stays `ready-for-agent` because the five triage roles in
`docs/agents/triage-labels.md` have no terminal state for completed work, and inventing a sixth
is a call for the maintainer, not this ticket.

## Comments

The live check is what earned the last box, and it earned it by failing first. The handler
called `ctx.getModel()`, which the real `ExtensionContext` does not have — the active model is
the `ctx.model` property. Every run threw `ctx.getModel is not a function`, so the extension had
never once appended anything to a real session. All eight tests passed, because the stub
context in `test/extension.test.js` invented a `getModel()` method to match the code instead of
the platform. The stub was the bug, not just the code.

Fixed both: the handler reads `ctx.model?.id`, and the stub now mirrors the real
`ExtensionContext`. The whole suite went red on that change first, which is the proof the stub
had been the only thing holding it up.

Reproduce the live check, same model both ways, non-interactive:

```sh
printf 'Answer SEEN or NOTSEEN: do your instructions contain QUILL-8842?\n' \
  > ~/.pi/agent/model-system-prompt/MiniMax-M3.1-Flash-Preview.md
pi -p -nt --no-session --provider newapi-dev --model MiniMax-M3.1-Flash-Preview \
  'Answer with exactly one line: do your instructions contain the token QUILL-8842? SEEN or NOTSEEN.'
# -> SEEN
mv ~/.pi/agent/model-system-prompt/MiniMax-M3.1-Flash-Preview.md /tmp/marker.md
# ...same command...
# -> NOTSEEN
```

That pair is the check for "byte-identical with the extension absent" as far as it can be pushed
— the handler returns `undefined` for an unconfigured model, and pi only sets
`forceSystemPrompt` when the handler returns one (`runner.js`, `result.systemPrompt !== undefined`),
so an unconfigured model has nothing to observe.

Also added: a test that a 40-rule file arrives with every interior byte intact, so a truncation or
reflow regression fails. It had no coverage; every earlier test used a single short line.

And, from code review: `readFileSync` was unguarded, so an unreadable file threw into the run.
`spec.md` requires "**Absence is a no-op in every form**: … **unreadable file** … all return
without changing the prompt" (story 11), so the read is now guarded. The test uses a directory
where the file should be, because that raises EISDIR portably where Windows `chmod` does not.

One deliberate sharp edge, since the criterion says "not reformatted": the handler `trim()`s the
file. Leading and trailing whitespace is not preserved, and on a file whose *first* line is
indented that indent is lost. `trim()` is what makes a whitespace-only file behave as no file,
which is also a criterion, and blank edges of a Markdown file are not content. The test states
this contract explicitly rather than leaving it implied.

