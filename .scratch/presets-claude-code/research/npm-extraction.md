# 获取 Claude Code harness 提示词的取证（claude 系列）

> **基线（本轮抽取对象）：stable `2.1.285`。** 附：与 latest `2.1.293` 的差异见文末。

## 0. 包 / 版本 / 路径

| 项目 | 值 |
|---|---|
| 主包 | `@anthropic-ai/claude-code@2.1.285`（**显式带版本号** `npm pack` 实得 2.1.285） |
| 主包 `dist.integrity` | `sha512-frr0DLmVHSDNjw+hC6ZmXMVQ8yH4nNmVcI4lVFzWt0bdPNZP7clOKsuLcqSdwQabIpe6A3NEc3TJfiBVD8B2Bg==` → **与用户给的指纹一致** |
| 主包 `dist.shasum` | `2c81d81bc9c682564b1a90eb8a66073762fabe8a` → **与用户给的指纹一致**（即镜像取回的字节与真实源一致，可追溯） |
| 提示词真正载体 | `@anthropic-ai/claude-code-win32-x64@2.1.285`，tgz 110,419,954 B → `claude.exe` 243,751,072 B；`dist.integrity = sha512-7TR0I2gOkYBADZlazRQERyP9WHCOKTZPPUSYzoxHP5EdHNvd9ZRYfIHJwydRfECpm6EYjGZ9goB/ACPJOMVdww==`，`shasum = 9c07c00aff7182a0fba091cf580ca9c75a1d396e` |
| SDK 对照包 | `@anthropic-ai/claude-agent-sdk@0.3.285`（`npm view versions` 确认存在），tgz 1,542,941 B；`dist.integrity = sha512-e98yZH3cWjQ2nSXGxOcx5BrEqG9Y0+CoSoVIN1BaypxT7yGVShdhhH8ROYcJZWqjgiTFyTaN56JQSPJAjarOSg==`，`shasum = 525d4ad77345959849ee4b18a4e1857d2aec1cc2`；`package.json` → `"claudeCodeVersion": "2.1.285"` |
| 解包路径 | `C:/Users/joker/AppData/Local/Temp/cc-extract/`（子目录 `cc285/`、`sdk285/`、`cc-native285/`；另有 2.1.293 的 `cc/`、`sdk/`、`cc-native/`） |
| 本机原生安装 | `C:\Users\joker\.local\bin\claude.exe`，326,528,672 B（326 MB），PE32+ x64，12 sections，mtime `2026-08-19 04:41`；`claude.exe --version` → `2.1.235 (Claude Code)` |
| registry | `npm config get registry` → `https://npmreg.proxy.ustclug.org/`（镜像）；dist-tags `@anthropic-ai/claude-code` = `{ latest: '2.1.293', next: '2.1.294', stable: '2.1.285' }` |
| 定位约定 | 二进制内「行号」= **字节偏移**，记 `claude.exe@<offset>`；npm 的 `sdk.mjs` 是 minified，同样用字节偏移。引文逐字截取，标 `…` 处为截断。 |

---

## 枚举方法

实际执行的命令（全程非交互、只读；未改任何被调研的包/二进制，未联网到第三方合集）：

1. 版本与指纹
   - `npm view @anthropic-ai/claude-code dist-tags` → stable/latest/next 如上
   - `npm view @anthropic-ai/claude-agent-sdk versions --json` → 确认含 `0.3.285`
   - `npm view <pkg>@<ver> version dist.integrity dist.shasum`
2. 取包（镜像，`npm pack`，只落 `%TEMP%/cc-extract`）
   - `npm pack @anthropic-ai/claude-code@2.1.285`（7 文件，28,026 B）
   - `npm pack @anthropic-ai/claude-code-win32-x64@2.1.285`（4 文件，110 MB tgz）
   - `npm pack @anthropic-ai/claude-agent-sdk@0.3.285`（19 文件，1.54 MB）
   - `tar -xzf ... -C cc285|cc-native285|sdk285`；`find ... -printf '%s\t%p\n' | sort -rn`
3. 包内定位（阴性结果）
   - `grep -c "You are Claude Code" *.mjs *.js`（sdk285）→ 全 0
   - `grep -ac "You are Claude Code"`（cc285 全文件）→ 0
4. 二进制定位（无 `strings`，用 `grep -a` / node 读 buffer）
   - `grep -abco "<phrase>" claude.exe`（命中计数）、`grep -abo "<phrase>" claude.exe`（字节偏移）
   - `node -e 'fs.readFileSync("claude.exe").subarray(off,off+len)'` 读超长二进制片段
   - 本机 `strings` **不存在**（阳性：命令不存在），故无 `strings` 输出。
5. 语义定位
   - `grep -abo 'function Ok(\|g=vq(s)\|function qr(\|function vq(\|function ko(\|function Aoo(\|function _oo(' claude.exe`
   - `grep -abo 'appendSystemPrompt\|ANTHROPIC_BASE_URL\|ANTHROPIC_LOG\|--debug\|CLAUDE.md\|output_style\|system:om' claude.exe`

**覆盖到**：`@anthropic-ai/claude-code@2.1.285` 全部 7 文件、SDK 0.3.285 全部 JS/d.ts、win32-x64@2.1.285 二进制全量字节流（grep-a）、
本机 2.1.235 二进制全量字节流、以及上一轮的 2.1.293 三套产物（作 diff）。

**搜了但没有（阴性 ≠ 没搜）：** 见下方各表；两个 npm 包（wrapper 与 SDK）里没有任何提示词文本。

**没覆盖：** 见文末「未覆盖」。

---

## 提示词在包里的位置（2.1.285）

> 下列 2.1.285 条目全部落在 `cc-native285/package/claude.exe`（sha512 见第 0 节）。

### A. 身份常量与运行时分枝

| 位置 | 行号 | 内容（逐字，可截断并标 …） | 这是什么 |
|---|---|---|---|
| claude.exe | 206784258 | `var fS="You are Claude Code, Anthropic's official CLI for Claude."` | 交互态身份句 |
| claude.exe | 206784258 | `nO="You are Claude Code, Anthropic's official CLI for Claude, running within the Claude Agent SDK."` | 非交互 + 有 append 的身份句 |
| claude.exe | 206784258 | `rO="You are a Claude agent, built on Anthropic's Claude Agent SDK."` | 非交互 SDK 态身份句 |
| claude.exe | 206784555 | `function hVn(e){if(Pe()==="vertex")return fS;if(e?.recorded!==void 0)return e.recorded;if(e?.isNonInteractive){if(e.hasAppendSystemPrompt)return nO;return rO}return fS}` | **按环境/传输层选身份句** |
| claude.exe | 209027563 | `nEt="You are an agent working with the user toward their goals, using your own judgment along the way."` | 第三种身份句（intro-frame，env/GB 门控） |
| claude.exe | 209027667 | `oEt='You are an interactive agent that helps users according to your "Output Style", which describes how you should respond to user queries.'` | 有 output style 时的身份句 |

### B. 两套提示词的选取分支（完整版 vs 较短版）

| 位置 | 行号 | 内容（逐字，可截断并标 …） | 这是什么 |
|---|---|---|---|
| claude.exe | 203809156 | `function qr(e){let n=Be(e),s=Sh(n,"lean_prompt",e);if(s!==void 0)return!s;if(Nhe(e)\|\|n==="claude-mythos-5")return!1;if(n.includes("claude-3-")\|\|n.includes("haiku")\|\|n.includes("sonnet")\|\|n==="claude-opus-4-0"…\|\|n==="claude-opus-4-7")return!0;return !Vl()}` | **按模型 id 判定**：haiku/sonnet/opus-4-7 及更早 → 完整版；更新模型 → 短版 |
| claude.exe | 203809478 | `function vq(e){let n=Ae();return $J()?n.leanPromptCompiledOnly(e):n.leanPrompt(e)}` | 「是否用短版」取值入口 |
| claude.exe | 203809608 | `function ko(e){…if(!qr(e))return!0;…}` | `qr` 为假（新模型）→ true（短版） |
| claude.exe | 209047261 | `function Ok(e,n,r){…let s=Ote(n),g=vq(s),h=Be(s);…` | **系统提示词总装配函数** |
| claude.exe | 209047370 | `g=vq(s)` | 装配前先算 lean 开关 `g` |
| claude.exe | 209048999 | `return[...g?[Aoo(F,n)]:[_oo(F),koo(n),F===null\|\|F.keepCodingInstructions===!0?boo():null,woo(),Eoo(B),Coo()],…`.filter(…)` | **二选一**：`g` 真 = 单段 `Aoo`；假 = 六段完整版 |

### C. 完整版六段（分片）

| 位置 | 行号 | 内容（逐字，可截断并标 …） | 这是什么 |
|---|---|---|---|
| claude.exe | 209027809 | ``function _oo(e){return`\n${e!==null?oEt:tEt()?nEt:"You are an interactive agent that helps users with software engineering tasks."} Use the instructions below and the tools available to you to assist the user.`\n\n`${GMe}`\n`IMPORTANT: You must NEVER generate or guess URLs…`` | intro 段（含 `${…}` 占位） |
| claude.exe | 209028869 | `function koo(e){let n=["All text you output outside of tool use is displayed to the user. Output text to communicate with the user. You can use Github-flavored markdown…` | `# System` 段 |
| claude.exe | 209030002 | `function boo(){let n=[..."Don't add features, refactor, or introduce abstractions beyond what the task requires.…` | `# Doing tasks` 段 |
| claude.exe | 209034068 | ``function woo(){return`# Executing actions with care\n\nCarefully consider the reversibility and blast radius of actions.…`` | `# Executing actions with care` 段 |
| claude.exe | 209037720 | ``function Eoo(e){let n=[jE,Mv].find((w)=>e.has(w));if(nD()){let w=[n?`Break down and manage your work with the ${n} tool.…`` | 工具策略段（按启用工具动态拼） |
| claude.exe | 209042141 | `function Coo(){let e=["Only use emojis if the user explicitly requests it.…","Your responses should be short and concise.","When referencing specific functions or pieces of code include the pattern file_path:line_number…` | `# Tone and style` 段 |
| claude.exe | 209014271 | `var GMe="IMPORTANT: Assist with authorized security testing, defensive security, CTF challenges, and educational contexts. Refuse requests for destructive techniques, DoS attacks, mass targeting, supply chain compromise, or detection evasion for malicious purposes.…"` | 安全指令常量，被 intro 段引用 |

### D. 较短版（lean / `# Harness`）

| 位置 | 行号 | 内容（逐字，可截断并标 …） | 这是什么 |
|---|---|---|---|
| claude.exe | 209042767 | ``function Aoo(e,n){let r=e!==null?oEt:tEt()?nEt:"You are an interactive agent that helps users with software engineering tasks.",s=qP()?`\n - ${WMe}`:"";return`\n${r}\n\n${GMe}\n\n# Harness\n - Text you output outside of tool use is displayed to the user as Github-flavored markdown in a terminal. - Tools run behind a user-selected permission mode… - ${sEt(n,"lean")} Hooks may intercept tool calls… - Reference code as `file_path:line_number` — it's clickable.`` | **短版整段**（`# Harness` 标题；含 `${r}`、`${GMe}`、`${WMe}`、`${sEt(n,"lean")}` 占位） |

### E. 工具说明（与主提示词分开）

| 位置 | 行号 | 内容（逐字，可截断并标 …） | 这是什么 |
|---|---|---|---|
| claude.exe | 208557332 | `return["Executes a given bash command and returns its output.",…"The working directory persists between commands, but shell state does not.…"…]` | Bash 工具 description，独立函数返回数组后 join；每个工具各有自己的文本 |

### F. CLAUDE.md / output style / append 层

| 位置 | 行号 | 内容（逐字，可截断并标 …） | 这是什么 |
|---|---|---|---|
| claude.exe | 203293637 | `Codebase and user instructions are shown below. Be sure to adhere to these instructions. IMPORTANT: These instructions OVERRIDE any default behavior…` | CLAUDE.md/记忆内容进系统提示词时的表头 |
| claude.exe | 207702869 | ``# Output Style: ${…}``（`HFn` 式 ``function…{return`# Output Style: ${e}\n${n}`}``） | output style 作为系统提示词一段 |
| claude.exe | 203758395 | ``function PPo(e){let n=e.cli.systemPrompt,r=e.cli.appendSystemPrompt,s=h1o();if(s)r=r?`${r}\n\n${s}`:s;return{systemPrompt:n,appendSystemPrompt:r}}`` | append 层在客户端合并（`h1o()` 取 managed-settings 的 append） |
| claude.exe | 99691348 / 106968534 | `-d, --debug [filter]`…`--debug-to-stderr`…`--debug-file <path>` | 调试出参开关（CLI help） |

### G. 请求构造（客户端拼，非服务端）

| 位置 | 行号 | 内容（逐字，可截断并标 …） | 这是什么 |
|---|---|---|---|
| claude.exe | 209658416 | `om=mDo(n,Ef,{skipGlobalCacheForSystemPrompt:ar,cacheTtl:Pu})` | 客户端渲染出的 system 块 |
| claude.exe | 209658652 | `$mt(He,{model:Wx(D.model),tools:ju,system:om,messages:ts.map(...)},{querySource:…})` | 请求参数直接带 `system:` —— 客户端整段放入请求体 |
| claude.exe | 201215606 | `a.ANTHROPIC_BASE_URL` | 读取 `ANTHROPIC_BASE_URL` 覆盖 base URL |
| claude.exe | 206107783 | `function Sw(){let e=Wg("ANTHROPIC_LOG");…}` | 读取 `ANTHROPIC_LOG` 控制日志 |

### H. SDK 包（`@anthropic-ai/claude-agent-sdk@0.3.285`）

| 位置 | 行号 | 内容（逐字，可截断并标 …） | 这是什么 |
|---|---|---|---|
| sdk.d.ts | 2311-2313 | ``- `{ type: 'preset', preset: 'claude_code' }` - Use Claude Code's default system prompt`…`append: '...'`…`excludeDynamicSections: true`` | 官方 preset 语义声明 |
| sdk.d.ts | 4530 | `When true, omit per-user dynamic sections (working directory, auto-memory path) from the cached system prompt and re-inject them as the first user message.…Has no effect when a custom (non-preset) system prompt is in use.` | `excludeDynamicSections` 行为 |
| sdk.mjs | 1166221 | `…else if(s.type==="preset")f=s.append,m=s.excludeDynamicSections,g=s.snapshot` | **SDK 只解析 preset 元数据，不生成文本** |
| sdk.mjs | 1128989 | `return{subtype:"initialize",…systemPrompt:…,appendSystemPrompt:this.initConfig?.appendSystemPrompt,…excludeDynamicSections:this.initConfig?.excludeDynamicSections,…}` | preset/append 经 initialize 控制帧交给原生 CLI |
| sdk.mjs | 1168748 | `throw Error(\`Native CLI binary for ${process.platform}-${process.arch} not found. Reinstall @anthropic-ai/claude-agent-sdk without --omit=optional, or set options.pathToClaudeCodeExecutable.\`)` | **SDK 必须落到原生二进制**，文本不在 JS 包里 |

### I. 本机原生安装（`claude.exe` 2.1.235，仅探针）

| 位置 | 行号 | 内容（逐字，可截断并标 …） | 这是什么 |
|---|---|---|---|
| `C:\Users\joker\.local\bin\claude.exe` | 293741850 | `var gZs="You are Claude Code, Anthropic's official CLI for Claude.",UTd="You are Claude Code, Anthropic's official CLI for Claude, running within the Claude Agent SDK.",BTd="You are a Claude agent, built on Anthropic's Claude Agent SDK.…function KGo(e){…if(e?.isNonInteractive){if(e.hasAppendSystemPrompt)return UTd;return BTd}return gZs}` | 2.1.235 身份常量与分支（**证明明文可搜**；内容不代表 2.1.285） |
| `C:\Users\joker\.local\bin\claude.exe` | 306034803 | ``function adE(e){return`\nYou are an interactive agent that helps users ${e!==null?'according to your "Output Style" below,…':"with software engineering tasks."}…`` | 2.1.235 的 intro 段（同上，仅探针） |
| `C:\Users\joker\.local\bin\claude.exe` | 306049900 | `…[adE(c),cdE(t),…udE():null,ddE(),pdE(d),hdE()]…` | 2.1.235 的装配数组（同上，仅探针） |

---

## 六条路线结论

### 1. npm 包静态抽取（主路线）
**能拿到，但载体不是 `@anthropic-ai/claude-code` 本身。** 该包只有 7 文件、28 KB，是纯安装器/启动器：
`package.json.bin` 指向 500 B 的 `bin/claude.exe` 占位，`install.cjs`/`cli-wrapper.cjs` 从 `optionalDependencies`
（`@anthropic-ai/claude-code-<platform>`）拷原生二进制；包内 **0 条提示词文本**。必须再 `npm pack
@anthropic-ai/claude-code-win32-x64@2.1.285`（110 MB tgz → 243 MB `claude.exe`）才拿到文本。
提示词**是分片拼接**：总装 `Ok`（`@209047261`）在 `g@209047370 = vq(s)` 后二选一（`@209048999`）——
完整版由六函数 `_oo/koo/boo/woo/Eoo/Coo` 分段生成，另一条是单段 `Aoo`（lean）。
**有模板占位符** `${e?…}`、`${GMe}`、`${WMe}`、`${sEt(n,"lean")}`、`${r}`、`${n}`、`${zSe(...)}` 等，需运行时按模型/环境/工具集填充。
**按模型分支**：`qr(e)`（`@203809156`）按模型 id（haiku/sonnet/claude-opus-4-7 及更早 vs 更新）选完整版/短版。
**按环境分支**：`hVn`（`@206784555`）按 vertex/非交互/hasAppend 选身份句；`Eoo` 按启用工具、`Noo` 式函数按平台/git；
大量 `Nf(name, gated)=>…` 开关段。**工具说明与主提示词分开**：主提示词段在 `@209.02M-209.04M`，工具 description 各自独立（Bash 例 `@208557332`）。
代价：需下载 ~243 MB 平台二进制；文本散在 ~100 KB 源码区间，靠函数名/字符串 grep 定位。

### 2. `@anthropic-ai/claude-agent-sdk@0.3.285`
**不能从这个包拿到文本，它不带 `cli.js`。** 19 文件、1.54 MB，全部 `grep -c "You are Claude Code"` = 0。
它是 stdio 客户端：解析 `systemPrompt` 的 preset 元数据（`sdk.mjs@1166221`），经 `subtype:"initialize"` 控制帧
把 `systemPrompt`/`appendSystemPrompt`/`excludeDynamicSections` 发给原生 CLI（`sdk.mjs@1128989`）；
找不到原生二进制就抛错（`sdk.mjs@1168748`）。`package.json` 的 `"claudeCodeVersion":"2.1.285"` 与基线版本一致，
两份文本**唯一来源都是那一个原生二进制**，故「两份是否一致」= 同源（SDK 侧没有第二份）。
代价：无（也无收益，要文本仍走路线 1）。

### 3. 本机原生安装（`claude.exe` 2.1.235）
**能拿到，明文字节可搜。** 本机没有 `strings`，用 `grep -abo` + node 读 buffer：
`grep -ac "You are Claude Code"` = 3，`grep -abo` 命中 `99262064`/`293742110`/`296115613`；读 `293741850` 得
`var gZs="You are Claude Code, Anthropic's official CLI for Claude."…`（见 I 表）。**但版本是 2.1.235**
（`claude.exe --version` 实测，mtime 2026-08-19），比 stable 2.1.285 落后 50 个 patch，
**不能代表 2.1.285 的提示词内容**——2.1.235 的装配数组（`@306049900`）用 `adE/cdE/udE/ddE/pdE/hdE` 命名，
与 2.1.285 的 `_oo/koo/boo/woo/Eoo/Coo/Aoo` 不同；本机这段只作「二进制内提示词明文、可用 grep/node 提取」的**可行性探针**。
代价：无需下载，但版本不对；当前版文本仍须走路线 1。

### 4. 运行时拦截
**是客户端拼好后整段放进请求体，不是服务端拼。** 证据：`om=mDo(n,Ef,{…})`（`@209658416`），
随后进入 API 参数 `{model:…,tools:ju,system:om,messages:…}`（`@209658652`）；SDK 文档亦说明 preset 由客户端替换。
出参/改向开关：读 `ANTHROPIC_BASE_URL`（`@201215606`），读 `ANTHROPIC_LOG`（`@206107783`），
CLI 有 `--debug [filter]`/`--debug-to-stderr`/`--debug-file`（`@99691348`）。
**本轮只做静态取证，未发任何请求、未消耗额度。** 代价：要真拦截得挂代理（改 `ANTHROPIC_BASE_URL`）或开 debug 落盘；
既然文本静态就在二进制里（路线 1），拦截的边际价值有限。

### 5. 官方 preset 路径
**preset 由本地（原生 CLI）解析成本地文本，不是服务端解析。** SDK 侧只搬运元数据：
`sdk.d.ts:2311-2313` 定义 `{type:'preset',preset:'claude_code'}`；`sdk.mjs@1166221` 只拆 `append`/`excludeDynamicSections`；
`sdk.mjs@1128989` 经 `initialize` 帧转给原生 CLI；原生 CLI 里 `qr/vq/ko`（`@203809156`/`@203809478`/`@203809608`）
才真正决定用完整版还是短版并渲染字符串，且 CLI 自调用也写死 `systemPrompt:{type:"preset",preset:"claude_code"}`。
**结论：pi 可以复用「preset 这个名字/开关语义」，但不能复用它实际注入的文本**——文本只在原生二进制内；
pi 若要等价效果，必须自己携带这段文本（路线 1 的抽取物），或直接 `spawn` Claude Code 原生二进制。
代价：复用语义零成本；复用文本仍需路线 1。

### 6. 追加层 vs 替换层
- `--append-system-prompt[-file]`：在客户端把追加文本并到 preset 之后（`PPo`，`@203758395`，`h1o()` 取 managed-settings 的 append）；
  同时把非交互身份从 `rO` 切成 `nO`（`hVn`，`@206784555`，`hasAppendSystemPrompt`）。
- output styles：客户端生成 `# Output Style: <name>\n<prompt>` 作为系统提示词的一段（`# Output Style: `，`@207702869`）。
- `CLAUDE.md`：本地读取后以「Codebase and user instructions are shown below…」一段进系统提示词（`@203293637`），
  受 `settingSources` / `--safe-mode` 控制（CLI help 内 `--system-prompt[-file], --append-system-prompt[-file], --add-dir (CLAUDE.md dirs)`）。

---

## 附：与 latest（2.1.293）的差异

2.1.293 的三套产物（wrapper / SDK 0.3.293 / win32-x64 256,155,808 B 二进制）本轮已抽好并保留在
`cc-extract/cc/`、`cc-extract/sdk/`、`cc-extract/cc-native/`。**两版文本未发现差异**：抽样的稳定锚点
`You are Claude Code…`、`You are an agent working with the user toward their goals…`、`# Harness`、
`mid-conversation system turns`、`The system may send updates, reminders`、六段标题、Bash `Executes a given bash command…`
在两份二进制里逐字相同（`grep -ac` 均命中）。差异只在**内部函数/常量命名**（2.1.293：`fS→pE`、`qr→Ri`、`vq→RK`、
`ko→qo`、`Ok→FVt`、`_oo→GLo`、`koo→KLo`、`boo→VLo`、`woo→YLo`、`Eoo→ZLo`、`Coo→nNo`、`Aoo→oNo`、`GMe→r1e`、`hVn→Grr`）
与二进制体积，对「能否拿到文本」的结论无影响。2.1.293 的具体偏移见上一轮产物，如需可再列。

---

## 未覆盖

- **没读完整**：2.1.285 `Ok` 的 `Nf(...)` 开关段列表（`communication/pronouns/action_caution/…/endconv_deferred_hint`）
  只逐字确认首尾若干条，中间项未全展开；多为 feature-flag 段，不影响可获取性结论。
- **没逐字核对**：完整版六段与 lean 段的完整正文（本轮只取每段首句证明「这是发给模型的指令文本」）；
  逐条内容判定按任务约定留到下一轮。
- **没搜**：`@anthropic-ai/claude-code-darwin-*` / `linux-*` 等其他平台原生包（未下载）；假定与 win32 同源。
- **没做**：真实请求/代理拦截验证（硬约束要求静态取证）；`ANTHROPIC_BASE_URL`/`ANTHROPIC_LOG` 只证明「被读取」，
  未追到「怎么序列化到输出」的终点。
- **没联网验证**：用户/上级提供的官方文档行（`code.claude.com/docs/en/env-vars.md:379`、
  `agent-sdk/modifying-system-prompts.md`）本轮未二次取证，按既有前提采信；本文件所有代码级结论均来自本地包/二进制。
- **本机二进制**（2.1.235）只做搜性探针与三处定位，未系统枚举其提示词，避免与 2.1.285 结论混淆。

---

> 落盘说明：本文件是研究子代理的最终回复原文，由主代理抄录至此路径。子代理未按 brief 的要求自行写文件。
> 抽查记录（主代理，2026-10-08）：`claude.exe@206784258` 的 `var fS="You are Claude Code`、`@203809156` 的 `function qr(e){let n=Be(e),s=Sh(n,"lean_prompt"`、`@209048999` 的 `Aoo(F,n)]:[_oo(F),koo(n)` 三处逐字命中，偏移量属实。
