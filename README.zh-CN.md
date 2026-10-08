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

## 快速开始
安装完毕后自动生效。插件会选取 ~/.pi/agent/model-system-prompt/ 下**文件名是当前 model id 最长前缀**的那个 md 文件，把它的内容追加进 pi agent 的系统提示词。例如 model 为 glm-5.3-flash 时依次看 glm-5.3-flash.md、glm-5.3.md、glm.md，取存在且最长的那一个。不区分大小写；没有任何文件匹配的模型完全不受影响。

需要自己写特定模型的系统提示词时，只需要在 ~/.pi/agent/model-system-prompt/ 目录下添加与该 model 同名的 md 文件——或者用它所归属的同族名，此后以该名字开头的所有 model id 都会用它——并在文件中编写即可。打开 pi 时会自动加载。

要关掉某一个模型，把它的文件清空。清空会连同这个名下更具体的 id 一起静默：把 glm-5.3.md 清空，glm-5.3-flash 也拿不到东西。删除只有在没有更短的同名文件仍能匹配时才算关掉：删掉 glm-5.3.md 之后，glm-5.3 仍然吃 glm.md。

插件提供优质的预置提示词。注意，由于开源模型存在不同精度和微调，所以预置提示词的调校均基于各自的官方模型，不对非官方模型效果做保证。鼓励用户根据自己使用的模型自己调控系统提示词。

预置系统提示词的模型列表
* MiniMax-M3
* MiniMax-M3.1-Flash-Preview
* deepseek-flash
* glm-5.3-flash
* glm-5.3
* kimi-k3

## 预置提示词来源
均来自于各官方模型自己的专用coding agent工具

minimax来自于minimax code

glm来自于zcode

deepseek来自于deepseek harness

欢迎提交新的模型预置提示词

为了核实通用性，但是必须标注清楚来源，必须是官模调校

## 首次运行会发生什么

| 你已经有… | 会发生什么 |
| --- | --- |
| 什么都没有 | 预置模型系统提示词被复制进 `~/.pi/agent/model-system-prompt/`。 |
| 自己写的 `~/.pi/agent/model-system-prompt/<modelId>.md` | 一律不动。 |

## ☕ 支持这个项目

如果你觉得这个项目有用，可以请作者喝杯咖啡

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/你的用户名)
