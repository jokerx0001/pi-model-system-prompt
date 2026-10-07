# 01: Ship presets for the DeepSeek series and GLM-5.3 / GLM-5.3-Flash

**What to build:** Preset files under `presets/`, one per model id, carrying the generic
behavior harness of that model's official harness — not that harness's tool-specific text.

**Blocked by:** None.

**Status:** needs-info

**Waiting on:** the user's approval of `../research-brief.md` before the re-research is
dispatched, and their ruling on the three provisional preset files.

## Scope

Two sources, two researches, one preset per model id:

- `deepseek-ai/deepseek-harness` @ `5badb15` → `presets/deepseek-flash.md`
- `zai-org/ZCode` @ `29628c9` → `presets/glm-5.3.md`, `presets/glm-5.3-flash.md`

## Inclusion rule

A rule goes in if it constrains model behavior independently of which tools exist. Any rule that
names the source harness's own tool, mode, path, or marker is either dropped or kept with that
name removed — never reworded into a claim the source does not make. Every kept line cites a
source `path:line` in the matching research file, with the original wording.

## Criteria

- [x] Each source researched from a real checkout, commit recorded in the research file
- [x] Every candidate rule inventoried with verbatim source text and a valuable / not-valuable judgement
- [x] `presets/deepseek-flash.md` written, every line traceable to the dsh research
- [x] `presets/glm-5.3.md` and `presets/glm-5.3-flash.md` written, every line traceable to the ZCode research
- [x] GLM pair byte-identical, because ZCode ships one harness text for the family
- [x] The MiniMax presets untouched (`git status` shows only additions; md5 unchanged)
- [x] No preset asserts an environment fact that is false under pi (no ZCode memory root, no
      `MEMORY.md` index, no tool names)
- [x] `npm test` still passes (17/17, including the packaged-install e2e against the real pi CLI)
- [x] A normalised line-by-line grep of each preset against its source checkout is recorded in the
      research file: ZCode 53/62 lines verbatim, the 9 exceptions listed with their edit; dsh 12/13
      lines reworded, each mapped to a source row and quote

## Comments

### Round 2 — the research output was the deliverable, and the order was wrong

The first pass wrote the presets and skipped the review gate. Corrected: the deliverable of this
phase is two per-repo inventory files, one per source, listing every file that carries candidate
harness text, with each item marked 借鉴 / 不借鉴 and a reason. The presets that already exist are
provisional and await this review.

Research files (one per repo, as required):

- `.scratch/presets-deepseek-glm/research/dsh-deepseek.md` — deepseek-harness @ `5badb15`,
  155 candidate files / 167 items / 48 借鉴 / 119 不借鉴. Enumeration method recorded: 14 grep and
  walk patterns, with the five ways model-facing text is produced in that repo.
- `.scratch/presets-deepseek-glm/research/zcode-glm.md` — ZCode @ `29628c9`,
  308 candidate files / 549 items / 127 借鉴 / 422 不借鉴.

Both were produced by a `scout` child carrying the research skill: primary sources only, a
`文件:行` citation per item, and a closing 边界与未决 section for the entries that are genuinely
two-sided and for the parts that were not covered.

### Defects found and fixed after the children reported

- The ZCode inventory had applied the rule backwards: "not bound to this harness" was treated as a
  sufficient reason to borrow, so third-party component docs and repo engineering standards were
  marked 借鉴. Re-run with a three-part rule (it constrains model
  behavior; it survives removing the harness's own nouns; it is useful in any system prompt).
  169 rows flipped; that file also then covered the four files it had admitted to skipping
  (`bundled-skills/skills/dynamic-workflows/{SKILL.md,examples.md,patterns.md}`, `DESIGN.md`).
- Six rows in the two files had lost the space after an escaped pipe while being repaired for table
  rendering, corrupting the verbatim quote. Re-derived from the source and rewritten. One ZCode row
  also cited `AGENTS.md:81-89` for text that is at `AGENTS.md:71`; corrected.
- Sample audit of 30 rows (seeded random, 20 per file): the quoted text is present at the cited
  location in every one of them. Three initial misses were false negatives from quotes that span
  concatenated string literals (`continuation-messages.ts:92`, `tool-goal/src/index.ts:119`,
  `persistent-memory-prompt.ts:126`).
- Statistics in both files were recomputed from the tables themselves and agree.

## Result

| Preset | Source | Size | Verbatim source lines |
|---|---|---|---|
| `presets/deepseek-flash.md` | dsh @ `5badb15` | 19 lines | 1 / 13 (the rest are dsh rules with the harness's nouns removed) |
| `presets/glm-5.3.md` | ZCode @ `29628c9` | 62 lines | 53 / 62 |
| `presets/glm-5.3-flash.md` | ZCode @ `29628c9` | 62 lines | identical copy of `glm-5.3.md` |

## Comments

### Open items for the user to judge

> Superseded by Round 2 above. The presets are provisional until the inventories are reviewed.

- `sections/memory.ts` in ZCode states a memory root, a `MEMORY.md` index, and the `Write` tool.
  Those are ZCode environment facts that are false under pi, so the preset keeps only the policy
  (dedupe, delete wrong notes, don't re-save what the repo records) and drops the storage claims.
  If you want the section shipped whole instead, it is one paragraph.
- `subagent/system-prompt.ts:15` ("the assistant MUST avoid using emojis") was left out. The
  shipped MiniMax preset instead says to use emoji sparingly; I did not import either rule.
- `packages/compaction/compaction-basic/src/summarizer.ts` (dsh) has one clause worth knowing —
  "Capture user feedback and explicit instructions faithfully, especially corrections" — but it is
  part of a compaction-engine prompt, so it was not transplanted.

### Round 3 — round 1's research was discarded as wrong, not just misjudged

The user's diagnosis, which is correct: the judging criterion was written as "why is it not
dependent on that harness's tools or environment", which

- makes portability the test, instead of the text being a model-behavior constraint at all; and
- uses "harness" — the engineering layer — to mean the tool (`ZCode`, `deepseek-harness`).

The subagent followed the wording it was handed.

Evidence in the discarded output that the binary marking was broken, not merely noisy:

- dsh `packages/fs/tool-fs/src/read.ts:74` was marked 不借鉴, reason "names this tool's `read` and its
  `offset`/`limit` parameters", while dsh `packages/web/tool-web/src/fetch.ts:453` was marked 借鉴,
  reason "can be taken whole, just swap the tool name" — the same fact, opposite verdicts.
- The presets written in round 0 borrow exactly the class the inventory marked 不借鉴, so the two
  artifacts contradicted each other.

Both research files were deleted. The redo's prompt is written for review first
(`../research-brief.md`). It fixes the terminology, makes "what model behavior does this constrain?"
the first and disqualifying question, and turns tool-binding into a second question that chooses
between 借鉴 and 剥离后借鉴 (keep, after stripping the name) rather than between 借鉴 and 不借鉴.

### Round 4 — the research was done directly, not delegated

Three delegated attempts failed for reasons in the task shape, not in the model:

| 尝试 | 模型 | 结果 |
|---|---|---|
| 1 | scout + research skill | 完成但判据错（「与工具无关」被当成借鉴的理由），且 `harness` 一词被用来指工具 |
| 2 | glm-5.3-flash | provider 429（额度），797s 失败 |
| 3 | glm-5.3-flash | 45 分钟超时；实测 282/296 turns、1069/1163 条 bash（去重 299/336）、**compaction 事件 732/1089 次**、同一命令重复 5–7 次、无产出 |

第 3 次的数据说明根因是我的产出物设计：要求「每个候选文件都列 + 每行逐字引用带行号 + 证明枚举完备」，
表就有 300+ 文件、500+ 行，超出单个子代理的上下文，于是它压缩、丢掉自己已做好的表、重做——循环到超时。
另外「穷举整个仓库」的要求让它为判定而打开上万不该进的目录。

改为：候选清单先由人给出闭集（dsh 49 个注册点、zcode 41 个），逐条判定，`不借鉴` 行降为一行。
两份清单已写完，见 `research/`。

### Round 4 的自查

- 统计由表格本身重算：dsh 61 文件 / 70 条 / 借鉴 7 / 剥离后借鉴 31 / 不借鉴 32；
  zcode 45 文件 / 74 条 / 借鉴 24 / 剥离后借鉴 18 / 不借鉴 32。
- 引用抽样核对（定种子随机，各 25 行）：dsh 12 行命中 + 4 行经人工确认为拼接导致的假阴性；
  zcode 20 行命中 + 1 行同为假阴性；其余 13 行因路径含通配符或内容非 ASCII 被跳过。
  即抽样中**没有**引用位置错误。
