# Spec: prefix-matching

**Status:** ready-for-agent

Resolve the active model to a prompt file by the longest filename prefix that matches, instead of
requiring the name to be the model id verbatim. This amends `.scratch/model-system-prompt/spec.md`,
which decided exact names and no family matching; the decisions below replace that half of it.

## Problem Statement

Model ids grow tails. `MiniMax-M3` gains `MiniMax-M3.1-Flash-Preview`; `glm-5.3` gains `-flash`
or a quantization suffix; a provider adds a routing suffix. Under exact-name resolution every new
id is a new file to write, and the only way to serve a family is to copy the same text under every
name. The copies then drift: an edit to one leaves the others serving the old text, and nothing on
screen says which file a session actually used.

## Solution

The prompt directory is a table of names, and the active model takes the longest name that is a
prefix of its id. Id `glm-5.3-flash` is served by `glm-5.3-flash.md`, else `glm-5.3.md`, else
`glm.md` — whichever is the longest match. Comparison is case-insensitive. The winning file is
then read under the existing rules: unreadable, empty, or whitespace-only injects nothing, and
does not fall back to a shorter match.

## User Stories

1. As a pi user, I want one file to serve a whole family of ids, so that a model I keep upgrading
   does not need a new copy of the same text for every version, preview, or quantization suffix.
2. As a pi user, I want the most specific file I have to win, so that tuning one id is not
   overridden by a broader file, and a broad file is not silently shadowed where I meant it to apply.
3. As a pi user, I want an empty file to mean "nothing, deliberately" even when a broader file
   would otherwise match, so that I can turn a model and everything under its name off without
   giving up the family text its siblings still need.
4. As a pi user, I want naming to be the whole configuration — no globs, no pattern syntax, no
   manifest, no state file — so that what I see in the directory is what applies.
5. As a pi user, I want a hand-written `minimax-m3.md` to serve `MiniMax-M3`, so that my casing
   mistake on Linux is the same non-event it already is on Windows and macOS.
6. As a pi user, I want the same resolution on every platform, so that a sync tool or a checkout
   does not change which prompt a model gets.
7. As a pi user, I want a permissions mistake or a stray directory named `glm-5.3.md` not to
   reroute that model to another file, so that the file name alone decides.
8. As a pi user, I want model ids that appear after I wrote my file to keep working, so that a new
   suffix added by a provider does not silently drop my prompt.

## Implementation Decisions

- **Resolution rule, stated once.** List the prompt directory. A candidate is a file whose name
  ends in `.md` (that check is case-insensitive too) and whose stem is a non-empty prefix of the
  active model id, compared case-insensitively. The winner is the longest stem, and it is read
  under the name the listing actually returned — never under a rebuilt `<stem>.md` path, which
  would miss a file like `GLM.MD` on a case-sensitive filesystem. If the winner cannot be read, or
  trims to nothing, inject nothing and stop.
- **Raw prefix, no separator required.** `glm.md` matches `glmish-2`. This is the accepted cost of
  the simplest rule; separator-bounded matching was rejected as an extra rule to remember for a
  collision no real model id produces.
- **The exact file always wins, with no branch for it.** A longer name cannot be a prefix of the id
  it is compared against, so the exact file is automatically the longest candidate whenever it
  exists. There is no "try the exact name, then fall back" sequence.
- **Case-insensitive, with a deterministic tie-break.** Two files that differ only in case are two
  candidates of the same length (only possible on a case-sensitive filesystem): the one whose
  casing equals the id's wins; otherwise the lexicographically first stem wins. The tie-break
  exists so that resolution cannot depend on `readdir` order.
- **A directory listing is the mechanism, not an optimization.** Case-insensitivity is what forces
  it: on Linux an exact-case probe cannot find a mis-cased file, so the real names must be listed
  and compared lowered. On Windows and macOS the filesystem would have resolved the case anyway,
  which is exactly why the code should not depend on that.
- **The winner is chosen by name; content and readability never influence the choice.** Hence no
  fallback when the winner turns out to be empty or unreadable — the alternative makes the effective
  rule depend on the platform's error for the same on-disk state (EACCES on Linux, EISDIR on
  Windows for the same mistake).
- **Empty means off, and only where it is the winner.** `glm-5.3.md` empty with `glm.md` full means
  `glm-5.3` gets nothing, and so does `glm-5.3-flash`: `glm-5.3` is still that id's longest prefix,
  so emptying a name silences every id under it. That propagation is what makes an empty file the
  reliable off switch once family files exist, and it is what the READMEs and the prompt
  directory's own README say.
- **Deleting stops being an off switch wherever a shorter file still matches.** Deleting
  `glm-5.3.md` no longer turns that id off while `glm.md` exists. Documented rather than repaired:
  repairing it needs a state file or an in-file marker syntax, both rejected.
- **Presets are untouched.** The shipped per-model duplicates stay, because they are per-model
  copies the user intends to diverge. On a machine whose every model has its exact file, this
  change alters nothing; it first shows up when a shorter family file exists.
- **The resolution is per run and uncached.** Same as before: a `readdirSync` of a directory
  holding a handful of files, so a newly written or edited file applies to the next message.
- **Nested prompt files are dropped; ids containing a slash get no special case.** Such an id used
  to resolve to a file inside a subdirectory (`dir/<id>.md`), and a flat listing never finds that
  file again. The id can still be served by a flat file through the ordinary prefix rule
  (`openai.md` serves `openai/gpt-4`). No id in the catalogue contains a slash.

## Testing Decisions

The seam is unchanged: register the handler against a stub `pi`, invoke it with a stub event and
context, assert only the value returned. Case-level additions:

- **Family fallback**: `glm.md` serves id `glm-5.3-flash`.
- **The exact file wins**: `glm.md` plus `glm-5.3.md` for id `glm-5.3` gives only the latter's text.
- **The longest of three wins**: `glm.md`, `glm-5.3.md`, `glm-5.3-flash.md` for id
  `glm-5.3-flash-2` gives the flash text.
- **An empty winner suppresses the family file**: `glm.md` full, `glm-5.3.md` empty, id `glm-5.3`
  returns nothing — the rule the ticket was written for.
- **A whitespace-only winner does the same.**
- **An unreadable winner does not fall back**: a directory named `glm-5.3.md` beside a full
  `glm.md` returns nothing, which pins the platform-independent reading of the rule.
- **Case-insensitive matching**: `MiniMax-M3.md` serves id `minimax-m3`.
- **The prefix is raw**: `glm.md` serves id `glmish-2`, pinning the accepted cost rather than
  leaving it to prose.
- **A mis-cased extension**: `GLM.MD` serves id `glm`, and is read under the name on disk.
- **An id containing a slash**: `openai.md` serves `openai/gpt-4`, and a real nested
  `openai/gpt-4.md` is never found.
- **Resolution is per run**: a longer file written between two calls wins on the second.
- **A file named `.md` is not a candidate**, since its empty stem would otherwise prefix every id.
- **The case tie-break is asserted only where the filesystem can hold both names**; the test
  detects a case-insensitive filesystem and skips.
- The existing no-op cases still hold unchanged: no prompt directory, no active model, no name
  matching the id, an unreadable *only* file.

## Out of Scope

- Globs, wildcards, or any pattern syntax beyond a literal filename prefix
- A required separator after the matched prefix
- Unicode normalisation or case folding beyond `toLowerCase()`: names and ids are compared as raw
  code units, so an NFD filename on macOS may not match a non-ASCII id — and no real model id is
  non-ASCII
- Model ids containing `/`, and therefore prompt files in subdirectories
- Caching or preloading the resolution
- Provider-qualified keys, or any change to how a provider is chosen
- Changing the shipped presets, including removing the byte-identical per-model duplicates
- Repairing the deletion off-switch, or any removal of text already injected in a session

## Further Notes

Resolution is now a property of the directory rather than of one file: adding `glm-5.3-flash.md`
changes what id `glm-5.3-flash` gets on the next message, and a too-broad file (`g.md`) takes every
id starting with `g`. Both are the feature working as specified, and both are reasons the prompt
directory holds a small, intentional set of files rather than everything a user ever tried.
