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
安装完毕后自动生效。根据当前选择的model，只要~/.pi/agent/model-system-prompt/目录下存在与当前model同名的md文件，那么该文件内容就被当作此model的特定系统提示词，插件会将它加入pi agent的系统提示词中。

需要自己写特定模型的系统提示词时，只需要在~/.pi/agent/model-system-prompt/目录下添加model同名md文件，并在文件中编写即可。打开pi时会自动加载。

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
