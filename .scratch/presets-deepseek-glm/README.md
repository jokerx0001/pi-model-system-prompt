# presets-deepseek-glm

Adding per-model presets for the DeepSeek series (source: `deepseek-ai/deepseek-harness`) and
GLM-5.3 / GLM-5.3-Flash (source: `zai-org/ZCode`).

## Research — awaiting review

Two inventories, one per source repo, listing every file that carries harness prompt-layer text,
one row per content item, each item marked 借鉴 / 剥离后借鉴 / 不借鉴 with a reason:

- [`research/dsh-deepseek.md`](research/dsh-deepseek.md) — dsh @ `5badb15` · 61 files / 70 items · 7 / 31 / 32
- [`research/zcode-glm.md`](research/zcode-glm.md) — ZCode @ `29628c9` · 45 files / 74 items · 24 / 18 / 32

Each states its enumeration method, its coverage gaps, and a `判定自检` section for the entries that
are genuinely two-sided. Review these before any preset is written.

Delegation to subagents was attempted three times and abandoned: the brief was unbounded (every
candidate file, every row quoted verbatim), which exceeded one child's context and produced
282–296 turns with 732–1089 compaction events and no output. The inventories were produced directly
instead. See the ticket for the numbers.

## Ticket

[`issues/01-add-deepseek-and-glm-presets.md`](issues/01-add-deepseek-and-glm-presets.md)
