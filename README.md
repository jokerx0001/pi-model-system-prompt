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

The extension ships well-tuned preset prompts. Note that open-source models come in different quantizations and fine-tunes, so every preset prompt is tuned against its own official model, and no guarantee is made for unofficial builds. You are encouraged to tune the system prompt yourself to match the model you actually run.

Models with preset system prompts
* MiniMax-M3
* MiniMax-M3.1-Flash-Preview
* deepseek-flash
* glm-5.3-flash
* glm-5.3
* kimi-k3

## Matching and override rules
Which file wins is decided by its name

1. **The longest prefix wins**. When several files match the same model id, the one with the longest name takes effect. For id `glm-5.3-flash`, with `glm-5.3-flash.md`, `glm-5.3.md` and `glm.md` all present, only `glm-5.3-flash.md` applies.
2. A file named exactly after the id always wins.
3. Case is ignored.
4. No wildcards, literal prefixes only. `glm.md` also matches an unrelated id like `glmish-2`. So do not pick too short a name: `g.md` swallows every id starting with g.

### Turning a model off
- Recommended: empty the file that would win. The file exists but is empty = the model gets no dedicated prompt, and it does not fall back to a shorter file of the same family.
- Deleting a file is not turning it off. It only counts while no shorter name still matches: delete `glm-5.3.md` and `glm-5.3` is still served by `glm.md`.
- To turn off a whole family, emptying the family file only covers ids with no more specific file — empty `glm.md` and `glm-4` gets nothing, but as long as `glm-5.3.md` is there, `glm-5.3-flash` still goes through `glm-5.3.md`. To really kill a family, empty every relevant `glm*.md`.

## Where the preset prompts come from
Each comes from the official coding agent tool of that model itself

minimax from minimax code

glm from zcode

deepseek from deepseek harness

New preset model prompts are welcome

To verify generality, the source must be stated clearly and the prompt must be tuned against the official model

## What happens on first run

| You already have… | What happens |
| --- | --- |
| Nothing | The preset model system prompts are copied into `~/.pi/agent/model-system-prompt/`. |
| Your own `~/.pi/agent/model-system-prompt/<modelId>.md` | None of them is touched. |

## ☕ Support the project

If you find this project useful, consider supporting its development.

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/jokerx001)
