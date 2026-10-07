# 调研提示词（已审核通过，2026-10-07）

派 research 子代理时使用的完整提示词，用户修订版。仅规范了粘贴带来的行首缩进，措辞未改。

派遣参数：一个 workflow、两个子代理并行；`agent: scout`、`skill: research`、
`model: newapi-dev/glm-5.3-flash`、`async: false`；各自 `output` 指向下面的输出路径。

---

## 共同部分（每个仓库都发）

你是研究子代理，按 research skill 执行：只依据一手来源（被调研仓库自己的源码与仓库内文档），
每条结论标注 文件:行；不引用二手转述。

产出：一个 markdown 文件，列出该仓库里所有属于「针对模型harness 提示词层」的文本，每个文件、每条内容
一行，逐条判定它是不是针对特定模型且与具体agent工具无关的提示词。

## 名词（先说清，避免歧义）

- harness：把模型变成 agent 的那层工程——循环、工具契约、权限，以及约束模型行为的提示词文本。
- harness 提示词层：本任务的抽取对象，即模型实际会读到的指令文本。
- deepseek-harness、ZCode：两个工具的产品名。本任务一律称其产品名。
- 与工具绑定：文本里点名了与具体工具的独特能力(譬如Zcode自己写的Tools，deepseek harness里根本没有这个Tool)。

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

表格之后两节：
- ## 判定自检：列出你判断中最可能被推翻的条目（尤其「同一条事实可以从两个方向判」的），两边理由
  都写，并给出你的最终选择。
- ## 未覆盖：你没读完或没搜到的部分，写明原因；只做了抽样的大文件标注 [抽样] 与抽样比例。

## 硬约束

- 不得修改被调研的仓库。
- 本次只允许写下面指定的那一个输出文件；不要创建 preset，不要修改本仓其它文件。
- 最终回复只写三行：输出路径、三档统计、你自认最可能被推翻的三处判定。不要把清单贴进回复。

---

## 目标仓库追加：deepseek-harness 那份

- 仓库 url：https://github.com/deepseek-ai/deepseek-harness
- 本地完整克隆：C:/Users/joker/AppData/Local/Temp/dsh2
  （depth-1，commit 5badb15009ae1756c3afe0ae0cef1faafc290ccc，2026-10-03）
- 输出路径：D:/project/pi-extension/model-system-prompt/.scratch/presets-deepseek-glm/research/dsh-deepseek.md
- 已知情况（是起点，不是穷尽清单，枚举仍需你自己跑）：部署 persona 极短（harness:identity 一行加
  bundle 的 personaPrefix / personaSuffix），行为规则主要挂在各工具的 prompt section 与两个 guard
  上；vendor/ 是 vendored 框架；packages/**/tests 是测试；python/ 内没有提示词常量（出口在
  packages/bundle/sdk-minimal/cordis.patch.yml）。

## 目标仓库追加：ZCode 那份

- 仓库 url：https://github.com/zai-org/ZCode
- 本地克隆：C:/Users/joker/AppData/Local/Temp/zcode
  （depth-1，commit 29628c9acdb81b703bbd4080c207a0e7ce5e276e；sparse-checkout 已含
  apps packages config harness public scripts third-party .agents）
- 输出路径：D:/project/pi-extension/model-system-prompt/.scratch/presets-deepseek-glm/research/zcode-glm.md
- 已知情况（起点，不是穷尽清单）：agent 运行时在 apps/zcode-cli；仓库根没有 docs/ 目录（可用
  git ls-tree HEAD --name-only 验证），docs 只存在于 apps/zcode-cli/packages/browser-use-plugin/docs/；
  .agents/skills/** 里既有规范 agent 工作方式的规则，也有第三方库用法手册，两者必须分开判定。
