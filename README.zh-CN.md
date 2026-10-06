# pi-model-system-prompt
让不同大模型能够使用不同的系统提示词。
切换大模型时，按当前激活的 model id，把该模型专属的 system prompt 追加到上下文。

[English](README.md)

## 为什么需要这个插件
不同的大模型，除了能力不同，其实还需要不同的harness方式。表现在agent中, 如claude code, codex, pi agent，那就是启动时针对特定模型加载的系统提示词。

在我们使用Pi agent的过程中，可能使用多个不同来源的大模型进行混用，这种用法也是Pi Agent这种高自由度coding agent的魅力。

那么在Pi agent中切换不同模型时，最好能让不同模型能使用各自独立的系统提示词。

本插件提供此能力。

## 安装

```sh
pi install npm:pi-model-system-prompt
```

装完重启 Pi。

## 首次运行会发生什么

| 你已经有… | 会发生什么 |
| --- | --- |
| 什么都没有 | `MiniMax-M3.1-Flash-Preview.md` 被复制进 `~/.pi/agent/model-system-prompt/`。其余模型完全不受影响。 |
| 自己写的 `<modelId>.md` | 一律不动。目录里已经存在的文件就是你的，不管你改过没有。 |
| 删掉过的预设 | 之后的安装不会把它放回来：npm 不会为已安装的版本重跑某个包的安装钩子。但彻底重装（删掉 `node_modules` 再装）或本包出新版本时，会重新写入。 |

## 一个模型如何拿到它的提示词

一条规则，每次运行都重新求值：

```
~/.pi/agent/model-system-prompt/<modelId>.md
```

- `<modelId>` 就是 model id 本身——`MiniMax-M3.1-Flash-Preview`，不带 provider 前缀。同一个文件
  跟着模型走，无论哪个 provider 提供它。
- 文件每次都重新读取，所以改完下一条消息就生效，不需要 `/reload`。
- 内容追加到 pi 已经组装好的 system prompt 末尾，因此 harness 默认内容、你的 `SYSTEM.md`、你的
  项目指令，以及其他扩展追加的内容都会保留。
- 任何形式的「没有」都是无操作：文件不存在、内容为空、全是空白、或者你读不到它，system prompt
  都保持原样。

| 你想… | 就这么做 |
| --- | --- |
| 给某个模型加指引 | 新建 `~/.pi/agent/model-system-prompt/<modelId>.md` |
| 关掉某个模型 | 删掉它的文件 |
| 改模型收到的内容 | 编辑它的文件——下一条消息就用新内容 |
| 关掉但保留文字 | 把文件清空 |

## 提示词文本从哪来

`presets/` 随包附带一份提示词：`MiniMax-M3.1-Flash-Preview.md`。安装时把它复制到上面的目录，
从那一刻起它就是一份普通的提示词文件：你可以编辑，也可以删掉来关掉这个模型，扩展对两者行为一致。
没有 manifest，也没有状态文件——磁盘上有什么就是什么。

## 开发

```sh
pi install .              # 把这个路径记进 ~/.pi/agent/settings.json
npm run install-presets   # 与 postinstall 钩子跑的是同一个脚本
npm test
```

开发检出是从源码加载的，所以改完重新加载即可，不需要重装。`npm run check` 会额外跑类型检查；
它需要先链接一次工具链：`npm link @earendil-works/pi-coding-agent`，因为类型来自已安装的 pi，
而不是某个依赖。
