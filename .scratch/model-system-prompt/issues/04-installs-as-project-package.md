# 04: Installs as a project package pi loads from source

**What to build:** The extension is an ordinary editable project on disk, and pi loads it
from there. I edit the code, reload, and the change takes effect — without a copy drifting
out of sync in my agent configuration, and without a reinstall step.

**Blocked by:** 01: Single model prompt delivered

**Status:** ready-for-agent

- [ ] pi lists the extension as a package sourced from the project directory
- [ ] pi loads it from that directory rather than copying it
- [ ] Editing the extension source and reloading changes behaviour, with no reinstall step
- [ ] No copy of the extension source is left behind in the agent configuration directory,
      and the extension is not also discovered from there (a single load, not two)
- [ ] Removing the package declaration stops the extension from loading
- [ ] The project carries its own agent instructions and a test suite that runs from the
      project directory with a single command
