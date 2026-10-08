# 01: Longest prefix wins

**What to build:** The active model resolves to the prompt file whose name is the longest
case-insensitive prefix of its id. `glm-5.3-flash.md` serves `glm-5.3-flash`; without it,
`glm-5.3.md` serves it; without that, `glm.md`. The winning file is then read under the rules that
already exist: unreadable or empty/whitespace-only injects nothing, and does not fall back to a
shorter match. Spec: [`../spec.md`](../spec.md). Decision: [`docs/adr/0001`](../../../docs/adr/0001-longest-prefix-match-wins.md).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Resolution is the longest case-insensitive filename prefix of the model id; a file named
      `.md` (empty stem) is not a candidate, and the exact file wins without a separate branch
- [ ] The winner is chosen by name alone; an unreadable or empty/whitespace-only winner injects
      nothing and no shorter candidate is consulted
- [ ] Handler tests cover: family fallback, the exact file winning, the longest of three winning,
      an empty winner suppressing a full family file, a whitespace-only winner doing the same, an
      unreadable winner not falling back, case-insensitive matching, `.md` ignored, and the
      case tie-break where the filesystem can hold both names; the existing no-op cases still pass
- [ ] `npm run check` is green, with the host pi linked so the typecheck sees the real extension
      context type
- [ ] Docs updated: `CONTEXT.md` (the off-switch sentence and the **Family file** term),
      `AGENTS.md`, `README.md`, `README.zh-CN.md`, the prompt directory's own `README.md`, and the
      resolution in the `prompt-inspector` debug extension outside this repo
- [ ] Verified end to end in a live session with the evidence recorded below: a model with no exact
      file, served by a family file, shows that file's text at the tail of the `system` message in
      the request that actually reaches the provider

## Notes

The rule is now a property of the directory rather than of one file: adding or deleting a file
changes resolution for ids other than the one it is named after. That is intended and is why the
per-model duplicate presets stay — the user wants to be able to diverge them later.

Two consequences are accepted rather than repaired, and are written down so nobody "fixes" them:

- Deleting a per-model file no longer turns that model off while a shorter file still matches it;
  emptying the file is the reliable switch.
- The prefix is raw, so `glm.md` also serves `glmish-2`, and a stray `g.md` would serve every id
  starting with `g`.

## Evidence

To be recorded when the code lands: the test names that pin each rule, the `npm run check` result,
and the outgoing-payload comparison for the live criterion (marker file plus a throwaway
`before_provider_request` probe, as ticket 01 of `model-system-prompt` did).
