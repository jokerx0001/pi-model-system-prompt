# 01: Ship preset prompts that install into the user's prompt directory

**What to build:** The project carries ready-made presets — prompt text for a model, which a user
would otherwise have to write themselves. Installing the extension into pi is one command, and that
one command also puts the presets in the user's prompt directory. After it, a preset is a prompt
file the user owns: editable, and deletable to turn that model off.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] At least one preset ships with the package, named after the model it configures
- [x] Installing is one command, documented as one command: `pi install npm:pi-model-system-prompt`.
      It both installs the extension and copies the presets into the user's prompt directory. There
      is no second command, and nothing happens at pi start-up
- [x] The copy is made by the published package's own npm install lifecycle — a `postinstall` hook
      that runs once, when pi installs the package. Not by extension load code, and not by a command
      the user runs by hand
- [x] pi discovers and loads the extension from the installed npm copy, through the entry point the
      package declares
- [x] The package declares pi's own packages as peers rather than dependencies, so the installed tree
      carries no second copy of them and pi suppresses peer installation for the managed install
- [ ] The package is installable from npm as `pi-model-system-prompt`; publishing it is a documented
      one-time step
- [x] Presets land in the same directory the extension reads at run time — one location, never a
      second copy
- [x] Installing over a file the user already has leaves that file byte for byte as it was, whether
      or not they edited it
- [x] Installing into a prompt directory that does not exist yet creates it
- [x] Installing twice in a row changes nothing the second time
- [x] A preset the user deleted stays deleted: neither a later install of a different package nor
      re-running the same install brings it back. (A version upgrade does run the hook again and will
      re-seed; which way that falls is not asserted here.)
- [x] Nothing is written beside the presets themselves: no manifest, no state file, no marker
      recording what was installed. The install-once guarantee comes from npm's own dependency state,
      not from a file this project writes
- [x] Only prompt files are seeded; anything else shipped alongside them is left alone
- [x] A seeded preset is indistinguishable from one the user wrote: they can edit it, and deleting
      it turns that model off exactly as an unconfigured model behaves
- [x] Development is unchanged: the project still installs as a local-path package that pi loads from
      source, editable and reloadable, with the seeding script still runnable by hand on a dev machine
- [x] The seeding behaviour is covered by an automated check that exercises the packaged artifact the
      way a user installs it: pack the package, then run the real
      `pi install npm:<name>@file:<tarball>` with the agent directory *and* the home directory
      redirected to temporary locations, and assert the preset lands in the redirected prompt
      directory and the command exits 0
- [x] The project's own documentation — the agent instructions and the domain model's definition of
      "Install" — describes install as that single command, not as two steps

## Notes

This deliberately reverses one line of the existing spec's Out of Scope, "A default prompt file
shipped with the extension". Decided: `spec.md` is unchanged. That entry, and the spec's "no default
file for unmatched models" decision, describe *runtime resolution* — with no file for the active
model, nothing is injected — and a preset does not touch that path: it is the copy source for that
one model's file, and a model with no preset behaves exactly as an unconfigured model does. The
shipped extension never consults a preset at run time.

An earlier version of this ticket concluded that one-command install was impossible without a state
file, because a local-path package gives pi no hook to run anything at install time. That is true of
a local-path package and only of it: pi records the path and installs nothing. An npm package takes a
different route — pi runs npm install into its own npm directory with no `--ignore-scripts` — so the
package's `postinstall` hook does run, once per installed version.

Verified end to end with the real pi binary against a redirected agent directory and home, using a
packed copy of this project that carried the hook: one `pi install npm:<tarball>` installed the
extension and landed the preset; installing a different package afterwards left an edited preset
untouched and did not re-run the hook; deleting the preset and re-installing the same version left it
deleted and reported the install as already up to date.

So the three properties the old argument treated as mutually exclusive hold together: one command,
no marker of ours, and deletion turns the model off. The install-once guarantee is npm's, not ours.

The trade-off accepted here: an npm install is a copy in pi's npm directory, so edit-and-reload no
longer applies to that install. Local-path installation stays the development path (see 04) with the
seeding script run by hand; the published package is the user-facing one-command path.

The npm registry configured on this machine is a mirror. Publishing needs to target the public
registry explicitly; that is a packaging step, not a behaviour of the extension.

## Comments

Criterion 6 is the one box left unticked. Everything else below is either automated or was run by
hand against the real `pi` 0.99.2 binary on this machine.

### Criterion 4 — pi loads the extension from the installed copy

The earlier claim here cited `pi list`, which only prints sources recorded in settings and proves
nothing about loading. Replaced with a probe of pi's own resource loader.

Install under the package **name**, against a temp home and agent dir:

```sh
npm pack --json --pack-destination "$TMP/packs"          # from the repo
pi install "npm:pi-model-system-prompt@file:$TMP/packs/pi-model-system-prompt-0.1.0.tgz"
```

Probe (`$PI_CODING_AGENT_DIR` = the temp agent dir). `piDir` is pi's own install, which on this
machine `npm root -g` resolves to `C:\Users\joker\AppData\Roaming\npm\node_modules`:

```js
const piDir = "C:/Users/joker/AppData/Roaming/npm/node_modules/@earendil-works/pi-coding-agent";
const { DefaultResourceLoader } = await import(`file:///${piDir}/dist/core/resource-loader.js`);
const loader = new DefaultResourceLoader({ cwd: process.cwd(), agentDir: process.env.PI_CODING_AGENT_DIR });
await loader.reload();
const ext = loader.getExtensions();
console.log(JSON.stringify({
  extensions: ext.extensions.map((e) => ({
    path: e.path, origin: e.sourceInfo.origin, scope: e.sourceInfo.scope, handlers: [...e.handlers.keys()],
  })),
  errors: ext.errors, warnings: ext.warnings,
}, null, 2));
```

Observed output:

```json
{
  "extensions": [
    {
      "path": "C:\Users\joker\AppData\Local\Temp\verify\agent\npm\node_modules\pi-model-system-prompt\index.ts",
      "origin": "package",
      "scope": "user",
      "handlers": [ "before_agent_start" ]
    }
  ],
  "errors": [],
  "warnings": []
}
```

The path is inside the agent dir's npm tree, `origin` is `package` (it came in through the declared
entry point, not as a top-level file), there are no errors or warnings, and the handler map holds
`before_agent_start`, which means the factory actually ran. `tools` is empty because this extension
registers no tools — that is correct, not a gap.

**Negative observation, and why the e2e test changed shape.** Repeating the install with a bare
`npm:<tarball>` spec seeds the preset identically but the same probe returns:

```json
{ "extensions": [], "errors": [], "warnings": [] }
```

So the bare-tarball form installs and seeds without pi ever discovering the extension. The e2e test
now installs with the `npm:<name>@file:<tarball>` form, which both seeds the preset and is the shape
the documented `npm:pi-model-system-prompt` spec actually takes, so the test exercises the form that
works end to end.

**Not automated, deliberately.** Doing this from a test means importing `dist/core/resource-loader.js`
out of pi's internals, pinning a test to a private module path that carries no stability promise. For
one criterion that is the wrong trade, so the load check stays a documented manual probe. The e2e
test does assert the weaker filesystem facts around it: the copy lands at
`<agentDir>/npm/node_modules/pi-model-system-prompt/index.ts`, and no `@earendil-works` directory
appears in the managed tree.

### Criteria 10 and 11 — idempotence, and deletion surviving other installs

Both are in the e2e test, which runs this sequence against the real CLI with `HOME`, `USERPROFILE`
and `PI_CODING_AGENT_DIR` all redirected to temp dirs and the tarballs packed into a temp dir:

1. `pi install` our package — asserts the preset is byte-identical to `presets/`.
2. Asserts the copy landed in the agent npm tree and that no `@earendil-works` was installed there.
3. **Criterion 10:** `pi install` our package again with the preset present — asserts it is still
   byte-identical. This is the literal back-to-back case, separate from the deletion case.
4. `pi install` a second, unrelated package (`pi-unrelated-noop`, a real minimal pi package packed
   from a temp dir) with the preset **present** — asserts it is still byte-identical. This one
   covers the "never overwrites a file the user already has" property under another package's
   install. It does **not** cover criterion 11: a re-run hook skips a file that is still there, so
   this assertion would pass whether the hook ran or not.
5. **Criterion 11, both halves — the discriminating part.** The preset is deleted *first*, so
   there is nothing for a re-run hook to skip:
   - `pi install` the unrelated package — asserts the preset is **still absent**. This is the half
     that was missing, and the only assertion in the test that can distinguish "the hook did not
     run" from "the hook ran and did its job".
   - `pi install` our package again — asserts still absent. This is the re-run-same-install half.

   The two assertions have teeth because step 1 already proves the hook recreates a missing preset:
   the hook copies whenever the file is absent. So if either post-deletion install had re-run it,
   the file would exist and the assertion would fail. The guarantee under test is npm's
   already-satisfied-dependency behaviour, not the hook's.

**The test detects a broken hook.** A copy of the repo with `postinstall` deleted from its
`package.json` (done in a temp copy, not in the working tree) fails the e2e:

```
✖ the documented install seeds the preset through the packaged postinstall hook
  Error: ENOENT: no such file or directory, open
  'C:\Users\joker\AppData\Local\Temp\install-presets-npm-Lq3pfZ\home\.pi\agent\model-system-prompt\MiniMax-M3.1-Flash-Preview.md'
ℹ pass 6
ℹ fail 1
```

The six unit tests still pass in that copy, because they call `installPresets()` directly and do not
depend on the lifecycle. Full e2e run is about 11s, and it skips if `pi` is not on PATH.

### Criterion 6 — not met, deliberately unticked

The package is not published. Against the public registry:

```sh
npm view pi-model-system-prompt --registry https://registry.npmjs.org/
# npm error 404  The requested resource 'pi-model-system-prompt@*' could not be found
```

Publishing is a human step that needs credentials, so it was not attempted. What remains: run
`npm publish --registry https://registry.npmjs.org/` from a machine with publish credentials (the
configured registry here is the `npmreg.proxy.ustclug.org` mirror, so the target must be explicit),
then re-run `npm view pi-model-system-prompt` and a real `pi install npm:pi-model-system-prompt` to
close this box. The packaging is otherwise proven — the same tarball installs and loads from a
`file:` spec (criterion 4) — but "installable from npm" is not the same claim, and it stays open.

### Judgement calls

- **Missing-`presets` early return in `install-presets.mjs` — kept.** It is one line, and the
  alternative is that a `postinstall` hook throws `ENOENT` and takes the user's entire `pi install`
  down with it. A hook is the one part of this package that runs where we do not control failure
  handling, on the user's machine, during the single command criterion 2 promises will work. Made
  total, it costs a line. The branch is unreachable for a correct published tarball (`presets/` is in
  the `files` whitelist) and is covered by its own test.
- **README blurb — kept.** The README is the npm package page, i.e. the only documentation a user
  installing `pi install npm:pi-model-system-prompt` actually lands on. Criterion 2 asks for install
  to be documented as one command; that is not satisfied by AGENTS.md, which no npm visitor reads.
  It is four lines: what it does, the one command, and the prompt-file path.
- **Duplicate preset filename in the test — fixed, and now genuinely single-sourced.** The shipped
  filename was a literal in four places, including a regex with hand-escaped dots, so the earlier
  claim that a rename is a one-line change was false. It is now the single `PRESET` constant: three
  sites join a path from it, and the dev-command assertion builds its regex from it with
  `PRESET.replace(/\./g, "\\.")`. A rename is now a one-line change, as claimed.
- **Test helper naming in the e2e.** `install(spec_)` existed only to avoid reading as a second
  `spec`, and `spec`/`pack` under-described what they did. Renamed to say what each does:
  `npmSpec(pkg, tarball)` builds an install spec, `packIntoSpec(dir, pkg)` packs a directory and
  returns that spec, `installSpec(spec)` runs the real CLI with it. The three repeated
  `assert.deepEqual(readFileSync(seeded), readFileSync(shipped), ...)` calls and the two absence
  assertions are now `assertSeeded(why)` and `assertNotSeeded(why)`.
- **`done` added to the triage table.** `Status: done` was outside the five role strings in
  `docs/agents/triage-labels.md`. Stopping its use was not an option — issue 04 already used it and
  is out of scope here — so the table gained a `done` row, with the left column marked as having no
  skills equivalent since `done` is a workflow state rather than a triage role.
- **Project name differing across docs — left as is, deliberately, and unchanged this round.** The
  two names are different things: `pi-model-system-prompt` is the npm package name, and
  `model-system-prompt` is the project name used by `spec.md` (untouched), the repo directory, and
  therefore AGENTS.md and CONTEXT.md. The README heading carries the package name because that is
  what npm renders and what users type. Collapsing them would either contradict `spec.md` or make the
  README lie about the package.
- **`.scratch/preset-templates/` naming — left, and confirmed left.** The directory name predates
  this ticket and is not one of its decisions, so it stays as found; nothing in this change reads it
  as a spec template.
- **Two stale copies of the old package name, fixed.** The rename left `index.ts`'s header comment
  and `package-lock.json` still saying `model-system-prompts`. Both are artifacts of this ticket's own
  rename, so they were corrected rather than left as drift.

### Why a project-wide doc changed under this ticket

A review of this ticket asked for `done` to be reconciled with
`docs/agents/triage-labels.md`, which listed only the five skills roles while this ticket and issue
04 both use `done`. The fix was a `done` row in that table — but that left the two standards sources
disagreeing, because AGENTS.md's "Triage labels" section still said "Five canonical roles, label
string equals role name." So AGENTS.md now reads: five skills roles with the label string equal to the
role name, plus `done`, this repo's own workflow state for implemented and verified work, which has no
skills equivalent. That is a one-line doc edit outside the seeding code, made here only because the
`done` row was requested in review and AGENTS.md is what a contributor reads first.

### Residual items, seen and deliberately left

Each was looked at and left alone, not missed:

- **README heading vs project name.** README says `# pi-model-system-prompt`, AGENTS.md and
  CONTEXT.md say `# model-system-prompt`. Left: they name different things (npm package vs project),
  and collapsing them would contradict `spec.md` or make the README misname the package.
- **`.scratch/preset-templates/` uses "template", which CONTEXT.md's Avoid-list reserves.** Left,
  but with a correction to the usual framing: the slug and the Avoid-list entry landed in the *same*
  commit `27c2899` (2026-10-05), the one that created the directory, so neither predates the other.
  What is true is that both predate this ticket's implementation work, so the collision is
  pre-existing rather than introduced here, and the slug is not one of this ticket's decisions.
- **`.pi/agent/model-system-prompt` is written out literally in two test files** (three call sites:
  `extension.test.ts`, and twice in `install-presets.test.ts`). Left: this round is doc-only, and
  the two files are the two halves under test — the handler that reads the path and the script that
  seeds it — so each asserts the literal path rather than sharing a constant. Collapsing them is a
  reasonable follow-up, not a blocker.
- **The e2e test takes about 12s.** Left: it drives the real `pi` CLI through five installs plus two
  `npm pack` runs, so the time is the CLI's, not the test's. It skips when `pi` is not on PATH, which
  keeps `npm test` fast for a contributor who has not installed pi.
