# 调研 02：抽取并逐条判定 Codex 0.161.0 发给 gpt-5.6+ 的提示词文本

第一轮的「怎么拿到、分成几份」取证已定稿在 `research-brief.md`，清单在
`research/source-and-path.md`。本轮只做**抽取与逐条判定**：把每一份文本里的候选规则逐行列出，
给出 借鉴 / 剥离后借鉴 / 不借鉴。

派遣参数：一个 workflow、**四个子代理并行**；`agent: scout`、`skill: research`；每个子代理
`timeoutMs: 3600000`、`checkpointBeforeDeadlineMs: 600000`、`output` 绑定到各自的目标路径
（与子代理自己写的路径相同，当作它没写成时的保险）；四者**各写各的文件，不得互写**。
任务文本只做一件事：指向本文件 + 说明自己是哪个 scope。

---

## 已定决策（本轮不执行，但记录在案，写 preset 时照此办）

1. **分档即镜像**（AGENTS.md）：源按 slug 各给一份文本，我们按「一份互不相同的文本 → 一个 preset 文件」，
   不合并。第一轮已确认 7 个 slug 只有 **5 份互不相同的文本**。
2. **自足 beats factoring**（AGENTS.md）：所有 tier 共有的文本，在**每个** preset 文件里逐字重复。
   不做 include、不做继承、不做引用。
3. **身份句一律不借鉴**（AGENTS.md）：每份文本第 3 行都是 `You are Codex, an agent based on GPT-5/6. …`。
   判定写「不借鉴」，理由写「身份声明，与本扩展的追加语义冲突」。**照抽**，留证据。
4. **点名 pi 没有的工具或机制 → 不借鉴**，理由写「点名了 pi 没有的能力：<名字>」，
   **不得加工成 `{{…}}` 剥离句**（可用性判据见下）。
5. **判据跟着「能不能用」走**：本扩展是追加到 pi 已有的系统提示词之后，选进来但用不了的文本不只是浪费
   token，它会和 pi 自己的工具契约打架。
6. preset 文件名方案（怎么映射到 pi 的 model id 前缀）**不在本轮范围**，等清单回来后由主代理提出。

## 本轮工具名对照表（第一轮已核实的源机制，判「点名」时照此表比对 pi 的能力）

pi 的内置工具只有 8 个：**read / write / edit / bash / grep / find / ls / powershell**。
pi 的 base harness 还内置 **skills**（可用技能列在系统提示词里，技能正文按普通文件读）。

| 源里的名字 | 判定写法 |
| --- | --- |
| `apply_patch`（作「改文件」讲，不含 patch 文法细节） | 剥离后借鉴，剥离句用 `{{edit tool}}` |
| `exec_command` / `shell` / `bash` / 终端命令 | 剥离后借鉴，剥离句用 `{{shell}}` |
| `rg` / `rg --files` / 在仓库里搜索 | 剥离后借鉴，剥离句用 `{{search tool}}` |
| `read_file` / 读文件 | 剥离后借鉴，剥离句用 `{{read tool}}` |
| `write_file` | 剥离后借鉴，剥离句用 `{{write tool}}` |
| `view_image` / 看图片 | 剥离后借鉴，剥离句用 `{{read tool}}`（pi 的 read 支持图片） |
| `update_plan` / 任务清单工具 / plan 面板 | **不借鉴**：点名了 pi 没有的能力：`update_plan` |
| `request_user_input` / 向用户提问的工具 | **不借鉴**：点名了 pi 没有的能力 |
| 沙箱 / 审批模式 / approval policy / sandbox_mode / `--full-auto` | **不借鉴**：点名了 pi 没有的机制 |
| 子代理 / multi-agent / `spawn_agent` / `codex-rs/prompts/src/multi_agent_instructions.rs` | **不借鉴**：点名了 pi 没有的机制（base harness 无子代理） |
| Apps / Connectors / `app://` | **不借鉴**：点名了 pi 没有的机制 |
| Plugins（codex 的插件体系） | **不借鉴**：点名了 pi 没有的机制 |
| Codex 的 skill 路径 / `codex skills` 子命令 / skill 装载机制 | **不借鉴**：点名了 pi 没有的机制 |
| 只讲「什么时候该查技能、拿到技能正文后怎么照做」且不点名机制 | **借鉴** |

两种推理被明确禁止：

- ✗「它与本工具无关 → 借鉴」。与工具无关不是借鉴的理由；不是行为约束的文本，无论多通用都判不借鉴。
- ✗「它点名了工具 → 不借鉴」。点名只影响怎么要，不影响要不要——**除了**上表里点名 pi 没有的能力那几行。

## 共同部分（逐字沿用 `../presets-claude-code/research-brief-02.md` 的已审核版本；因源是源码 catalog + 二进制，
仅把「文件:行」的引用方式改为本轮的「位置 / 行号 / 偏移」三栏，其余措辞未改）

你是研究子代理，按 research skill 执行：只依据一手来源（被调研对象自身的产物），每条结论标注
位置与偏移；不引用二手转述。

产出：一个 markdown 文件，列出该 scope 里所有属于 harness 提示词层的文本，每条内容一行，
逐条判定它是不是可用的行为规则。

### 名词（先说清，避免歧义）

- harness：把模型变成 agent 的那层工程——循环、工具契约、权限，以及约束模型行为的提示词文本。
- harness 提示词层：本任务的抽取对象，即模型实际会读到的指令文本。
- Codex：OpenAI 的官方 coding agent（CLI / app）的产品名。本任务一律称其产品名。
- 与工具绑定：文本里点名了与具体工具/机制的独特能力（譬如 Codex 自己的 `apply_patch`、`update_plan`、
  沙箱审批模式、Apps/Connectors、Plugins、multi-agent）。

### 候选定义（什么算一条候选）

算候选：模型会读到的指令性文本——主提示词的 section 与 bullet、注入的 developer 消息（权限 / 沙箱 /
协作模式 / 技能或插件使用说明）、工具说明里承载的行为规则（不是参数解释）、子代理身份契约、
compaction 这类一次性任务提示词。

不算候选：纯代码逻辑、类型定义与生成目录、测试与夹具、i18n 词条、UI 文案、日志与错误字符串（除非
该字符串本身就是给模型的指令）、第三方库 / CLI / 组件的 API 文档与用法手册、仓库自身的工程规范
（编码 / 目录 / 提交 / 文档流程）、README 导航与元数据、传输与包装框架文本、**过时无人引用的模板文件**。
不算候选的东西不要进表；若某文件的定位有疑问而必须列出，判 不借鉴 并写明它属于哪一类。

### 判定（三档，按顺序问两问）

第一问——决定要不要：这段文本规范了模型的什么行为？必须能答成一句话，落在这些类别里：沟通与交付、
验证与证据、完成与阻塞声明、任务范围、自主性与提问、安全与不可信内容、不可逆操作与外部影响、输出
格式、协作与委派、上下文与压缩。答不出具体行为 → 不借鉴。

第二问——决定怎么要：它有没有点名某个工具的专有名词？按上面的「工具名对照表」。
- 没点名，或点的是 pi 也有的同类能力 → 借鉴 / 剥离后借鉴
- 点了 pi 没有的能力 → 不借鉴，理由写「点名了 pi 没有的能力：<名字>」

## 本轮特有的源与读取方法（先读这节）

**三个 pin（第一轮定稿，写进每个输出文件的头部）：**

- 源仓库：`https://github.com/openai/codex`，tag `rust-v0.161.0`，
  commit `979011409de0a60b52f179721948e65531d26144`（2026-10-06T15:34:37-07:00）。
- catalog：`C:/Users/joker/AppData/Local/Temp/codex-src/codex-rs/models-manager/models.json`，
  `sha256 = fd219bd9f061278275f528939f82f54d2eb97df4b25c23b022adbe48813d920b`。
- 发布产物（交叉核对，不是取证起点）：
  `C:/Users/joker/AppData/Local/Temp/codex-npm/w/package/vendor/x86_64-pc-windows-msvc/bin/codex.exe`
  （332,179,248 B）＝ `@openai/codex@0.161.0-win32-x64`。第一轮已验证 11/11 模板与源码逐字相同。

**逐 slug 的纯文本 dump（本轮的直接引用对象，第一轮生成）：**
`C:/Users/joker/AppData/Local/Temp/codex-prompts/<slug>.instructions.md`。

- 引用约定：`位置` 列写 `codex-prompts/<slug>.instructions.md:<行号>`；`行号` 列写同一行号对应的
  **二进制字节偏移**（用 `grep -aboF '<单行 ASCII 片段>' codex.exe` 能命中的就用命中偏移；
  跨行或含非 ASCII 的写「模板起点 <offset> + Δ<bytes>」并注明）。定稿前自检一遍：**每条引文都要能
  重新定位到标注的行号与偏移**，定位不到就改。
- 文本里的 `\n` 在二进制里是 `\` `n` 两字节；单行 ASCII 片段可直接 `grep -aboF`，跨行片段不能。
- 模板起点偏移（第一轮给的）：`gpt-6-astra`@263381278、`gpt-6.1-sol`@263447914、`gpt-6-sol`@263514822、
  `gpt-6-luna`@263578712、`gpt-5.6-sol`@263642094、`gpt-5.6-terra`@263667948、`gpt-5.6-luna`@263693653。
- dump 文件的行号 = 模板解码后的行号；`<slug>.instructions.md` 第 1 行就是 `You are Codex…`。
- **若 temp 目录已不在**：按上面的 pin 重新 `git clone --depth 1 --branch rust-v0.161.0` 与
  `npm pack @openai/codex@0.161.0-win32-x64`，并复算 sha256 对齐后再开工；对不上就停手报告。

**两处运行期文本手术（判定时必须在理由里注明，不许当成固定文本引用）：**

- `# Personality` 段：`personality = none` 时会被
  `codex-rs/models-manager/src/model_info.rs:49-79 strip_personality_section()` 整段删除。
  命中该段的行，理由里加一句「personality=none 时此段不发」。
- update_plan 相关段：`config.update_plan_enabled = false` 时由
  `codex-rs/core/src/session/mod.rs:1522-1537 without_update_plan_instructions()` 删掉。
  命中该段的行，理由里加一句「update_plan 关闭时此段不发」。

### 枚举方法必须交代的

- 文本是一整块 JSON 字符串（每个 slug 一行）。**遍历方式是逐行走完整份 dump**，把每个 H1/H2/H3
  section 下的每条 bullet / 段落都过一遍——这是闭集，`## 枚举方法` 里要写清这一点，并给出该 dump 的
  section 骨架（标题 + 行号区间）与字符数。
- 同时列出你**另外搜了但没命中**的锚点（例如 `reject`、`never`、`always` 之类），把「没搜」与「搜了没有」
  分开写。
- 不要引用第一轮列为「死文件」的模板（`gpt_5_codex_prompt.md`、`gpt_5_1_prompt.md`、`prompt.md`、
  `default.md`、`core/templates/**` 这些），也不要引用 bundled 兜底文本：它们不是 gpt-5.6+ 实际用的。

### 输出文件结构

markdown

标题：`<哪几份文本>——harness 提示词层清单`

随后一行：pin（仓库 / tag / commit / models.json sha256 / dump 路径 / 二进制路径与体积）
+ 统计（候选条目 M 条，其中 借鉴 X / 剥离后借鉴 Y / 不借鉴 Z）。

`## 枚举方法`（如上）。

`## 清单`：表格 `| 位置 | 行号 | 内容 | 判定 | 理由 |`，按 dump 行号排序。

1. 每个 section、每条 bullet 都要出现，包括全部条目都判 不借鉴 的 section。
2. 内容列是模型可见文本的逐字摘录，可截断并用省略号标记；只能概括时在开头加 [概括]；
   源文本有拼接或占位符时**`${...}` / `{{...}}` 占位符原样保留、不要自行求值**，并标注 [拼接]。
   禁止不加标注地改写。
3. 理由列按判定写：
   - 借鉴 → 它约束的具体行为是什么（一句话）。
   - 剥离后借鉴 → 点名了哪个专有名词，以及剥离后的那句话。剥离句一律用 **英文原文**，只把该工具的
     专有名词替换为 `{{…}}` 占位符；其余逐字不改；整段删去的部分在句末注明「删去」。
   - 不借鉴 → 它属于哪个非候选类别或哪个 pi 没有的能力。
4. 同一段文本在多处出现时，只在首次出现处给出剥离句，其余行指向它。

`## 判定自检`：列出你判断中最可能被推翻的条目（尤其「同一条事实可以从两个方向判」的），两边理由都写，
并给出你的最终选择。

`## 未覆盖`：你没读完或没搜到的部分，写明原因。

### 硬约束

- 不得修改被调研对象；除下面指定的那一个输出文件外不得写本仓任何文件（temp 转储可选，不算输出文件）。
- **先写文件骨架并落盘**（标题、pin、枚举方法与 section 骨架），再逐块补引文与判定，每完成一块就写入文件。
- **最终回复只写三行**：输出路径、三档统计、你自认最可能被推翻的三处判定。**不要把清单或报告正文贴进回复。**
- 不要回头通读自己写过的内容，也不要重跑已完成区块的 grep。

---

## 四个 scope（各写各的文件，不得互写）

### Scope A：`gpt-5.6` 主提示词（1 份文本）

- 输出：`.scratch/presets-codex/research/instructions-5-6.md`
- dump：`C:/Users/joker/AppData/Local/Temp/codex-prompts/gpt-5.6-luna.instructions.md`（17730 字符，
  sha256 `a91357a1cd2727a0be06d461248d6e3a7274746e38108f548a3adf2cc2430415`）。
- 该文本由 `gpt-5.6-luna` / `gpt-5.6-sol` / `gpt-5.6-terra` 三个 slug 共用（第一轮已核实 sha256 全等），
  本轮按一份处理，**不要**重复三遍。
- section 骨架（第一轮实测，供你核对）：`# Personality`(3) / `## Writing style`(11) /
  `## Technical communication`(17) / `# Working with the user`(23) / `## Intermediate commentary`(33) /
  `## Final answer`(43) / `### Formatting rules`(47) / `### Visualizations`(60) /
  `# Rules for getting work done`(76) / `## File editing constraints`(85) / `## Autonomy and persistence`(93) /
  `# Destructive actions`(114) / `# Using skills`(133) / `### How to use skills`(137)。

### Scope B：`gpt-6-luna` + `gpt-6-sol` 主提示词（2 份文本）

- 输出：`.scratch/presets-codex/research/instructions-6-luna-sol.md`
- dump：`gpt-6-luna.instructions.md`（18037 字符，
  sha256 `b707476816bfe5e571a1bd2179f130fff2b132da5ab8e61063acdb7fd24daf12`）与
  `gpt-6-sol.instructions.md`（18992 字符，
  sha256 `b1dd8718c037906c53a305c5cbccb4a4be35ccbb7837461ec349bfc495412f0d`）。
- 两份文本**各出一张清单**（同一文件里两个 `## 清单` 不许合并条目），表头相同。
  两份的 section 骨架相近但不完全相同，逐份给骨架、逐份判定；**不要把两份做 diff 后只写差异**。
- 额外交付（放在两张清单之后，标题 `## 两份文本的差异`）：按 section/行号给出两份的差异点清单
  （新增 / 删除 / 改写），每条一句话。用于主代理决定 tier 之间 preset 的差异。

### Scope C：`gpt-6-astra` + `gpt-6.1-sol` 主提示词（2 份文本）

- 输出：`.scratch/presets-codex/research/instructions-6-astra-6-1-sol.md`
- dump：`gpt-6-astra.instructions.md`（21420 字符，
  sha256 `35bd51b5f577cb7b24cd5f4629e49e37cb724ab57754ce6f8f202001635bab8a`）与
  `gpt-6.1-sol.instructions.md`（21769 字符，
  sha256 `e1bdd4f8f0df4b20f4a0ffc8a861ce819df45325d8cecdfb92e80379cf8d142e`）。
- 结构、额外交付与 Scope B 相同（两张清单 + `## 两份文本的差异`）。

### Scope D：工具说明 + 附加层提示词

- 输出：`.scratch/presets-codex/research/tools-and-layers.md`
- 范围（**只收不经主提示词 catalog 那一层的文本**；主提示词归 Scope A/B/C，本节不重复收录）：
  1. **工具说明里承载行为规则的部分**（不是参数 schema）：至少覆盖 `exec_command`（shell）与
     `apply_patch`（第一轮给了位置：`codex-rs/core/src/tools/handlers/shell_spec.rs:94-104`、
     `codex-rs/core/src/tools/handlers/apply_patch_spec.rs:5` 与 `:21`）；再把
     `codex-rs/core/src/tools/handlers/` 下的其它 handler 扫一遍，凡是模型会读到的描述文本都列为候选。
     枚举方法要写清你扫了哪几个 handler（数量 + 名字），全部只落 不借鉴 的用一行汇总。
  2. **注入的 developer 消息层**（第一轮给的位置清单，逐个读正文后判定）：
     `codex-rs/prompts/templates/permissions/sandbox_mode/{workspace_write,read_only,danger_full_access}.md` 与
     `.../approval_policy/{never,on_request,unless_trusted,on_request_rule_request_permission}.md`；
     `codex-rs/collaboration-mode-templates/templates/{default,plan}.md`；
     `codex-rs/prompts/src/multi_agent_instructions.rs`；
     skills / plugin / apps usage instructions（第一轮指向 `world_state.rs` 尾部的
     `include_skills_usage_instructions` 等字段，自行定位正文）。
  3. **一次性任务提示词**：compaction（`codex-rs/prompts/templates/compact/prompt.md`）、
     guardian（`codex-rs/prompts/templates/guardian/*.md`，至少 `policy.md` 与 `classifier_instructions`）、
     `codex-rs/ext/goal/templates/goals/*.md`、`codex-rs/ext/memories/templates/**`、
     `codex-rs/prompts/templates/review/*.xml`、`codex-rs/prompts/templates/realtime/*.md`。
     每个类目给「读了 / 没读」与一句话定位；**读了的**逐条判定，**成对的**（如 sandbox 三档）合并成一行
     也要给出差异。
  4. **覆盖率检查表（只用它防漏，不许当证据）**：上面三类目是第一轮实测的位置清单，**不是**「网上流传的
     构成」。你实际找到什么、找不到什么，以你自己的 grep 为准，并在 `## 未覆盖` 里逐类目说明命中/未命中。
- `## 枚举方法` 里要另写一段：你怎么确认没有漏掉 `codex-rs/ext/` 与 `codex-rs/prompts/templates/` 下的
  其它提示词文件（给出 `find`/`grep` 命令与结果计数）。
- 判定口径与 Scope A/B/C 相同；表格列同为 `| 位置 | 行号 | 内容 | 判定 | 理由 |`，`位置` 写
  `codex-src/<相对路径>:<行号>`。

---

## 交付顺序（本轮只到清单为止）

本轮交付物是上面四个清单文件；**preset 文档由主代理据此来写**，不需要子代理考虑 preset 的措辞与格式。

---

## 结果与落点（第二轮后由主代理补记）

清单回来后确认：7 个 slug 只有 5 份互不相同的文本，因此 preset 是 5 个文件，按
「一份文本 → 一个文件」写：

| preset 文件 | 覆盖的 pi model id | 源文本 |
| --- | --- | --- |
| `presets/gpt-5.6.md` | `gpt-5.6-luna` / `-sol` / `-terra`（三档 sha256 全等） | `models.json:1051/771/913`，17,730 字符 |
| `presets/gpt-6-luna.md` | `gpt-6-luna` | `models.json:594`，18,037 字符 |
| `presets/gpt-6-sol.md` | `gpt-6-sol` | `models.json:426`，18,992 字符 |
| `presets/gpt-6-astra.md` | `gpt-6-astra` | `models.json:76`，21,420 字符 |
| `presets/gpt-6.1-sol.md` | `gpt-6.1-sol` | `models.json:251`，21,769 字符 |

命名与「分档即镜像」：gpt-6.1-sol 必须独立一个文件——它的文本与 `gpt-6-sol` 不同，
而且 `gpt-6.1-sol` 不以前缀 `gpt-6-sol` 开头，两个名字互不影响。更晚的世代（gpt-6.2、gpt-7…）
在 codex 里会自带新文本，需要新文件；README 已写明。

写 preset 时的收口（已在产物里核对）：身份句一律未收；`apply_patch` / `update_plan` /
`functions.exec` / `skills.list` / `skills.read` / orchestrator / Apps / Plugins / MCP / 子代理
这些点名 pi 没有的能力的规则一律未收，也未加工成 `{{…}}` 空壳；`$CODEX_HOME` 只保留
`$HOME` 那一半；`Mermaid` 未收；「interactive visuals」降级为图/表；两处运行期手术
（`personality` 段删除、update_plan 段删除）在 5.6 文本上分别是「整段不发」和 `no-op`，
preset 按无条件成立重写。

落盘后验证：`npm test` 30/30 通过；把 `presets/*.md` 复制进临时 HOME 后，用真实 extension
handler 逐个跑 `gpt-5.6-luna` / `-sol` / `-terra` / `gpt-6-luna` / `gpt-6-sol` / `gpt-6-astra` /
`gpt-6.1-sol`，各自命中上表指定的文件；`gpt-5.5` 不命中任何文件；`claude-sonnet-5.5` 与
`glm-5.3-flash` 的解析未受影响。
