# model-system-prompt

A pi extension that appends a per-model system prompt, chosen by the active model id. It
distinguishes two kinds of prompt text: the presets this project ships, and the prompt files the
user owns.

## Language

**Preset**:
Prompt text for one model that this project versions and ships; installing copies it into the
user's prompt directory.
_Avoid_: default prompt, fallback, template

**Prompt file**:
The `<modelId>.md` in the user's prompt directory that the extension reads for the active model.
It is user data: the user edits it, or deletes it to turn that model off.
_Avoid_: preset, config

**System prompt**:
The whole instruction text pi assembles for a run. The extension only ever appends to it.
_Avoid_: preset, prompt file

**Install**:
Two steps: pi records the package, then the presets are copied into the user's prompt directory.
After the copy a preset is a prompt file, indistinguishable from one the user wrote.
_Avoid_: setup
