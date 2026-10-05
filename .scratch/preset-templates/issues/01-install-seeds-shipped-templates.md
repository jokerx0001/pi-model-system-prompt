# 01: Ship preset prompts that install into the user's prompt directory

**What to build:** The plugin carries ready-made presets — prompt text for a model, which a user
would otherwise have to write themselves — and installing puts them in the user's prompt directory.
Install is two documented steps; when they are done, a preset is a prompt file the user owns.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] At least one preset ships with the plugin, named after the model it configures
- [ ] Installing is two steps, both documented: `pi install .` records the package in
      `~/.pi/agent/settings.json`, and `npm run install-presets` copies `presets/*.md` into the
      user's prompt directory. The second step is the whole of the rest of install, not a hidden
      extra: there is no third command, and nothing happens at pi start-up
- [ ] Presets land in the same directory the extension reads at run time — one location, never a
      second copy
- [ ] Installing over a file the user already has leaves that file byte for byte as it was, whether
      or not they edited it
- [ ] Installing into a prompt directory that does not exist yet creates it
- [ ] Installing twice in a row changes nothing the second time
- [ ] Nothing is written beside the presets themselves: no manifest, no state file, no marker
      recording what was installed
- [ ] Only prompt files are seeded; anything else shipped alongside them is left alone
- [ ] A seeded preset is indistinguishable from one the user wrote: they can edit it, and deleting
      it turns that model off exactly as an unconfigured model behaves
- [ ] The seeding behaviour is covered by an automated check that runs the real entry point:
      `node install-presets.mjs` with the home directory redirected to a temporary directory,
      asserting the preset lands there and the command exits 0

## Notes

This deliberately reverses one line of the existing spec's Out of Scope, "A default prompt file
shipped with the extension". Decided: `spec.md` is unchanged. That entry, and the spec's "no default
file for unmatched models" decision, describe *runtime resolution* — with no file for the active
model, nothing is injected — and a preset does not touch that path: it is the copy source for that
one model's file, and a model with no preset behaves exactly as an unconfigured model does. The
shipped extension never consults a preset at run time.

Install is two steps because a local-path package gives no hook to do it in one. The only
one-command mechanisms re-create a preset the user deleted: an npm `postinstall` hook also fires on
every later `npm install`, and seeding from extension load code re-runs on the next start. Seeding
exactly once would require state recording what was installed, which criterion 7 forbids. So three
criteria cannot all hold over time: 2 ("no second command"), 7 ("no marker, no state file"), and 9
("deleting the file turns the model off"). This ticket keeps 7 and 9 and accepts two commands, with
the second one explicit and documented.

Do not assert that a reinstall restores a deleted preset, or that it does not. Which way that falls
depends on how the package manager treats an already-satisfied dependency, so it is not a property
this project controls. The criterion above is the one that is actually under control: absence is
honoured, and the extension behaves as though the model were never configured.
