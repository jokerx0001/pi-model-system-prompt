# model-system-prompt

A pi extension that appends a per-model system prompt, chosen by the active model id.

## Layout

- `index.ts` — the extension. Reads `~/.pi/agent/model-system-prompt/<modelId>.md` and appends it
  to the system prompt on every run. No file means no injection.
- `test/extension.test.ts` — `npm test`. Typed, and the stub context is derived from pi's own
  `ExtensionContext`, so a member pi does not have is a compile error rather than a shape the
  tests quietly agree with.
- `.scratch/` — issues and specs
- `docs/agents/` — issue tracker, triage labels, domain doc conventions

Prompt files are user data and live in `~/.pi/agent/model-system-prompt/`, not in this repo. Code
lives here; the text you write does not.

## Install

Already installed as a local path package (`pi install .` writes the path into
`~/.pi/agent/settings.json`; pi loads it from this directory without copying, so edits here
take effect after `/reload`).

## Development

`npm test` runs the handler tests and needs nothing installed. `npm run check` adds a typecheck
and needs the toolchain linked once:

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

## Agent skills

### Issue tracker

Issues and specs live as markdown under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles, label string equals role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. See `docs/agents/domain.md`.
