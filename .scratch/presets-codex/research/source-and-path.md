# 调研 01 · Codex harness 提示词：获取路径、可获取性、分档结构

本轮只取证「怎么拿到、拿到的是哪一份、分档怎么切」，不做逐条借鉴判定。

---

## 1. Pin

### 源仓库（主证据）

| 项 | 值 |
| --- | --- |
| url | `https://github.com/openai/codex`（Apache-2.0） |
| tag | `rust-v0.161.0` |
| tag object sha | `7e21416b38834816c224ea0dfd135c3de94b2f15` |
| **commit sha（peeled）** | `979011409de0a60b52f179721948e65531d26144` |
| commit 日期 | `2026-10-06T15:34:37-07:00`（tagger `2026-10-06T15:34:38-0700`，subject `Release 0.161.0`） |
| 本机 clone 路径 | `C:/Users/joker/AppData/Local/Temp/codex-src/`（`--depth 1 --branch rust-v0.161.0`） |
| 取用文件 | `codex-rs/models-manager/models.json`，472,512 B，`sha256 = fd219bd9f061278275f528939f82f54d2eb97df4b25c23b022adbe48813d920b` |

brief 给的 `HEAD = 9b738582…` 本轮**未用**（浮动的 main，与发布版不对应）。

### npm 产物（交叉证据）

| 项 | 值 |
| --- | --- |
| 主包 | `@openai/codex@0.161.0`（发布于 `2026-10-07T16:04:02.844Z`） |
| integrity | `sha512-+ZnJFGBbQBwYnjUTs+PoacgYVxmNyxMLiadIz6eSJ0AzQW0mRVxuuOQizSbz2qeNAJia9Syxag6j2uGf7guD2Q==` |
| shasum | `4bc843cf5946904d75032d56d310340220fb6385`（本机复算一致） |
| 主包体积 | 4,902 B，3 个文件（`bin/codex.js` / `package.json` / `README.md`）——**只是 launcher，不含任何提示词** |
| 平台包（真实载荷） | `@openai/codex@0.161.0-win32-x64`（主包 `optionalDependencies` 里以 `npm:@openai/codex@0.161.0-win32-x64` 别名引用） |
| 平台包 tgz | 164,464,244 B，`sha512-VdNnttGOG3nbwoREvVurVBXci/EJD/kncVJnvtXjpEE+YhC1twvvrVNmtlZcZGEEVi06xLN/ov0d6nxjZ1XLSg==` |
| 解包路径 | `C:/Users/joker/AppData/Local/Temp/codex-npm/x/`（主包）、`C:/Users/joker/AppData/Local/Temp/codex-npm/w/`（平台包） |
| 关键文件 | `w/package/vendor/x86_64-pc-windows-msvc/bin/codex.exe`，**332,179,248 B** |

alpha（`0.162.0-alpha.20`，`7b4d251a7323044a8284e5158f5840af18b3306c`，发布于 `2026-10-08T02:48:42.791Z`）本轮**未取**：stable 已拿到全部目标 slug 的文本，alpha 无对照必要。

### 本机二进制（探针）

| 项 | 值 |
| --- | --- |
| 路径 | `C:/Users/joker/.codex/.sandbox-bin/codex.exe`，**313,790,256 B** |
| 版本 | `codex-cli 0.151.0-alpha.7.2`（brief 提供） |
| 用途 | 只用来验证「明文可搜 / 可定位」。它含 `gpt-5.6-sol/terra/luna`（首行同为 `You are Codex, an agent based on GPT-5.`），**完全没有 GPT-6 系列**，因此不能用来证明 6.x 的内容。 |

### 逐 slug 抽出的纯文本（本轮生成，便于逐行引用）

`C:/Users/joker/AppData/Local/Temp/codex-prompts/<slug>.instructions.md`（从 `models.json` 的 `model_messages.instructions_template` 原样 dump，未改动）

| slug | 字符数 | sha256 |
| --- | --- | --- |
| `gpt-5.6-luna` / `-sol` / `-terra` | 17730 | `a91357a1cd2727a0be06d461248d6e3a7274746e38108f548a3adf2cc2430415` |
| `gpt-6-luna` | 18037 | `b707476816bfe5e571a1bd2179f130fff2b132da5ab8e61063acdb7fd24daf12` |
| `gpt-6-sol` | 18992 | `b1dd8718c037906c53a305c5cbccb4a4be35ccbb7837461ec349bfc495412f0d` |
| `gpt-6-astra` | 21420 | `35bd51b5f577cb7b24cd5f4629e49e37cb724ab57754ce6f8f202001635bab8a` |
| `gpt-6.1-sol` | 21769 | `e1bdd4f8f0df4b20f4a0ffc8a861ce819df45325d8cecdfb92e80379cf8d142e` |

---

## 2. 枚举方法

实际执行的命令（全部在 `C:/Users/joker/AppData/Local/Temp/` 下，只读被调研对象）：

| # | 命令 | 覆盖了什么 |
| --- | --- | --- |
| 1 | `git ls-remote --tags --refs https://github.com/openai/codex` | 全部 tag；筛出 `rust-v0.161.0` |
| 2 | `git ls-remote https://github.com/openai/codex refs/tags/rust-v0.161.0 refs/tags/rust-v0.161.0^{}` | 区分 tag object 与 peeled commit |
| 3 | `git clone --depth 1 --branch rust-v0.161.0 … codex-src` | 浅克隆到基线 tag |
| 4 | `git for-each-ref refs/tags/rust-v0.161.0 --format=…` | tag 签名类型、tagger 日期、peeled commit |
| 5 | `npm view @openai/codex --json` / `npm view @openai/codex@0.161.0 version dist.integrity dist.shasum dist.tarball time` | dist-tags、integrity、发布时间 |
| 6 | `npm pack @openai/codex@0.161.0`、`npm pack @openai/codex@0.161.0-win32-x64` | 两个官方 tarball |
| 7 | `tar tzvf …`、`sha512/sha1` 复算 | 包内清单 + 完整性复算 |
| 8 | `find codex-rs -type f \( -name '*.md' -o -name '*.txt' \) | grep -iE "prompt\|instruction\|template\|agent\|persona"` | 提示词形状的文件名初筛（60 条命中） |
| 9 | `grep -rn "base_instructions" --include=*.rs codex-rs` | 43 处引用，定位选择点 |
| 10 | `grep -rn "instructions_template" --include=*.rs codex-rs` | 27 处引用，定位主提示词取用链 |
| 11 | `grep -rn "include_str!" --include=*.rs codex-rs`（排除 tests） | 全部编译期内嵌文本资产 |
| 12 | `grep -rn "models.json" --include=*.rs codex-rs` | 确认 catalog 由 `include_str!` 打进二进制 |
| 13 | `grep -rn "fn get_prompt_base_instructions\|fn get_base_instructions" codex-rs/core/src`、`sed -n` 读 `core/src/session/mod.rs` / `session/world_state.rs` / `context/world_state/*.rs` | 会话期附加层的拼装顺序与开关 |
| 14 | `node -e` 解析 `models.json`，dump 11 个 slug 的模板、sha256、重复关系 | 分档结构的直接证据 |
| 15 | `grep -aboF '<字面>' codex.exe`（11 次） | 明文可搜性 + 偏移 |
| 16 | `node -e` 在二进制里扫 `"instructions_template": "` 与 `"slug": "`，回溯归属条目 | 偏移 ↔ slug 的映射 |
| 17 | `node -e` 把二进制里的 JSON 字符串按 UTF-8 解出并与源码逐字比对 | 发布产物一致性（11/11 全等） |
| 18 | `curl -sL https://developers.openai.com/codex/config-reference`（1,415,892 B）、`…/codex/prompting`（532,579 B）、`…/codex/` | 官方文档交叉 |

**搜了但没命中**：

- `grep -rn "gpt-5.3-codex-spark" codex-rs/models-manager/models.json` —— 11 个 slug 里**没有** `gpt-5.3-codex-spark`。它不在 0.161.0 的 bundled catalog 中，因此**无法从这条路径取证**。
- `base_instructions` / `instructions_template` / `model_catalog_json` 在 `developers.openai.com/codex/config-reference` 页面上：前两个 **0 命中**，`model_catalog_json` 有但只在「托管配置兼容性表」里出现，与提示词分档无关。
- `codex-rs/config.md`、`codex-rs/core/config.schema.json` 里的 `base_instructions` —— **0 命中**（该字段不是用户可写的 config key，只有 `model_instructions_file` 是）。

**没搜**（本轮范围外或来不及）：

- `codex-rs/core/src/tools/` 下每个 handler 的 `parameters` JSON Schema 全量列举。
- `ext/`（goal / memories / image-generation / web-search）里每个插件的提示词正文。
- `guardian` / `realtime` / `review` 三条支线的完整选择逻辑。
- macOS / Linux 平台包（只取了 win32-x64）。

---

## 3. 提示词在源里的位置

### 3.1 主提示词：一个 catalog 字段，一整块字面量，不拼接、不填占位符

| 位置（文件:行号） | 内容（逐字，可截断） | 这是什么 | 进不进主提示词 |
| --- | --- | --- | --- |
| `codex-rs/models-manager/models.json:771` | `"instructions_template": "You are Codex, an agent based on GPT-5. You and the user share one workspace, and your job is to collaborate with them until their goal is genuinely handled.\n\n# Personality\n\nAs Codex, you are an excellent communicator …` | **`gpt-5.6-sol`** 的主提示词全文（17730 字符，整段在一个 JSON 行里） | 进（`instructions`） |
| `codex-rs/models-manager/models.json:913` | 同上（同 sha256） | **`gpt-5.6-terra`** 的主提示词 | 进 |
| `codex-rs/models-manager/models.json:1051` | 同上（同 sha256） | **`gpt-5.6-luna`** 的主提示词 | 进 |
| `codex-rs/models-manager/models.json:76` | `"instructions_template": "You are Codex, an agent based on GPT-6. …` | **`gpt-6-astra`**（21420） | 进 |
| `codex-rs/models-manager/models.json:251` | `"instructions_template": "You are Codex, an agent based on GPT-6. …` | **`gpt-6.1-sol`**（21769） | 进 |
| `codex-rs/models-manager/models.json:426` | 同上开头 | **`gpt-6-sol`**（18992） | 进 |
| `codex-rs/models-manager/models.json:594` | 同上开头 | **`gpt-6-luna`**（18037） | 进 |
| `codex-rs/models-manager/models.json:1417` | `"instructions_template": "You are Codex, a coding agent based on GPT-5. …` | **`gpt-5.5`**（21459）——首行与 5.6 / 6.x **都不同** | 进 |
| `codex-rs/models-manager/models.json:1543` | 与 5.6 三兄弟同 sha256 | **`codex-auto-review`**——与 5.6 **逐字节相同** | 进 |
| `codex-rs/models-manager/models.json:1189` / `:1306` | `"You are Codex, an agent based on GPT-5. …` | `gpt-daybreak-blue-latest` / `-red-latest`（cyber 档，17298 / 17297） | 进 |

选择与渲染链：

| 位置 | 作用 |
| --- | --- |
| `codex-rs/models-manager/src/lib.rs:14-16` | `bundled_models_response() = serde_json::from_str(include_str!("../models.json"))` —— 目录被打进二进制 |
| `codex-rs/prompts/src/model_instructions.rs:8-17` | `render_model_instructions(model_info)` → 直接取 `instructions_template`，缺模板则 `tracing::warn!` 并返回空串 |
| `codex-rs/prompts/src/model_messages.rs:86-89` | `instructions_template()`：只有 `model_messages.instructions_template` 一个来源，没有 family / 版本区间 / 配置分支 |
| `codex-rs/core/src/session/mod.rs:749-757` | 优先级：`config.base_instructions` → 会话历史 `session_meta.base_instructions` → `render_model_instructions(&model_info)` |
| `codex-rs/core/src/client.rs:928-942` | `prompt.base_instructions.text` 逐字塞进请求 |
| `codex-rs/codex-api/src/common.rs:287`、`:312` | 序列化字段名就是 Responses API 的 `instructions: String` |

**结论（问题 1）**：主提示词**是一整个常量**，不是分片拼接；无 `${...}` 占位符（11 个模板 `${` 命中数均为 0）。唯一形似占位符的 `{{connector_id}}` 出现在 6.1/6-sol/6-luna/astra 的 Apps 段（`…](app://{{connector_id}))`），是文档里给用户看的字面文本，不是模板变量。分档只发生在**「哪个 slug 拿到哪块字面量」这一层**。

### 3.2 bundled 兜底（**不是** 5.6+ 实际用的那份）

| 位置 | 内容 | 进不进主提示词 |
| --- | --- | --- |
| `codex-rs/models-manager/prompt.md:1` | `You are a coding agent running in the Codex CLI, a terminal-based coding assistant. Codex CLI is an open source project led by OpenAI. …`（275 行） | 仅当 slug **未知**时兜底 |
| `codex-rs/protocol/src/prompts/base_instructions/default.md:1` | 与上面**逐字节相同**（`sha256 ac8ae107…`，diff 为空） | `BaseInstructions::default()`，即 `Prompt::default()` 时 |
| `codex-rs/models-manager/src/model_info.rs:16` | `pub const BASE_INSTRUCTIONS: &str = include_str!("../prompt.md");` | |
| `codex-rs/models-manager/src/model_info.rs:153-158` | `model_info_from_slug()` 对未知 slug 塞 `local_model_messages()` = `BASE_INSTRUCTIONS`，并标 `used_fallback_model_metadata: true` | |

⚠️ 这两份是 **Codex CLI 旧世代**（"coding agent running in the Codex CLI"）的文本，**不是** gpt-5.6+ 用的。gpt-5.6+ 走 catalog。下一轮不要引用它们。

### 3.3 死文件（0 引用，别引）

以下文件在本 tag 里**没有任何 Rust / bazel / toml / json 引用**（逐个 `grep -rn` 计数为 0），是历史遗留：

`codex-rs/core/gpt_5_codex_prompt.md`、`gpt_5_1_prompt.md`、`gpt_5_2_prompt.md`、`gpt-5.1-codex-max_prompt.md`、`gpt-5.2-codex_prompt.md`、`codex-rs/core/templates/model_instructions/gpt-5.2-codex_instructions_template.md`、`codex-rs/core/templates/personalities/gpt-5.2-codex_{friendly,pragmatic}.md`、`codex-rs/core/templates/agents/orchestrator.md`、`codex-rs/core/templates/collab/experimental_prompt.md`、`codex-rs/core/templates/review/history_message_*.md`、`codex-rs/core/templates/search_tool/tool_description.md`

### 3.4 附加层：位置清单 + 开关（问题 4）

拼装入口：`codex-rs/core/src/session/world_state.rs`（`build_initial_context_with_world_state` 的 world-state 部分）。这些**几乎都不进 `instructions`**，而是以 `developer` / `user` 角色的独立消息进 `input`。

| 层 | 源码位置 | 开关 | 进 `instructions`？ |
| --- | --- | --- | --- |
| 主提示词（切模型时重发） | `codex-rs/core/src/context/world_state/model.rs:53-63` `ModelInstructionsState::render_diff` | 仅当 slug 变化 | 否（只在换模型时作为 `developer` 消息重发） |
| 用户/开发者指令 | `codex-rs/core/src/config/mod.rs:4000-4016`（`base_instructions` / `model_instructions_file` / `developer_instructions`） | `model_instructions_file` 存在即**完全替换**主提示词 | 是（覆盖时） |
| AGENTS.md | `codex-rs/core/src/context/world_state/agents_md.rs` | 有文件 | 否，developer 消息 |
| 权限 / 沙箱 | `codex-rs/prompts/templates/permissions/sandbox_mode/{workspace_write,read_only,danger_full_access}.md`；`.../approval_policy/{never,on_request,unless_trusted,on_request_rule_request_permission}.md`；模板常量在 `codex-rs/prompts/src/model_messages/permissions.rs:16-20`；渲染 `codex-rs/prompts/src/permissions_instructions.rs:26-32`（这里**有真占位符** `Template::parse`，如 `{{ network_access }}`） | `config.include_permissions_instructions`（默认 `true`，`config/mod.rs:4016`）；具体 sandbox/approval 取自运行配置 | 否，developer 消息 |
| 协作模式（Default / Plan） | `codex-rs/collaboration-mode-templates/templates/{default,plan}.md`，`include_str!` 于 `codex-rs/collaboration-mode-templates/src/lib.rs:1-2` | `config.include_collaboration_mode_instructions`（默认 `true`） | 否 |
| 工具说明 | `codex-rs/core/src/tools/handlers/shell_spec.rs:94-104`（`exec_command`，描述字面量）；`.../apply_patch_spec.rs:5`（`apply_patch.lark`）+ `:21`（描述字面量）；命名空间摘要 `codex-rs/core/src/context/world_state/tools.rs` | 随 tool schema 走 `tools` 字段 | 否（走 `tools`，不进 `instructions`） |
| 子代理（multi-agent） | `codex-rs/prompts/src/multi_agent_instructions.rs:9-17`（Rust 常量）+ `codex-rs/core/src/context/world_state/multi_agent_mode.rs` | `MultiAgentVersion::V1/V2/Disabled` | 否，developer 消息 |
| 工具开关相关的 model 字段 | `ModelInfo.include_skills_usage_instructions` / `include_plugin_usage_instructions` / `include_apps_usage_instructions`（`world_state.rs` 尾部） | 逐模型布尔 | 否 |
| Compaction | `codex-rs/prompts/templates/compact/prompt.md:1` `You are performing a CONTEXT CHECKPOINT COMPACTION. …`（`include_str!` 于 `codex-rs/prompts/src/compact.rs:1`） | 触发式 | 否 |
| 记忆 | `codex-rs/ext/memories/templates/memories/*.md`、`codex-rs/memories/write/templates/*` | 特性位 | 否 |
| Guardian | `codex-rs/prompts/templates/guardian/{classifier_instructions,policy,policy_template,node_repl_policy}.md` | auto-review | 否 |
| Realtime / Review / Goal | `codex-rs/prompts/templates/realtime/*.md`、`review/*.xml`、`codex-rs/ext/goal/templates/goals/*.md` | 各自开关 | 否 |
| 上下文窗口提醒 | `codex-rs/prompts/src/model_messages.rs:49-51` `REMINDER_MESSAGE_TEMPLATE`（catalog 可覆盖） | 剩余 token 阈值 | 否 |
| 内容过滤恢复指引 | `codex-rs/prompts/src/model_messages.rs:52` `CONTENT_FILTER_GUIDANCE`（≤512 B 才接受 catalog 覆盖） | 触发式 | 否 |

**唯一会在请求前对主提示词做文本手术的两处**（下一轮做逐条判定时必须知道）：

- `codex-rs/core/src/session/mod.rs:1522-1537` `get_prompt_base_instructions()`：`!config.update_plan_enabled` 且 `provenance == Model` 且未指定 `model_catalog` 时，调用 `codex_prompts::without_update_plan_instructions(&text)` 删掉 update_plan 段。
- `codex-rs/models-manager/src/model_info.rs:49-79` `strip_personality_section()`：`config.personality == None` 时，把 `# Personality` 到下一个 H1 之间的整段**删掉**。

---

## 4. 分档结构

**核心结构问题的答案：Codex 按 slug 逐条精确匹配，一 slug 一块字面量。** 没有 family 规则、没有版本区间、没有「模型家族 × 配置（沙箱 / 审批 / IDE / 非交互）」的组合分档。沙箱 / 审批 / 协作模式这些配置走的是**另一条正交通道**（`model_messages.approvals / permissions / collaboration_modes` + 运行配置），拼成独立的 developer 消息，不参与主提示词的选择。

| slug | 选中的文本 | 选择逻辑（位置） | 与哪些 slug 完全相同 |
| --- | --- | --- | --- |
| `gpt-5.6-luna` | `models.json:1051`，17730 字符，sha `a91357a1…` | `models.json` 按 slug 查表 → `ModelMessages.instructions_template`（`codex-rs/prompts/src/model_messages.rs:86-89`） | `gpt-5.6-sol`、`gpt-5.6-terra`、`codex-auto-review` |
| `gpt-5.6-sol` | `models.json:771`，同上 | 同上 | `gpt-5.6-luna`、`gpt-5.6-terra`、`codex-auto-review` |
| `gpt-5.6-terra` | `models.json:913`，同上 | 同上 | `gpt-5.6-luna`、`gpt-5.6-sol`、`codex-auto-review` |
| `gpt-6-luna` | `models.json:594`，18037 字符，sha `b7074768…` | 同上 | 无（唯一一份） |
| `gpt-6-sol` | `models.json:426`，18992 字符，sha `b1dd8718…` | 同上 | 无 |
| `gpt-6-astra` | `models.json:76`，21420 字符，sha `35bd51b5…` | 同上 | 无 |
| `gpt-6.1-sol` | `models.json:251`，21769 字符，sha `e1bdd4f8…` | 同上 | 无 |

七个 slug ⇒ **5 份互不相同的文本**（5.6 三档是 1 份，6.x 四档各 1 份）。

### 5.6 的 luna / sol / terra 与 6.x 各 slug 的关系

三件事，都能逐字核对：

1. **5.6 三档之间零差异。** 三者的 `instructions_template` 是**同一个字符串对象**（sha256 全等）。分档差异只存在于 catalog 的**元数据**（`default_reasoning_level`、`supported_reasoning_levels`、`priority`、`context_window`、`service_tiers` 等），不在提示词里。下游 preset 若要一档一文件，5.6 只需要 **1 个文件**。
2. **5.6 与 6.x 的文本是「改写」关系，不是「增补」关系。** 5.6 的 H1/H2 骨架是：`# Personality` / `## Writing style` / `## Technical communication` / `# Working with the user` / `## Intermediate commentary` / `## Final answer` / `# Rules for getting work done` / `## File editing constraints` / `## Autonomy and persistence` / `# Destructive actions` / `# Using skills`。6.x 把 `## Technical communication`、`## File editing constraints`、`# Destructive actions` **删掉**，把 `# When to ask the user for permission` 提到最前，并新增 `# Apps (Connectors)`、`# Plugins`（5.6 完全没有这两节）。所以不能把 6.x 当成 5.6 的超集。
3. **5.6 与 `gpt-5.5` 也不是同一份。** `gpt-5.5` 首行是 `You are Codex, a coding agent based on GPT-5.`（带 `a coding agent`），长度 21459，与 5.6 的 `You are Codex, an agent based on GPT-5.`（无 `a coding agent`）不同，sha `2351631d…` 也不同。

对照：`gpt-5.3-codex-spark` **不在 0.161.0 的 bundled catalog 里**（11 个 slug 无它），所以「5.3-spark 与 5.6 是否同一份」在 0.161.0 这条路径上**无法回答**；本机 `0.151.0-alpha.7.2` 的目录里也只有 5.2 / 5.4 / 5.4-mini / 5.5 / 5.6×3 / daybreak×2 / codex-auto-review，没有 spark。

### 一处必须记的分档警告

`instructions_template` 里带一个 `# Personality` 段。运行时如果 `personality = none`，`codex-rs/models-manager/src/model_info.rs:56` 会把整段**删掉**再发。也就是说同一 slug 在 `personality=none` 下实际发出的文本比 17730 字符短。下一轮引用 5.6 文本时，要么注明「默认 personality 下」，要么把 `# Personality` 段单独拆出来处理。

---

## 5. 二进制一致性

### 5.1 明文可搜性

**是明文，不需要解压 / 解码。** `models.json` 以 pretty-printed JSON 原样进二进制，模板里的 `\n` 存成 JSON 转义 `\\n`，非 ASCII 字符（`’`、`“`）存成**原始 UTF-8**（不是 `\uXXXX`）。因此：

- 单行 ASCII 字面量可直接 `grep -aboF` 命中；
- 跨行片段**不能**用 `grep -aboF` 命中（换行在二进制里是 `\` `n` 两个字节）。

### 5.2 短语 → 源码 → 偏移

目标：`C:/Users/joker/AppData/Local/Temp/codex-npm/w/package/vendor/x86_64-pc-windows-msvc/bin/codex.exe`（332,179,248 B）

| 短语 | 源码位置（`codex-prompts/<slug>.instructions.md`） | 二进制偏移 | 命中数 |
| --- | --- | --- | --- |
| `You are Codex, an agent based on GPT-5. You and the user share one workspace` | `gpt-5.6-luna.instructions.md:1` | **263693653** | 6 |
| `you reach first for \`rg\` or \`rg --files\`` | `gpt-5.6-luna.instructions.md:78` | 263700910 | ≥10 |
| `Use \`apply_patch\` for local file edits.` | `gpt-5.6-luna.instructions.md:87` | 263701985 | 6 |
| `You are Codex, an agent based on GPT-6. You and the user share one workspace` | `gpt-6-*.instructions.md:1` | **263578712** | 4 |

**拷贝数 = 模板所属 slug 数。** 6 份「GPT-5 agent」= `gpt-5.6-sol` + `gpt-5.6-terra` + `gpt-5.6-luna` + `codex-auto-review` + `gpt-daybreak-blue-latest` + `gpt-daybreak-red-latest`（`gpt-5.5` 首行多一个 `coding`，不计入）。4 份「GPT-6 agent」= `gpt-6-astra` + `gpt-6.1-sol` + `gpt-6-sol` + `gpt-6-luna`。

### 5.3 本轮引用的是哪一份

用 `node` 在二进制里扫 `"instructions_template": "`（共 **11** 处，与 catalog 的 11 个 slug 一一对应），再向前回溯最近的 `"slug": "` 判定归属：

| 模板起点偏移 | 归属 slug | 与源码逐字相同？ |
| --- | --- | --- |
| 263381278 | `gpt-6-astra` | ✅ |
| 263447914 | `gpt-6.1-sol` | ✅ |
| 263514822 | `gpt-6-sol` | ✅ |
| 263578712 | `gpt-6-luna` | ✅ |
| **263642094** | **`gpt-5.6-sol`** | ✅ |
| **263667948** | **`gpt-5.6-terra`** | ✅ |
| **263693653** | **`gpt-5.6-luna`**（上表引用这一份） | ✅ |
| 263740565 | `gpt-daybreak-blue-latest` | ✅ |
| 263765133 | `gpt-daybreak-red-latest` | ✅ |
| 263786196 | `gpt-5.5` | ✅ |
| 263811707 | `codex-auto-review` | ✅ |

「逐字相同」= 把二进制里那段 JSON 字符串按 UTF-8 解码后，与 `models.json` 的 `instructions_template` 做 `===` 比较，**11/11 全等**。即：**0.161.0 发布产物里的提示词与 tag `rust-v0.161.0` 源码里的完全一致**，目录没有被发布流程替换过。

复现：

```sh
BIN=/c/Users/joker/AppData/Local/Temp/codex-npm/w/package/vendor/x86_64-pc-windows-msvc/bin/codex.exe
grep -aboF 'You are Codex, an agent based on GPT-5. You and the user share one workspace' "$BIN"
node -e "process.stdout.write(require('fs').readFileSync('$BIN').subarray(263693653,263693653+120).toString('utf8'))"
```

### 5.4 本机探针二进制

`C:/Users/joker/.codex/.sandbox-bin/codex.exe`（`0.151.0-alpha.7.2`）里 `"instructions_template": "` 共 **10** 处：`gpt-5.6-sol`@248436081、`gpt-5.6-terra`@248479339、`gpt-5.6-luna`@248522285、`gpt-daybreak-blue-latest`@248565410、`gpt-daybreak-red-latest`@248607494、`gpt-5.5`@248645669、`gpt-5.4`@248692566、`gpt-5.4-mini`@248726669、`gpt-5.2`@248756896、`codex-auto-review`@248804350。**无 GPT-6 系列**。它证明「明文可搜」成立，但内容比 stable 旧，不能用来引 6.x。

---

## 6. 官方文档交叉

- `https://developers.openai.com/codex/config-reference`（1,415,892 B，2026-10-08 取）：有 `model_instructions_file`，type `string (path)`，描述原文 **“Replacement for built-in instructions instead of `AGENTS.md`.”**——官方承认「内置指令」可被单个文件整体替换，与源码 `codex-rs/core/src/config/mod.rs:4003-4013` 一致。`model_catalog_json` 也在这页出现，但只在「托管配置兼容性表」的 `sqlite_home, log_dir, model_catalog_json` 一行里，**没有**任何提示词分档描述。
- 同页 `base_instructions`、`instructions_template` 均为 **0 命中**。
- `https://developers.openai.com/codex/prompting`（532,579 B）：`base_instructions` / `instructions_template` / `model_catalog_json` 全部 **0 命中**。
- 仓库内 `codex-rs/config.md` 与 `codex-rs/core/config.schema.json`：**均无** `base_instructions`（该字段不是用户可写的 config key）。
- 另：配置页有 `personality`，type `none | friendly | pragmatic`，描述 “Default communication style for models that advertise `supportsPersonality`”——与 `strip_personality_section()` 的存在互相印证。

**记一条**：官方文档只提供「整体替换」与「personality 风格」两个开关，**没有**描述模型分档。

---

## 7. 下一轮要 pin 的清单

```
仓库 url      https://github.com/openai/codex
tag           rust-v0.161.0
tag object    7e21416b38834816c224ea0dfd135c3de94b2f15
commit sha    979011409de0a60b52f179721948e65531d26144
commit date   2026-10-06T15:34:37-07:00
clone         git clone --depth 1 --branch rust-v0.161.0 https://github.com/openai/codex codex-src

npm 主包      @openai/codex@0.161.0
integrity     sha512-+ZnJFGBbQBwYnjUTs+PoacgYVxmNyxMLiadIz6eSJ0AzQW0mRVxuuOQizSbz2qeNAJia9Syxag6j2uGf7guD2Q==
npm 平台包    @openai/codex@0.161.0-win32-x64
integrity     sha512-VdNnttGOG3nbwoREvVurVBXci/EJD/kncVJnvtXjpEE+YhC1twvvrVNmtlZcZGEEVi06xLN/ov0d6nxjZ1XLSg==
解包          codex-npm/w/package/vendor/x86_64-pc-windows-msvc/bin/codex.exe  (332179248 B)

models.json   codex-rs/models-manager/models.json
sha256        fd219bd9f061278275f528939f82f54d2eb97df4b25c23b022adbe48813d920b

逐 slug 文本（5 份，下一轮引用对象）
  5.6      sha256 a91357a1cd2727a0be06d461248d6e3a7274746e38108f548a3adf2cc2430415   17730 字符
  6-luna   sha256 b707476816bfe5e571a1bd2179f130fff2b132da5ab8e61063acdb7fd24daf12   18037 字符
  6-sol    sha256 b1dd8718c037906c53a305c5cbccb4a4be35ccbb7837461ec349bfc495412f0d   18992 字符
  6-astra  sha256 35bd51b5f577cb7b24cd5f4629e49e37cb724ab57754ce6f8f202001635bab8a   21420 字符
  6.1-sol  sha256 e1bdd4f8f0df4b20f4a0ffc8a861ce819df45325d8cecdfb92e80379cf8d142e   21769 字符
```

「源码行 → 二进制偏移」可复现命令：

```sh
BIN=/c/Users/joker/AppData/Local/Temp/codex-npm/w/package/vendor/x86_64-pc-windows-msvc/bin/codex.exe
# 1) 找模板起点（返回 11 个偏移）
node -e "const b=require('fs').readFileSync(process.argv[1]);const n=Buffer.from('\"instructions_template\": \"');let p=0;while((p=b.indexOf(n,p))>=0){console.log(p+n.length);p++}" "$BIN"
# 2) 读偏移处的段落
node -e "process.stdout.write(require('fs').readFileSync(process.argv[1]).subarray(+process.argv[2], +process.argv[2]+400).toString('utf8'))" "$BIN" 263693653
# 3) 确认该偏移属于哪个 slug（回溯最近的 "slug": "）
node -e "const b=require('fs').readFileSync(process.argv[1]);const o=+process.argv[2];const pre=b.subarray(Math.max(0,o-3000000),o).toString('latin1');const m=[...pre.matchAll(/\"slug\": \"([^\"]+)\"/g)];console.log(m[m.length-1][1])" "$BIN" 263693653
```

下一轮抽样建议按 sha256 引 5.6 三兄弟里任意一份（本轮引的是 `gpt-5.6-luna` @263693653），不要按文件名推断内容。

---

## 8. 未覆盖

- **`gpt-5.3-codex-spark`**：不在 0.161.0 的 bundled catalog（11 个 slug 无它），stable 与本机 0.151.0 探针都取不到其模板。若下一轮要覆盖它，得走「登录后从运行中的 Codex 抓 `models.json` 缓存」的路子——**本轮没做**（需要凭据，且属官方一手来源但非仓库产物）。
- **线上 catalog 覆盖**：`codex-rs/models-manager/src/cache.rs` / `manager.rs` 里有远程刷新路径（`~/.codex/models.json` 可覆盖，config `model_catalog_json`）。因此**用户实际运行的文本可能被远端 catalog 换掉**。本轮 pin 的是「二进制里自带的那份」，这是可复现的上限；实际会话中发出去的是哪一份，取决于 catalog 来源。本轮没有追这条链。
- **`ext/` 插件提示词**（goal steering、memories write/stage_one、imagegen、web_run）只列了路径，没读内容。
- **guardian v1/v2、realtime、review 三条支线**只列了路径，没读选择逻辑。
- **`codex-rs/core/src/tools/` 每个 handler 的参数 schema** 没逐个列举（只确认了 `exec_command` 与 `apply_patch` 两处的描述位置）。
- **非 win32-x64 平台包**没取（darwin/linux），假定提示词与平台无关（`include_str!` 在编译期，与 target 无关）——**这个假定没有验证**。
- **官方 docs 站**只查了 `config-reference` / `prompting` / 索引三页，没有全站搜索 prompt 分档字样。