# 调研 01：怎么拿到 Codex 的 harness 提示词（gpt-5.6 及以后系列）

答一个问题：**有哪些办法能拿到 Codex（OpenAI 官方 coding agent）真正发给 gpt-5.6 及以后系列模型的
系统提示词文本**，以及这些文本在源头能不能定位、能不能逐条引用。

本轮只做「获取路径 + 可获取性 + 分档结构」的取证，**不做提示词内容的逐条借鉴判定**（那是下一轮）。

派遣参数：一个子代理；`agent: scout`、`skill: research`、async: true；
`timeoutMs: 3600000`、`checkpointBeforeDeadlineMs: 600000`；`output` 绑定到下面的输出文件路径
（与子代理自己写的路径相同，当作它没写成时的保险）。

---

## 目标模型（要覆盖的 id）

来自本机 pi 的 provider 数据
`C:/Users/joker/AppData/Roaming/npm/node_modules/@earendil-works/pi-coding-agent/node_modules/@earendil-works/pi-ai/dist/providers/data/openai-codex.json`，
`gpt-5.6` 及以后的 id 有七个：

| id | 显示名 |
| --- | --- |
| `gpt-5.6-luna` | GPT-5.6 Luna |
| `gpt-5.6-sol` | GPT-5.6 Sol |
| `gpt-5.6-terra` | GPT-5.6 Terra |
| `gpt-6-astra` | GPT-6 Astra |
| `gpt-6-luna` | GPT-6 Luna |
| `gpt-6-sol` | GPT-6 Sol |
| `gpt-6.1-sol` | GPT-6.1 Sol |

（更早的 `gpt-5.3-codex-spark`、`gpt-5.5` 不在本轮范围，但作为对照可以顺手记一句：
它们与 5.6 系列是不是同一份文本。）

本轮要回答的核心结构问题：**Codex 按什么粒度挑提示词文本**——按 slug 逐个、按家族、还是按
「模型家族 × 配置（沙箱 / 审批 / IDE / 非交互）」的组合。这直接决定下一轮抽什么、以及 preset 要几个文件。

## 版本基线

- **源仓库（开放源码，主证据）**：`https://github.com/openai/codex`，Apache-2.0，Rust workspace
  `codex-rs`。2026-10-08 本机 `git ls-remote` 的 `HEAD = 9b738582b13c2cdbeff54af0afd04c50c3e7ba09`。
  **以与发布版对应的 tag / commit 为准**，不要拿浮动的 `HEAD`：请查出并记录 tag 名 + commit sha + 日期。
- **发布产物（shipped bytes，交叉证据）**：npm 包 `@openai/codex`。2026-10-08 本机查到的 dist-tags：
  `latest = 0.161.0`（`dist.integrity = sha512-+ZnJFGBbQBwYnjUTs+PoacgYVxmNyxMLiadIz6eSJ0AzQW0mRVxuuOQizSbz2qeNAJia9Syxag6j2uGf7guD2Q==`、
  `dist.shasum = 4bc843cf5946904d75032d56d310340220fb6385`）、`alpha = 0.162.0-alpha.20`。
  **stable（latest）优先**；alpha 只在 stable 缺东西时作对照，且要写明理由。
- **本机二进制（探针，不是内容来源）**：`C:/Users/joker/.codex/.sandbox-bin/codex.exe`，
  313,790,256 B，`codex-cli 0.151.0-alpha.7.2`（比 stable 旧，只用来验证「明文可搜 / 可定位」）。
  本机另有 Codex 安装目录 `C:/Users/joker/AppData/Local/OpenAI/Codex/`（runtimes / plugins）。

## 你是研究子代理

按 research skill 执行：只依据一手来源（源仓库 checkout / 官方发布产物 / 官方文档），
每条结论标 `文件:行号`（源码）或 `文件@偏移`（二进制），禁止二手转述，
禁止拿别人的博客或「提示词泄露合集」当证据。

## 待验证的问题

1. **源码路径**：clone 到 `C:/Users/joker/AppData/Local/Temp/codex-src/`（浅克隆即可，但必须 checkout
   到基线 commit）。列出仓库里所有承载「发给模型的指令文本」的文件（`.md`、`.rs` 里的 `include_str!`、
   模板字符串），说明：主提示词是一整个常量还是分片拼接？分片在哪些文件？有没有 `${...}` 之类占位符？
   `base_instructions` 这种东西在哪个函数、按什么条件选？（`codex-rs/core/` 下重点找，但不要只看它。）
2. **分档结构**：把所有「模型 → 提示词变体」的选择逻辑找出来（按 slug 精确匹配？按 family？按版本区间？
   配置 flag？）。回答上面「核心结构问题」，逐个 slug 给出它走哪份文本，并指出哪些 slug 走**完全相同**的文本。
   特别注意 5.6 的 luna / sol / terra 三档与 6.x 各 slug 的关系。
3. **发布产物一致性**：`npm pack @openai/codex@0.161.0`（带显式版本号）解包，列包内文件与体积；
   判定提示词是明文可搜（`grep -aboF '<字面>'`）还是要解压 / 解码。从源码取 3–5 条短语做定位对照，
   给出 `文件@偏移`，并说明同一文本在二进制里有几份拷贝、你引的是哪一份。
4. **工具与附加层**：工具说明（`shell` / `apply_patch` / `read_file` 之类）、子代理（如有）、
   compaction / 记忆 / 审批 / 沙箱相关的提示词，在源码里分别在哪、由哪个开关拼进主提示词。
   **不用逐条抄内容**（那是下一轮），只需给位置清单 + 一句话定位 + 是否进主提示词。
5. **可复现清单**：给出下一轮要 pin 的完整凭据——仓库 url + tag + commit sha，npm 包名 + 版本 + integrity，
   解包路径，以及「源码行 → 二进制偏移」的可复现命令。
6. **官方文档交叉**：`developers.openai.com` / codex 官方文档里若描述了 prompt 分档或 `base_instructions`
   配置，记一条即可（有就记，没有就写「没找到」，不要展开）。

## 输出文件

路径：`D:/project/pi-extension/model-system-prompt/.scratch/presets-codex/research/source-and-path.md`

结构：

1. 标题 + 源 pin（url / tag / commit sha / 日期）+ npm pin（包名 / 版本 / integrity）+ 解包路径 + 本机二进制路径与体积。
2. `## 枚举方法`：逐条列出实际执行的命令，说明覆盖了什么、没覆盖什么（「没搜」与「搜了没有」分开写）。
3. `## 提示词在源里的位置` 表格：`| 位置（文件:行号） | 内容（逐字，可截断并标 …） | 这是什么 | 进不进主提示词 |`
   只收能证明「这段是发给模型的指令文本」的条目；同一文件的条目连续排列。
4. `## 分档结构`：表 `| slug | 选中的文本 | 选择逻辑（位置） | 与哪些 slug 完全相同 |`，七个 slug 一行不少。
5. `## 二进制一致性`：短语 → 源码位置 → 二进制偏移，以及拷贝数与引的是哪一份。
6. `## 下一轮要 pin 的清单`。
7. `## 未覆盖`：没读完或没搜到的部分与原因。

## 硬约束

- 不得修改被调研的对象；除上面那一个输出文件外不得写本仓任何文件。
- 临时 clone / 解包只放 `C:/Users/joker/AppData/Local/Temp/`。
- 只用 npm / git 取官方产物，且**一律带显式版本号或 commit**；不要去 clone 第三方「提示词合集」仓库。
- 本机没有 `strings`：定位用 `grep -aboF '<字面>' <binary>`，读段落用
  `node -e "process.stdout.write(require('fs').readFileSync('<binary>').subarray(OFF,OFF+LEN).toString('utf8'))"`。
- 先写骨架（标题、pin、枚举方法）并落盘，再逐块补证据，每完成一块就写入文件。
- 最终回复只写四行：输出路径；五条主要结论各一句；分档结构一句话；你自认最可能被推翻的三处。
