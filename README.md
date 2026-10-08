# pi-model-system-prompt
Lets different large models use different system prompts.
When you switch models, the system prompt specific to that model is appended to the context, keyed on the currently active model id.

[中文](README.zh-CN.md)

## Why this extension
Large models need more than different capabilities — they need different harnesses. This shows up in agents such as Claude Code, Codex, and the pi agent, where each loads a system prompt tailored to a specific model at startup.

In the course of using the pi agent we mix and match large models from several different sources. That kind of use is exactly the charm of a coding agent as free-form as pi.

So when switching between models inside the pi agent, the ideal is that each model gets to use its own independent system prompt.

This extension provides exactly that.

## Install

```sh
pi install npm:pi-model-system-prompt
```

Restart Pi after installing.

## Quick start
It takes effect as soon as it is installed. The extension picks the Markdown file in `~/.pi/agent/model-system-prompt/` whose name is the longest prefix of the current model id, and appends its contents to the pi agent's system prompt. For model `glm-5.3-flash` that is `glm-5.3-flash.md` if it exists, otherwise `glm-5.3.md`, otherwise `glm.md`. Case is ignored, and a model with no matching file is untouched.

To write your own system prompt for a specific model, add a Markdown file in `~/.pi/agent/model-system-prompt/` named after that model — or after the family it belongs to, which then serves every model id starting with that name — and write the prompt in it. It is loaded automatically when you open pi.

To turn one model off, empty its file. Deleting it works only while no shorter name still matches: delete `glm-5.3.md` and `glm-5.3` is still served by `glm.md`.

The extension ships well-tuned preset prompts. Note that open-source models come in different quantizations and fine-tunes, so every preset prompt is tuned against its own official model, and no guarantee is made for unofficial builds. You are encouraged to tune the system prompt yourself to match the model you actually run.

Models with preset system prompts
* MiniMax-M3
* MiniMax-M3.1-Flash-Preview
* deepseek-flash
* glm-5.3-flash
* glm-5.3
* kimi-k3

## What happens on first run

| You already have… | What happens |
| --- | --- |
| Nothing | The preset model system prompts are copied into `~/.pi/agent/model-system-prompt/`. |
| Your own `~/.pi/agent/model-system-prompt/<modelId>.md` | None of them is touched. |

## ☕ Support the project

If you find this project useful, consider supporting its development.

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/jokerx001)
