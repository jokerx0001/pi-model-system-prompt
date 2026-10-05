# 01: Ship preset prompts that install into the user's prompt directory

**What to build:** The project carries ready-made presets — prompt text for a model, which a user
would otherwise have to write themselves. Installing the extension into pi is one command, and that
one command also puts the presets in the user's prompt directory. After it, a preset is a prompt
file the user owns: editable, and deletable to turn that model off.

**Blocked by:** None (can start immediately)

**Status:** done

- [ ] At least one preset ships with the package, named after the model it configures
- [ ] Installing is one command, documented as one command: `pi install npm:pi-model-system-prompt`.
      It both installs the extension and copies the presets into the user's prompt directory. There
      is no second command, and nothing happens at pi start-up
- [ ] The copy is made by the published package's own npm install lifecycle — a `postinstall` hook
      that runs once, when pi installs the package. Not by extension load code, and not by a command
      the user runs by hand
- [ ] pi discovers and loads the extension from the installed npm copy, through the entry point the
      package declares
- [ ] The package declares pi's own packages as peers rather than dependencies, so the installed tree
      carries no second copy of them and pi suppresses peer installation for the managed install
- [ ] The package is installable from npm as `pi-model-system-prompt`; publishing it is a documented
      one-time step
- [ ] Presets land in the same directory the extension reads at run time — one location, never a
      second copy
- [ ] Installing over a file the user already has leaves that file byte for byte as it was, whether
      or not they edited it
- [ ] Installing into a prompt directory that does not exist yet creates it
- [ ] Installing twice in a row changes nothing the second time
- [ ] A preset the user deleted stays deleted: neither a later install of a different package nor
      re-running the same install brings it back. (A version upgrade does run the hook again and will
      re-seed; which way that falls is not asserted here.)
- [ ] Nothing is written beside the presets themselves: no manifest, no state file, no marker
      recording what was installed. The install-once guarantee comes from npm's own dependency state,
      not from a file this project writes
- [ ] Only prompt files are seeded; anything else shipped alongside them is left alone
- [ ] A seeded preset is indistinguishable from one the user wrote: they can edit it, and deleting
      it turns that model off exactly as an unconfigured model behaves
- [ ] Development is unchanged: the project still installs as a local-path package that pi loads from
      source, editable and reloadable, with the seeding script still runnable by hand on a dev machine
- [ ] The seeding behaviour is covered by an automated check that exercises the packaged artifact the
      way a user installs it: pack the package, run the real `pi install npm:<tarball>` with the agent
      directory *and* the home directory redirected to temporary locations, and assert the preset
      lands in the redirected prompt directory and the command exits 0
- [ ] The project's own documentation — the agent instructions and the domain model's definition of
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

### Acceptance criteria evidence

1. **At least one preset ships** — `presets/MiniMax-M3.1-Flash-Preview.md` (6119 bytes). Included in tarball per `npm pack --dry-run`.
2. **One command, documented as one command** — README.md, AGENTS.md, CONTEXT.md all show `pi install npm:pi-model-system-prompt` as the user-facing install. E2E test runs exactly one `pi install` and asserts preset lands.
3. **Copy via postinstall hook** — `package.json` has `"postinstall": "node install-presets.mjs"`. Extension code (`index.ts`) only reads, never writes. Verified in E2E test.
4. **pi discovers/loads from installed copy** — Manual verification: ran `pi install npm:pi-model-system-prompt-0.1.0.tgz` in redirected agent dir; `pi list` shows `npm:pi-model-system-prompt-0.1.0.tgz` under "User packages". Package declares `pi.extensions: ["./index.ts"]`.
5. **Pi packages as peers** — `package.json` has `peerDependencies: { "@earendil-works/pi-coding-agent": "*" }`, no `dependencies`. Per pi docs, managed installs suppress peer installation.
6. **Installable from npm** — Package name is `pi-model-system-prompt`. Verified installable from local tarball via `pi install npm:<tarball>`. AGENTS.md documents publishing as manual one-time step targeting public registry explicitly.
7. **Same directory, one location** — Both `installPresets()` and extension's `promptsDir()` resolve to `~/.pi/agent/model-system-prompt/<modelId>.md`.
8. **Never overwrites user file** — Test "never overwrites a file the user already has, edited or not" in test/install-presets.test.ts. E2E test also verifies this across two installs.
9. **Creates missing directory** — Test "copies a preset into a target directory that does not exist yet". Uses `mkdirSync(target, { recursive: true })`.
10. **Idempotent (install twice)** — Test "installing twice is idempotent..." returns `{ copied: [], skipped: [...] }` on second run.
11. **Deleted preset stays deleted** — E2E test deletes seeded preset, runs `pi install` again with same tarball, asserts file still gone. npm reports "up to date" for already-satisfied dependencies.
12. **No manifest/state/marker files** — `installPresets()` only calls `copyFileSync` for .md files; creates no manifest or marker. Verified in E2E test: only preset .md appears in redirected prompt dir.
13. **Only .md files seeded** — `installPresets()` filters with `name.endsWith(".md")`. Test "copies only the missing presets..." verifies non-.md files not copied.
14. **Seeded preset = user file (edit/delete)** — Extension reads fresh on every run (`readFileSync` in `before_agent_start`). Tests verify edits apply next run; deleting file = no injection (unconfigured model behavior).
15. **Development unchanged** — AGENTS.md documents both paths. `npm run install-presets` script preserved for manual dev seeding.
16. **Automated check with real pi install** — Test "the documented install seeds the preset through the packaged postinstall hook" in test/install-presets.test.ts. Runs `npm pack`, then `pi install npm:<tarball>` with HOME/USERPROFILE/PI_CODING_AGENT_DIR redirected to temp dirs. Asserts preset lands and exits 0. Skips if pi not on PATH.
17. **Documentation says one command** — AGENTS.md Install section shows single command first, dev path separate. CONTEXT.md "Install" definition updated to one command.
