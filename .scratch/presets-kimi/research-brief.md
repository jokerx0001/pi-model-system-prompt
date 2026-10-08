# 调研提示词（共同部分沿用 `../presets-deepseek-glm/research-brief.md`，2026-10-07 已审核通过）

共同部分逐字沿用已审核版本，仅本节的「目标仓库追加」换成 kimi-code。措辞未改。

派遣参数：一个子代理；`agent: scout`、`skill: research`、
`model: newapi-dev/MiniMax-M3.1-Flash-Preview:high`、async；
`output` 指向下面的输出路径，`timeoutMs: 3600000`、`checkpointBeforeDeadlineMs: 600000`。

---

## 共同部分（每个仓库都发）

你是研究子代理，按 research skill 执行：只依据一手来源（被调研仓库自己的源码与仓库内文档），
每条结论标注 文件:行；不引用二手转述。

产出：一个 markdown 文件，列出该仓库里所有属于「针对模型harness 提示词层」的文本，每个文件、每条内容
一行，逐条判定它是不是针对特定模型且与具体agent工具无关的提示词。

## 名词（先说清，避免歧义）

- harness：把模型变成 agent 的那层工程——循环、工具契约、权限，以及约束模型行为的提示词文本。
- harness 提示词层：本任务的抽取对象，即模型实际会读到的指令文本。
- kimi-code：Moonshot AI 的官方 coding agent（Kimi Code CLI）的产品名。本任务一律称其产品名。
- 与工具绑定：文本里点名了与具体工具的独特能力（譬如 kimi-code 自己的 Tower / Swarm / Goal，
  或 pi 没有的 `Bash`、`TodoList`、`SendDMail` 这类工具）。

## 候选定义（什么算一条候选）

算候选：模型会读到的指令性文本——系统提示词 section、注入的 reminder、guard 的纠偏文本、子代理
身份契约、工具说明里承载的行为规则（不是参数解释）、skills 里规范「怎么干活」的规则、AGENTS.md /
CLAUDE.md 里约束 agent 工作方式的规则、部署配置（bundle / preset / persona / plan-mode section）
里的字面提示词、compaction 与长期记忆这类改变模型行为的指令。

不算候选：纯代码逻辑、类型定义与生成目录、测试与夹具、i18n 词条、UI 文案、日志与错误字符串（除非
该字符串本身就是给模型的指令）、第三方库 / CLI / 组件的 API 文档与用法手册、仓库自身的工程规范
（编码 / 目录 / 提交 / 文档流程）、README 导航与元数据、传输与包装框架文本。不算候选的东西不要进
表；若某文件的定位有疑问而必须列出，判 不借鉴 并写明它属于哪一类。

## 判定（三档，按顺序问两问）

第一问——决定要不要：这段文本规范了模型的什么行为？必须能答成一句话，落在这些类别里：沟通与交付、
验证与证据、完成与阻塞声明、任务范围、自主性与提问、安全与不可信内容、不可逆操作与外部影响、输出
格式、协作与委派、上下文与压缩。答不出具体行为 → 不借鉴。

第二问——决定怎么要：它有没有点名某个工具的专有名词？
- 没点名 → 借鉴
- 点名了 → 剥离后借鉴：规则本体仍然有效，只是名字属于那个工具。理由里必须写出剥离后的那句话
  ——后续写 preset 直接使用这句。

两种推理被明确禁止：
- ✗「它与本工具无关 → 借鉴」。与工具无关不是借鉴的理由；不是行为约束的文本，无论多通用都判不借鉴。
- ✗「它点名了工具 → 不借鉴」。点名只影响怎么要，不影响要不要。

## 输出文件结构

markdown

标题：<仓库名>——harness 提示词层文件清单

随后列表：仓库 url / commit sha 与日期 / 本地路径 / 枚举方法 / 统计（候选文件 N 个，条目 M 条，
其中 借鉴 X / 剥离后借鉴 Y / 不借鉴 Z）。

枚举方法必须逐条列出你实际执行的 grep 与目录遍历模式，并说明为什么它们覆盖全部候选、哪些部分未
覆盖——把「没搜」与「搜了没有」区分开写。

表格表头固定为：| 文件 | 行号 | 内容 | 判定 | 理由 |

1. 按文件路径排序，同一文件的条目连续排列。每个候选文件都要出现，包括全部条目都判 不借鉴 的文件。
2. 行号必须是引用文本所在行；跨行引用写区间。定稿前自检一遍：引文是否真的出现在标注的行上。
3. 内容列是模型可见文本的逐字摘录，可截断并用省略号标记；只能概括时在开头加 [概括]；源文件用
   字符串拼接时给出拼接后的完整句子并标注 [拼接]。禁止不加标注地改写。
4. 理由列按判定写：
   - 借鉴 → 它约束的具体行为是什么（一句话）。
   - 剥离后借鉴 → 点名了哪个专有名词，以及剥离后的那句话。
   - 不借鉴 → 它属于哪个非候选类别（第三方文档 / 工程规范 / 功能实现契约 / 夹具 / UI 文案 /
     传输框架 / 参数解释 …）。

「剥离后借鉴」的行，理由里的剥离句一律用**英文原文**，只把该工具的专有名词替换为 `{{…}}`；
其余逐字不改；整段删去的部分在句末注明「删去」。同一段文本在多行出现时，只在首次出现处给出剥离句，
其余行指向它。

表格之后两节：
- ## 判定自检：列出你判断中最可能被推翻的条目（尤其「同一条事实可以从两个方向判」的），两边理由
  都写，并给出你的最终选择。
- ## 未覆盖：你没读完或没搜到的部分，写明原因；只做了抽样的大文件标注 [抽样] 与抽样比例。

## 硬约束

- 不得修改被调研的仓库。
- 本次只允许写下面指定的那一个输出文件；不要创建 preset，不要修改本仓其它文件。
- 单行 `不借鉴` 的理由压到一句话（不许因为「我懒得搜」而漏文件）。
- 先写文件骨架与全部候选文件的闭集行，再逐块补 `借鉴` / `剥离后借鉴` 的逐字引文；每完成一块就写入
  文件。不要回头通读自己写过的内容，也不要重跑已完成区块的 grep。
- 最终回复只写三行：输出路径、三档统计、你自认最可能被推翻的三处判定。不要把清单贴进回复。

---

## 目标仓库：kimi-code

- 仓库 url：https://github.com/MoonshotAI/kimi-code
- 本地完整克隆：`C:/Users/joker/AppData/Local/Temp/kimi-code`
  （depth-1，commit `0f052fee1399f34086bb6343a56867d7df9b70b5`，author date 2026-10-08 10:55:34 +0700，
   4437 个文件 / 103 MB）
- 输出路径：`D:/project/pi-extension/model-system-prompt/.scratch/presets-kimi/research/kimi-code.md`
- 目标模型：`kimi-k3`（未来 preset 文件名为 `presets/kimi-k3.md`，只看行为规则，与 id 本身无关）
- 已知情况（起点，不是穷尽清单，枚举仍需你自己跑）：
  1. **主系统提示词是仓库内的 markdown**：`packages/agent-core-v2/src/app/agentProfileCatalog/system.md`
     （82 行；含 `${product_name}` `${role_additional}` `${reply_style_guide}` `${agents_md}`
     `${skills_section}` 等占位符）。同目录还有 `profile-shared.ts`、`promptPrefix.ts`、
     `agentProfileCatalog.ts`、`builtinAgentProfileLoader*.ts` —— 拼接这些文本的地方。
  2. **提示词碎片以 .md 形式与实现同目录**：`packages/agent-core-v2/src` 下共 85 个 `.md`
     （`find packages/agent-core-v2/src -name "*.md"` 可验证）。分布：
     `agent/tools/**`（bash / glob / grep / read / write / edit / agent / ask-user / fetch-url /
     web-search / read-media / task-* / select-tools）、`features/**`（plan / goal / todo / swarm /
     tower / cron / skill / notify / sessionInit / reminder / btw）、`human/**`（compaction /
     todo / media / wait-for）、`agent/fullCompaction/`、`agent/contextMemory/`、
     `agent/permissionMode/injection/`、`session/agentLifecycle/profile/explore-overlay.md`。
  3. **TS 里拼接的指令文本**（不是 .md，但要进表）：至少包括
     `app/agentProfileCatalog/profile-shared.ts`（子代理身份、Windows 说明、终端 markdown 说明）、
     `features/plan/profile/plan.ts`、`features/btw/btw.ts`、`features/goal/goalService.ts` 与
     `features/goal/tools/outcome-prompts.ts`、`features/todo/todoListReminder.ts`、
     `features/tower/tools/spawn/spawnTool.ts`（tower worker 身份）、
     `agent/tools/agent/agentTool.ts`、`agent/tools/os/bash/bashTool.ts`、
     `agent/tools/task/task-wait/taskWaitTool.ts`、`agent/toolExecutor/toolExecutorService.ts`、
     `agent/contextProjector/projection.ts`、`agent/contextMemory/loopEventFold.ts`、
     `agent/replayBuilder/fold.ts`、`agent/mcp/output.ts`、`features/plan/exitPlanModeReview.ts`、
     `features/externalHooks/internal/userPrompt.ts`、`session/sessionTitle/agentTitlePromptSource*.ts`。
     用 `grep -rn "You are\|You must\|Do not \|NEVER\|Always " --include="*.ts" packages/agent-core-v2/src`
     之类的模式把这一类搜全（本次实测命中 21 个文件，其中含无关命中，逐条判定）。
  4. **第一方插件**：`plugins/official/kimi-datasource/SKILL.md`、
     `plugins/official/kimi-webbridge/skills/kimi-webbridge/{SKILL.md,references/operations.md}`。
     是能力手册还是行为约束，逐条判。
  5. **本仓库工程规范**：`.agents/skills/**`（10 个 .md）、仓库根与各包的 `AGENTS.md` / `CLAUDE.md`
     —— 预期整体 不借鉴，但每个文件都要在表里出现一行。
  6. **可能不需要进表的目录**：`docs/**`（产品文档，非模型可见）、`apps/vscode`、`apps/vis`、
     `apps/kimi-inspect`（UI / 可视化）、`packages/pi-tui`、`packages/kosong`（LLM 客户端；
     `src/providers/kimi.ts:493` 附近只是把 systemPrompt 发出去，不含规则文本）、
     `packages/migration-legacy`（旧版 kimi-cli 配置迁移的交互决策，不是提示词）、
     `packages/node-sdk`（SDK 与示例）、测试与夹具（`test/`、`__fixtures__`）。若你打开后确认
     零候选，用一句话写清「搜了没有」即可，不必逐个进表。
  7. 该仓库同时也被别的产品当成「harness」参考（`packages/node-sdk` 里 `createKimiHarness`），
     注意区分：SDK 的公共 API 文本不算提示词层，`packages/node-sdk/examples/**` 里的示例提示词
     若确实是发给模型的指令文本则算候选。

## 交付顺序（本轮只到清单为止）

本轮交付物是上面那一个清单文件；preset 文本等你交回、用户复核后再写。
