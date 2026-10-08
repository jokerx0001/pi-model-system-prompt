# 调研：怎么拿到 Claude Code 的 harness 提示词（claude 系列）

答一个问题：有哪些办法能拿到 Claude Code 真正发给 Claude 系列模型的系统提示词。
本轮只做「获取路径 + 可获取性」的取证，不做提示词内容的逐条判定（那是下一轮）。

派遣参数：一个子代理；`agent: scout`、`skill: research`、async: true；
`timeoutMs: 3600000`、`checkpointBeforeDeadlineMs: 600000`；不传 `output` —— 输出文件由子代理自己写。

---

## 版本基线（用户 2026-10-08 决定：用 stable）

- 抽取对象钉在 **npm 包 `@anthropic-ai/claude-code@2.1.285`**（`stable` channel，发布于
  2026-09-29T17:32:09Z），**与任何本机安装无关**。
- 查证来源 `registry.npmjs.org`，当时的 dist-tags：`stable = 2.1.285` / `latest = 2.1.293` /
  `next = 2.1.294`。本机镜像是 `npmreg.proxy.ustclug.org`，dist-tags 与真实源一致。
- **必须显式带版本号取包**：`npm pack @anthropic-ai/claude-code@2.1.285`。不带版本号会拿到 `latest`。
- 可复现凭据（写进输出文件头）：
  `dist.integrity = sha512-frr0DLmVHSDNjw+hC6ZmXMVQ8yH4nNmVcI4lVFzWt0bdPNZP7clOKsuLcqSdwQabIpe6A3NEc3TJfiBVD8B2Bg==`、
  `dist.shasum = 2c81d81bc9c682564b1a90eb8a66073762fabe8a`。
- **文本载体（子代理实测修正）**：`@anthropic-ai/claude-code` 本身只是 7 文件 / 28 KB 的安装器，包内 0 条提示词文本；
  真正的载体是平台包 **`@anthropic-ai/claude-code-win32-x64@2.1.285`**（tgz 110,419,954 B → `claude.exe`
  243,751,072 B），`dist.integrity = sha512-7TR0I2gOkYBADZlazRQERyP9WHCOKTZPPUSYzoxHP5EdHNvd9ZRYfIHJwydRfECpm6EYjGZ9goB/ACPJOMVdww==`、
  `shasum = 9c07c00aff7182a0fba091cf580ca9c75a1d396e`。下一轮抽取要 pin 的是**这两个包一起**。
  提示词在二进制里是**明文**，本机无 `strings` 时用 `grep -abo` + node 读 buffer 即可取。
- 本机 `C:\Users\joker\.local\bin\claude.exe` 是 **2.1.235**（比 stable 还旧 50 个 patch），
  只在第 3 条路线里做「明文可搜性」取证的探针，不得当内容来源。
- `claude-code` 的 channel 会走；今天 `stable` = 2.1.285，改天可能是别的号 —— 所以记的是**版本号 + 指纹**，
  不是「stable」这个词。

---

## 你是研究子代理

按 research skill 执行：只依据一手来源（包内源码 / 本机二进制 / 官方文档），每条结论标 `文件:行号`，
禁止二手转述，禁止拿别人的博客或 GitHub 上的「提示词泄露合集」当证据。

## 待验证的六条路线

对每条路线回答「能不能拿到」「拿到的是完整的还是分片的」，并给证据。

1. **npm 包静态抽取（主路线）**：`npm pack @anthropic-ai/claude-code`（**stable 2.1.285**，见上「版本基线」）解包到
   `C:/Users/joker/AppData/Local/Temp/cc-extract/`。先列出包内文件与体积，再定位系统提示词。
   要回答：提示词是一整个常量还是分片拼接？分片在哪些文件？有没有模板占位符（`${...}` 之类）需要在
   运行时填？有没有按模型（opus/sonnet/haiku）或环境（Windows、IDE、非交互 / SDK 模式）分支的文本？
   工具说明与主提示词是分开的吗？
2. **`@anthropic-ai/claude-agent-sdk@0.3.285`**（该包没有 stable tag，只有 latest/next，必须显式指定版本）：包里是否携带同一份文本（尤其是否自带 `cli.js`）。
   与第 1 条比对：同版本下两份文本是否一致。
3. **本机原生安装**：`C:\Users\joker\.local\bin\claude.exe`（PE32+，326 MB）。判断提示词是否明文可搜。
   注意本机**没有** `strings`；用 `grep -a` 或 node 读 buffer 判定，给出实际执行的命令与命中/未命中。
   同时记录 `claude --version` 的输出（失败就记失败，不算阻塞）。
4. **运行时拦截**：从包内代码取证 —— 是否读 `ANTHROPIC_BASE_URL`、是否有 `--debug` 或 `ANTHROPIC_LOG`
   之类的出参开关；系统提示词是**客户端拼好后整段放进请求体**，还是服务端拼。给出代码位置。
   只做静态取证，不要真的发请求、不要消耗额度。
5. **官方预设路径**：SDK 的 `systemPrompt: { type: 'preset', preset: 'claude_code' }` 在包内如何实现 ——
   本地替换成真实文本，还是服务端解析？这一条决定「pi 能不能直接复用这个 preset 而不必知道文本」，
   结论必须有代码证据。
6. **追加层 vs 替换层**：`--append-system-prompt`、output styles、`CLAUDE.md` 各自加在哪一层，各一句话
   说清即可，不必穷尽。

## 输出文件

路径：`D:/project/pi-extension/model-system-prompt/.scratch/presets-claude-code/research/npm-extraction.md`

结构：

1. 标题 + 包名/版本/解包路径 + 本机二进制路径与体积。
2. `## 枚举方法`：逐条列出你实际执行的命令，说明覆盖了什么、没覆盖什么（把「没搜」与「搜了没有」分开写）。
3. `## 提示词在包里的位置` 表格：`| 位置 | 行号 | 内容（逐字，可截断并标 …） | 这是什么 |`
   只收能证明「这段是发给模型的指令文本」的条目；同一文件的条目连续排列；定稿前自检引文是否真在标注行上。
4. `## 六条路线结论`：每条一段 —— 能不能拿到 / 拿到的是完整还是分片 / 证据（文件:行号）/ 代价。
5. `## 未覆盖`：没读完或没搜到的部分与原因。

## 硬约束

- 不得修改被调研的包与二进制；除上面那一个输出文件外不得写本仓任何文件。
- 临时解包只放 `C:/Users/joker/AppData/Local/Temp/cc-extract/`。
- 只用 npm 取包，且**一律带显式版本号**（`npm pack <pkg>@<version>`）；不要去 clone 第三方「提示词合集」仓库。
- 先写骨架（标题、枚举方法）并落盘，再逐块补证据，每完成一块就写入文件。
- 最终回复只写三行：输出路径；六条路线各自一句话结论；你自认最可能被推翻的三处。
