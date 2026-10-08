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
The `.md` in the user's prompt directory that the active model resolves to.
It is user data: the user edits it, or deletes or empties it to turn that model off — deleting only
works when nothing shorter still matches that model.
_Avoid_: preset, config

**Family file**:
A prompt file whose name is a prefix of the model id, so it serves that model when no longer name
matches it.
_Avoid_: default prompt, wildcard

**System prompt**:
The whole instruction text pi assembles for a run. The extension only ever appends to it.
_Avoid_: preset, prompt file

**Install**:
One command, `pi install npm:pi-model-system-prompt`: pi installs the package, and the package's own
npm install lifecycle copies the presets into the user's prompt directory. After the copy a preset
is a prompt file, indistinguishable from one the user wrote.
_Avoid_: setup, two steps
