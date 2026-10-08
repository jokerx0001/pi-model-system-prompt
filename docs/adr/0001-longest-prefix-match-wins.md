# Longest filename prefix wins, case-insensitively

**Status:** accepted

A model id's tail churns — `MiniMax-M3` becomes `MiniMax-M3.1-Flash-Preview`, `glm-5.3` gains
`-flash` — and exact-name resolution made every new id a new copy of the same text, with the copies
drifting apart silently. So the active model is now resolved to the prompt file whose name is the
longest prefix of its id, compared case-insensitively, with the exact file winning automatically
since no longer name can prefix the id; the winner is then read under the existing rules, and an
unreadable or empty winner injects nothing rather than falling back to a shorter match.

The deliberate consequence: deleting a per-model file no longer turns that model off wherever a
shorter file still matches it. Emptying the file is the reliable off switch, and emptying is what
the docs now teach.

## Considered Options

- **Separator-bounded prefixes** (`glm.md` matching `glm-5.3` but not `glmish-2`): rejected for a
  collision no real model id produces, at the cost of a second rule to remember.
- **Falling back to a shorter match when the winner is empty or unreadable**: rejected because the
  same on-disk state then resolves differently by platform (EACCES on Linux, EISDIR on Windows for
  the same mistake), and because it makes "which file is in effect" depend on content rather than
  name.
- **Keeping exact names and shipping a copy per model**: rejected as the status quo that drifts.
- **Globs or pattern syntax**: rejected — filenames are the whole configuration; there is no
  manifest and no state file, and a second syntax would break that.
