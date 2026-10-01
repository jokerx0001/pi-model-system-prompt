# Spec: model-system-prompt

**Status:** ready-for-agent

A pi extension that appends a per-model system prompt, chosen by the active model id.

## Problem Statement

Pi builds one system prompt per session. A user who switches between models with
different temperaments gets the same instructions for all of them, and the only way to
influence it is the global `SYSTEM.md` / `APPEND_SYSTEM.md` files, which apply to every
model equally. Writing model-specific guidance into those files means every model pays
for it; leaving it out means a model that needs different handling never gets it.

Pi itself has per-model settings for thinking level and compaction, but nothing for the
system prompt, and no extension point that keys prompt content on the model.

## Solution

A pi extension, installed as a local path package, reads a file named after the
active model id from a dedicated prompt directory and appends its contents to the system
prompt on each run. Models without a file are untouched. The files are plain Markdown the
user writes and edits directly; the extension only resolves, reads, and appends.

## User Stories

1. As a pi user, I want a different system prompt per model, so that each model gets the
   handling it needs without affecting the others.
2. As a pi user, I want the per-model text to be added to the existing prompt rather than
   replace it, so that the harness defaults, my global additions, and my project
   instructions keep working for every model.
3. As a pi user, I want to keep the per-model text in a plain Markdown file I edit myself,
   so that I can write it without learning a configuration format.
4. As a pi user, I want the file named after the model id, so that I can find the right
   file by looking at the model list.
5. As a pi user, I want models with no file to behave exactly as they do today, so that I
   only configure the models that actually need it.
6. As a pi user, I want the correct prompt applied in the very first message of a session,
   so that the model is guided from its first response.
7. As a pi user, I want the new model's prompt applied on my next message after switching
   models, so that the guidance follows the model I am actually talking to.
8. As a pi user, I want edits to a prompt file to take effect on my next message, so that I
   do not have to restart or reload anything to iterate.
9. As a pi user, I want an empty or whitespace-only file to behave as no file, so that I can
   disable a prompt by emptying it rather than deleting it.
10. As a pi user, I want a missing prompt directory to be harmless, so that installing the
    extension before writing any prompts causes no error.
11. As a pi user, I want an unreadable file to be harmless, so that a permissions mistake
    does not break my session.
12. As a pi user, I want the extension to compose with the style extension I already
    install, so that both sets of instructions reach the model.
13. As a pi user, I want the composition to work regardless of which extension loads first,
    so that adding or removing another extension does not silently change what my model
    receives.
14. As a pi user, I want model ids containing dots and hyphens to work as file names, so
    that models like `Qwen3.8-27B` and `MiniMax-M3.1-Flash-Preview` are configurable.
15. As a pi user, I want the same prompt file to apply to whichever provider serves that
    model id, so that moving a model between providers does not require a new file.
16. As a pi user, I want prompt files scoped to my own account rather than to a project, so
    that my model handling follows me across all repositories.
17. As a pi user, I want a long prompt file to be appended in full, so that length is not a
    limit on what I can say.
18. As a pi user, I want the per-model text placed after everything already in the prompt,
    so that my model-specific handling is read last and is not buried.
19. As a pi user, I want a plain-text prompt file to be treated as literal instructions, so
    that no template syntax is required.
20. As a pi user, I want the extension to add no tools, commands, or keybindings, so that it
    does not change how I interact with pi.
21. As a pi user, I want to configure many models independently, so that I can build up
    handling for each one at my own pace.
22. As a pi user, I want each model's handling to be visible in the file it came from, so
    that I can tell which rules came from where.
23. As a pi user, I want the extension to work in interactive sessions, so that the feature
    is available where I actually work.
24. As a pi user, I want the extension to work in non-interactive runs, so that scripted and
    print-mode runs get the same model handling.
25. As a pi user, I want a model with no file to keep whatever text was already applied in
    the session, so that the extension never removes prompt content I did not ask it to
    remove.

## Implementation Decisions

- **Delivered as a pi extension**, not a modification of pi. Discovered by pi's standard
  package discovery: a package directory whose entry module is discovered by pi. No fork, no
  patch, nothing to re-apply on upgrade. pi loads the package from its source directory
  without copying it, so the extension source is an ordinary editable project.

- **Single integration point: the `before_agent_start` lifecycle event.** One handler, one
  return value, no other events, no tools, commands, flags, or UI.

- **Resolution is a single rule evaluated per run, not a tracked state.** The handler reads
  the active model id from the extension context at the moment the event fires. There is no
  cached model, no change listener, and no initialization step.

- **The prompt text is force-appended to the currently rendered system prompt.** The handler
  reads the prompt as pi has rendered it so far and returns that text with the file contents
  added at the end.

- **Structured prompt sections are explicitly rejected as the injection form.** Once any
  handler supplies a forced system prompt, pi returns that text alone and drops every
  structured section. The style extension already installed force-appends on every run, so a
  section written here would be recorded in the transcript and never reach the model — a
  silent failure. Appending to the rendered prompt composes with any other extension
  regardless of load order, because the handler always sees the current state.

- **Additive only.** The handler never discards, reorders, or rewrites existing prompt
  content; the only transformation is concatenation.

- **Key is the model id verbatim**, one file per model, in a prompt directory beside the
  agent configuration. No provider qualification, no wildcards, no family matching, no
  per-project override, and no default file for unmatched models.

- **Absence is a no-op in every form**: no active model, no file, unreadable file, empty
  file, or whitespace-only file all return without changing the prompt.

- **The file is read fresh on every run.** Nothing is cached, so there is no invalidation to
  get wrong and no reload requirement for editing a prompt file. Reloading is needed only after
  the extension's own code changes.

- **No stale-text management.** When the active model has no file, text injected earlier in
  the session is left in place. Removing it would require either per-model injection points
  with explicit invalidation, or a marker recording what was last injected; both were
  considered and rejected as complexity for a case the user does not want handled.

- **Startup needs no special case.** The startup model is assigned during session creation
  and is already visible on the extension context before the first user message, and pi emits
  no model-change event at startup. Reading the context per run covers startup, model
  switching, and session resumption with the same code path.

- **Content of the files is entirely the user's business.** The extension does not parse,
  validate, template, or transform the text, and imposes no structure on it.

## Testing Decisions

- **A good test asserts the string handed back to pi and nothing else.** The extension's
  entire contract with pi is the value it returns from the agent-start handler, so that is
  the only thing worth pinning. Tests must not reach into pi internals, assert on transcript
  shape, assert on provider payloads, or re-derive pi's prompt assembly.

- **One seam: the registered lifecycle handler, invoked directly.** A stub extension object
  records handlers by event name; the test invokes the agent-start handler with a stub
  context and a stub event, and asserts on the returned prompt. No pi runtime, no session, no
  network.

- **Prior art exists for this seam in the same agent directory.** The installed style
  extension ships its own test suite using Node's built-in test runner, a hand-rolled stub
  extension object, and direct handler invocation. That suite is the pattern to follow,
  including running from the extension directory with no test framework dependency.

- **Cases covered at that seam:**
  - a file for the active model is appended after the rendered prompt
  - no file leaves the prompt returned undefined
  - a whitespace-only file leaves the prompt returned undefined
  - a model id containing dots and hyphens resolves to its file
  - content read on the second call reflects an edit made between calls
  - a file whose id does not match the active model is not used
  - composition with another force-appending handler produces the combined text when the
    other handler runs first and when it runs second

- **Explicitly not covered:** pi's own prompt assembly or section diffing, the provider wire
  format, cache behaviour, the queued-message and mid-run model-switch cases (these are pi's
  event granularity, not this extension's behaviour), and real filesystem permission
  failures (the seam stubs the directory contents).

- **Add a real-session check later if** a handler-level test cannot distinguish a composition
  problem caused by pi's projection of the returned prompt onto the request — that is, if
  the composed string is right but the provider still receives something else.

## Out of Scope

- Editing, creating, or deleting prompt files from inside pi
- Project-level or workspace-level prompt overrides
- Provider-qualified keys, wildcards, or model-family matching
- A default or fallback file for models with no entry
- Explicit removal or invalidation of a previous model's text
- Per-request awareness of virtual-model routing
- Caching, preloading, or invalidation of prompt content
- Any change to pi itself, its defaults, or its documentation
- Validation, templating, or interpolation inside prompt files
- Per-model tool sets, thinking levels, or any other model setting
- Any UI for listing or inspecting configured models
- A default prompt file shipped with the extension

## Further Notes

- The extension's code is this project; the prompt files it reads are user data held in the
  agent configuration directory, outside this repository. The two are deliberately separate:
  code is versioned and reviewed, the text a user writes per model is not.
- Two pi event-granularity limits are accepted by design: a message queued while the agent
  is streaming is delivered to the newly selected model carrying the previous model's text,
  and a model switch inside a running agent loop leaves that loop's text unchanged. Both
  resolve on the next user message.
- Because the injected prompt is a forced prompt, structured sections contributed by other
  extensions are absent from the outgoing request. This is pre-existing behaviour of the
  installed style extension; this extension neither causes nor repairs it.
- Published to the local markdown tracker under the `ready-for-agent` role. The extension is
  already implemented and its handler-level tests pass; the spec records the decisions behind
  that implementation.
