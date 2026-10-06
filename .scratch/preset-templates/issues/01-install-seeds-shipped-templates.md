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
      way a user installs it: pack the package, run the real `pi install npm:<tarball>` with the agent
      directory *and* the home directory redirected to temporary locations, and assert the preset
      lands in the redirected prompt directory and the command exits 0
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

Probe (`$PI_CODING_AGENT_DIR` = the temp agent dir):

```js
const piDir = "<npm global root>/node_modules/@earendil-works/pi-coding-agent";
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

Both are now in the e2e test, which runs this sequence against the real CLI with `HOME`, `USERPROFILE`
and `PI_CODING_AGENT_DIR` all redirected to temp dirs and the tarballs packed into a temp dir:

1. `pi install` our package — asserts the preset is byte-identical to `presets/`.
2. Asserts the copy landed in the agent npm tree and that no `@earendil-works` was installed there.
3. **Criterion 10:** `pi install` our package again with the preset present — asserts it is still
   byte-identical. This is the literal back-to-back case, separate from the deletion case.
4. **Criterion 11, first half:** `pi install` a second, unrelated package (`pi-unrelated-noop`, a
   real minimal pi package packed from a temp dir) — asserts the preset is still byte-identical.
5. **Criterion 11, second half:** delete the preset, `pi install` our package again — asserts it is
   still gone.

The test is not vacuous: with `postinstall` removed from `package.json` it fails on the first
assertion, and passes again once restored. Full run is about 10s, and it skips if `pi` is not on PATH.

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
- **Duplicate preset filename in the test — fixed.** The shipped filename was a literal in three
  places; it is now one `PRESET` constant, so a rename is a one-line change.
- **Project name differing across docs — left as is, deliberately.** The two names are different
  things: `pi-model-system-prompt` is the npm package name, and `model-system-prompt` is the project
  name used by `spec.md` (untouched), the repo directory, and therefore AGENTS.md and CONTEXT.md. The
  README heading carries the package name because that is what npm renders and what users type.
  Collapsing them would either contradict `spec.md` or make the README lie about the package.
- **Two stale copies of the old package name, fixed.** The rename left `index.ts`'s header comment
  and `package-lock.json` still saying `model-system-prompts`. Both are artifacts of this ticket's own
  rename, so they were corrected rather than left as drift.
