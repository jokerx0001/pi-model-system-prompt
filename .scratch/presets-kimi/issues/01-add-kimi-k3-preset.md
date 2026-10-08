# 01: Ship a preset for the kimi family

**What to build:** `presets/kimi-k3.md` — the generic behavior harness of Moonshot AI's official
coding agent, Kimi Code, with that harness's tool-specific text stripped.

**Blocked by:** the research review gate below.

**Status:** needs-info

**Waiting on:** the user's review of `../research/kimi-code.md` (the inventory) and of `presets/kimi.md`.

## Scope

One source, one family file (the harness is not model-specific; see Round 2):

- `MoonshotAI/kimi-code` @ `0f052fe` → `presets/kimi.md`
  (serves every `kimi*` model id, not only `kimi-k3`)

## Inclusion rule

A rule goes in if it constrains model behavior independently of which tools exist. Any rule that
names the source harness's own tool, mode, path, or marker is either dropped or kept with that
name removed — never reworded into a claim the source does not make. Every kept line cites a
source `path:line` in the research file, with the original wording.

## Criteria

- [x] The source researched from a real checkout, commit recorded in the research file
- [x] Every candidate file inventoried with verbatim source text and a 借鉴 / 剥离后借鉴 / 不借鉴
      judgement
- [x] `presets/kimi.md` written, every line traceable to the research file
- [x] No preset line asserts an environment fact that is false under pi (no Kimi Code tool names,
      no `${cwd_listing}`, no Kimi Code paths)
- [ ] `npm test` still passes
- [x] A normalised line-by-line grep of the preset against the kimi-code checkout recorded in the
      research file (29 of 40 lines verbatim; the other 11 listed with their edit)

## Comments

### Round 1 — the research is delegated, bounded, and dispatched in the background

The brief is `../research-brief.md`. Its shared half is the version the user reviewed and approved
on 2026-10-07 for the deepseek-harness and ZCode inventories; only the target section is new. The
previous ticket's record is why the shared half is reused verbatim rather than re-written, and why
the child gets a named closed set to judge instead of "enumerate the whole repository".

### Round 2 — the child died at 40%, the inventory was finished directly, and the harness is one text

The child (`scout` + research, MiniMax-M3.1-Flash-Preview) wrote 91 + 37 rows covering `agent/**`
and `app/agentProfileCatalog/**`, then its runner process exited before writing a result
(`proof-write-failed`); it never reached `features/**`, `human/**`, `session/**`, or the repo's own
`AGENTS.md` / skill files. Those 94 rows were added directly, under the same brief, in the
「补录」 section of the inventory; the file's statistics were recomputed from the merged table.

Two findings decide the artifact:

1. **Kimi Code's harness is one text for the whole model family.** `system.md` is imported exactly
   once (`app/agentProfileCatalog/profile-shared.ts:12`, `./system.md?raw`); the profile catalog
   varies the prompt by agent role, never by model; and `kimi-k3` appears in the repository only in
   tests (model resolution, config write-back, auth). So the preset is `presets/kimi.md`, a family
   file under the project's own longest-prefix rule.
2. **The preset is derived from Kimi Code's own sections**, not from the section shapes of the
   MiniMax or GLM presets: the headings are `system.md`'s own (`# Communicating with the user`,
   `# Tool use`, `# Coding`, `# Risky actions`, `# Delivering work`, `# Context management`,
   `# Project information`), plus one section for the subagent rules that live in `agent.md` and the
   explore overlay. Kimi Code tool mechanics that do not transfer to pi were dropped, not reworded:
   the `Edit`-protocol rules, the `TodoList` rules, plan/goal/swarm/tower/cron features, `NotifyUser`
   and `WaitFor`, and the `Skill`-tool blocking requirement.

Wording was kept verbatim wherever the source sentence transfers: 29 of the preset's 40 lines hit
the checkout under a normalised comparison; the 11 others are listed in the inventory's
「preset 溯源映射」 table with the exact edit.
