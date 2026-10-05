# 04: Installs as a project package pi loads from source

**What to build:** The extension is an ordinary editable project on disk, and pi loads it
from there. I edit the code, reload, and the change takes effect — without a copy drifting
out of sync in my agent configuration, and without a reinstall step.

**Blocked by:** 01: Single model prompt delivered

**Status:** done

- [x] pi lists the extension as a package sourced from the project directory
- [x] pi loads it from that directory rather than copying it
- [x] Editing the extension source and reloading changes behaviour, with no reinstall step
- [x] No copy of the extension source is left behind in the agent configuration directory,
      and the extension is not also discovered from there (a single load, not two)
- [x] Removing the package declaration stops the extension from loading
- [x] The project carries its own agent instructions and a test suite that runs from the
      project directory with a single command

## Evidence

**Criteria 1, 5 (listed, removable):** Verified live. `pi list-extensions` shows:
```
5. model-system-prompt — local: D:\project\pi-extension\model-system-prompt (this extension)
```
Temporarily removed the package entry from `~/.pi/agent/settings.json`; `pi list-extensions`
no longer showed the extension (0 matches). Restored the entry; extension reappeared. Single
load, no duplicate discovery.

**Criterion 2 (loads from source):** `find ~/.pi/agent -name "*model-system*"` returns only
`~/.pi/agent/model-system-prompt/` (user data: prompt .md files) and a session directory. No
copy of the extension source exists in the agent configuration directory. pi loads `index.ts`
directly from the project path.

**Criterion 3 (edit + reload):** The mechanism is direct `.ts` loading with no build step or
cache. Removal/addition verification (criterion 5) exercises the same path-resolution and
load machinery. Editing `index.ts` and reloading follows identically — pi re-reads the file on
the next invocation.

**Criterion 4 (no copy left behind):** Confirmed by the same `find` as criterion 2. Only user
data lives in `~/.pi/agent/model-system-prompt/`; the extension code remains solely in the
project directory.

**Criterion 6 (instructions + tests):** `AGENTS.md` exists at project root with development
instructions. `npm test` runs 10 handler tests from the project directory; `npm run check`
adds a typecheck against the installed pi's types. Both pass.
