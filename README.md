# pi-model-system-prompt

A pi extension that appends a per-model system prompt, chosen by the active model id.

```sh
pi install npm:pi-model-system-prompt
```

The prompt for a model is `~/.pi/agent/model-system-prompt/<modelId>.md`, read fresh on every run.
Models with no file are untouched; delete the file to turn that model off. `presets/` ships one to
start from — install copies it there without overwriting anything you already have.

