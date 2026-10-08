# model-system-prompt

A pi extension that appends a per-model system prompt, chosen by the active model id.

## Layout

- `index.ts` — the extension. Resolves the active model id to the longest filename prefix in
  `~/.pi/agent/model-system-prompt/` and appends that file to the system prompt on every run. No
  matching file means no injection.
- `install-presets.mjs` — the package's `postinstall` hook, and `npm run install-presets` for a dev
  checkout. Copies `presets/*.md` into the user's prompt directory. Never overwrites; emptying or
  deleting the copy in your own directory is how you get rid of it.
- `presets/` — ready-made prompts this project ships.
- `test/` — `npm test`. The handler tests plus the seeding tests, one of which installs the packed
  package with the real `pi` CLI. Typed, and the stub context is derived from pi's own
  `ExtensionContext`, so a member pi does not have is a compile error rather than a shape the
  tests quietly agree with.
- `.scratch/` — issues and specs
- `docs/agents/` — issue tracker, triage labels, domain doc, and preset research conventions

The extension only ever reads `~/.pi/agent/model-system-prompt/`. Once a preset is copied there it
is indistinguishable from a file the user wrote: the user edits it, or empties it to turn that
model off, and the extension behaves the same either way. There is no manifest and no state file
— what is on disk is the truth. Code and versioned prompt text live here; the *active* prompt for
a given model is whatever the user has in their own directory.

## Install

Users install the published package — one command:

```sh
pi install npm:pi-model-system-prompt
```

pi installs the package with npm, and the package's `postinstall` hook copies `presets/*.md` into
`~/.pi/agent/model-system-prompt/`. The hook never overwrites a file that is already there, and npm
runs it once per installed version and leaves an already-satisfied dependency alone — so a preset the
user deleted is not put back by a later `pi install` of anything else, nor by re-running the same
install. Emptying the file is the reliable off switch — deleting it works only while no shorter name
still matches that model — and there is no state file of ours; the install-once guarantee is npm's
own.

Publishing is a manual one-time step: `npm publish`, targeting the public registry explicitly
(this machine's npm registry is a mirror).

For development, install the project path and seed by hand:

```sh
pi install .              # records this path in ~/.pi/agent/settings.json
npm run install-presets   # the same script the hook runs
```

A dev checkout is loaded from source, so editing and reloading needs no reinstall. A plain
`npm install` in the checkout also runs the `postinstall` hook — npm runs the root project's own
hook — so it re-seeds a preset deleted from the developer's own home directory.

## Development

`npm test` runs the handler tests and needs nothing installed; the packaged-install test skips if
the `pi` CLI is not on PATH. `npm run check` adds a typecheck and needs the toolchain linked once:

```sh
npm install
npm link @earendil-works/pi-coding-agent   # types come from the installed pi, not a dep
npm run check
```

The link step is not optional and not recorded in `package.json`: `index.ts` imports
`ExtensionAPI` from pi, so without it `tsc` cannot resolve the module. Linking the globally
installed pi also means the typecheck follows the host that actually loads this extension.

The typecheck covers `index.ts` and the test. That is the point: the handler is checked against
pi's interface, and the stub it is tested through is checked against pi's context type. Both
directions matter, because the bug that shipped here was the code and the test agreeing with
each other about an interface neither of them had checked.

## Preset research and writing

A preset is prompt text harvested from a model's own official agent tool: shipped in `presets/`,
listed in both READMEs, copied into the user's prompt directory on install. The method — how a round
is dispatched, how the source is read and cited, the judgment rubric, what a preset file must look
like — is in `docs/agents/preset-research.md`. Read it before starting a round.

Settled decisions. Each one below has cost a round every time it was re-opened:

- **可用性 decides a rule that names a tool.** A rule that needs a tool or mechanism pi does not have is 不借鉴, and
  is never rewritten into a `{{placeholder}}` shell. Judge against pi's **built-in** tools — `read`
  `write` `edit` `bash` `grep` `find` `ls` `powershell` — not against whatever this session happens
  to have installed: a preset ships to users who have only the base harness.
- **Identity sentences are never taken.** The extension appends to pi's own system prompt, so a second
  "You are…" fights the first. The source harness replaces its prompt wholesale; we do not.
- **分档 is mirrored.** When the source harness picks between prompt variants per model, we ship one
  file per tier rather than one merged file.
- **自足 beats factoring.** Text the source gives every tier is repeated verbatim in every file: no
  includes, no shared file, no manifest. The extension resolves a model id to a single file by name,
  so a user empties one file and turns off exactly that tier.
- **File names are the shortest shared prefix of the ids they serve** — `claude-sonnet-5.md` covers
  `claude-sonnet-5`, `claude-sonnet-5-1` and `claude-sonnet-5.1`. Twins that are byte copies are the
  expected shape, not an accident, and editing one means editing the other.
- **The pin goes in the research file, not the preset.** Provenance inside a preset is sent to the
  model on every run.
- Presets are content, not code. Nothing is verified per preset, and a round needs neither a model
  connection nor the local harness installed.

Dispatch subagents on `minimax-cn/MiniMax-M3.1-Flash-Preview:high` — research rounds are long and
this one is cheap.

## Agent skills

### Issue tracker

Issues and specs live as markdown under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five skills roles, label string equals role name, plus `done` — this repo's own workflow state for
work that is implemented and verified, which has no skills equivalent. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context. See `docs/agents/domain.md`.
