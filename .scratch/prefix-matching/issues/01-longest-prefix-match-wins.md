# 01: Longest prefix wins

**What to build:** The active model resolves to the prompt file whose name is the longest
case-insensitive prefix of its id. `glm-5.3-flash.md` serves `glm-5.3-flash`; without it,
`glm-5.3.md` serves it; without that, `glm.md`. The winning file is then read under the rules that
already exist: unreadable or empty/whitespace-only injects nothing, and does not fall back to a
shorter match. Spec: [`../spec.md`](../spec.md). Decision: [`docs/adr/0001`](../../../docs/adr/0001-longest-prefix-match-wins.md).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Resolution is the longest case-insensitive filename prefix of the model id; a file named
      `.md` (empty stem) is not a candidate, and the exact file wins without a separate branch
- [x] The winner is chosen by name alone; an unreadable or empty/whitespace-only winner injects
      nothing and no shorter candidate is consulted
- [x] Handler tests cover: family fallback, the exact file winning, the longest of three winning,
      an empty winner suppressing a full family file, a whitespace-only winner doing the same, an
      unreadable winner not falling back, case-insensitive matching, `.md` ignored, and the
      case tie-break where the filesystem can hold both names; the existing no-op cases still pass
- [x] `npm run check` is green, with the host pi linked so the typecheck sees the real extension
      context type
- [ ] Docs updated: `CONTEXT.md` (the off-switch sentence and the **Family file** term),
      `AGENTS.md`, `README.md`, `README.zh-CN.md`, the prompt directory's own `README.md`, and the
      resolution in the `prompt-inspector` debug extension outside this repo
- [ ] Verified end to end in a live session with the evidence recorded below: a model with no exact
      file, served by a family file, shows that file's text at the tail of the `system` message in
      the request that actually reaches the provider

## Notes

The rule is now a property of the directory rather than of one file: adding or deleting a file
changes resolution for ids other than the one it is named after. That is intended and is why the
per-model duplicate presets stay — the user wants to be able to diverge them later.

Two consequences are accepted rather than repaired, and are written down so nobody "fixes" them:

- Deleting a per-model file no longer turns that model off while a shorter file still matches it;
  emptying the file is the reliable switch.
- The prefix is raw, so `glm.md` also serves `glmish-2`, and a stray `g.md` would serve every id
  starting with `g`.

## Evidence

To be recorded when the code lands: the test names that pin each rule, the `npm run check` result,
and the outgoing-payload comparison for the live criterion (marker file plus a throwaway
`before_provider_request` probe, as ticket 01 of `model-system-prompt` did).

Recorded for the code landing (live criterion still open, run by the parent):

Tests added to `test/extension.test.ts`, all in `node --test ./test/*.test.ts`:

- `a family file serves an id with no file of its own`
- `the exact file wins over a shorter family file`
- `the longest of three candidates wins`
- `an empty winner suppresses the family file and does not fall back`
- `a whitespace-only winner suppresses the family file`
- `an unreadable winner does not fall back to the family file`
- `matches the model id case-insensitively`
- `a file named .md is not a candidate, being an empty prefix`
- `names differing only in case break to the id's own casing, then to the first stem`

The last one probes the filesystem first and returns early unless it can hold two names that
differ only in case; on this Windows host the probe fails, so its assertions did not execute
here. It is the one case of this ticket unverified on this machine.

`npm run check` (typecheck + tests, host pi linked via `npm link @earendil-works/pi-coding-agent`):

```
> pi-model-system-prompt@0.1.2 check
> npm run typecheck && npm test
> pi-model-system-prompt@0.1.2 typecheck
> tsc --noEmit
> pi-model-system-prompt@0.1.2 test
> node --test ./test/*.test.ts
✔ appends the active model's file after the rendered prompt
✔ delivers the file body whole: interior bytes reach the prompt unaltered
✔ model ids with dots and hyphens resolve to their file
✔ returns nothing when the active model has no file
✔ returns nothing when the prompt directory does not exist
✔ returns nothing for an empty or whitespace-only file
✔ returns nothing when the prompt cannot be read
✔ returns nothing when no model is selected
✔ reads the file fresh, so edits apply to the next run
✔ a family file serves an id with no file of its own
✔ the exact file wins over a shorter family file
✔ the longest of three candidates wins
✔ an empty winner suppresses the family file and does not fall back
✔ a whitespace-only winner suppresses the family file
✔ an unreadable winner does not fall back to the family file
✔ matches the model id case-insensitively
✔ a file named .md is not a candidate, being an empty prefix
✔ names differing only in case break to the id's own casing, then to the first stem
✔ composes with another force-appending extension in either load order
✔ copies a preset into a target directory that does not exist yet
✔ never overwrites a file the user already has, edited or not
✔ copies only the missing presets and reports both sets
✔ installing twice is idempotent, and the shipped preset is a real file
✔ a missing presets directory seeds nothing and creates no directory
✔ the dev command seeds a fresh home directory through the real entry point
✔ the documented install seeds the preset through the packaged postinstall hook
ℹ tests 26
ℹ pass 26
ℹ fail 0
```

`prompt-inspector` (outside this repo, at `~/.pi/agent/extensions/prompt-inspector/index.ts`; not
under git, so the diff is written out rather than generated). Only the resolution and its import
changed:

```diff
-import { existsSync, readFileSync, writeFileSync } from "node:fs";
+import { readdirSync, readFileSync, writeFileSync } from "node:fs";
@@
-function perModelFile(modelId: string | undefined): string | undefined {
-	if (!modelId) return undefined;
-	const file = join(PROMPT_DIR, `${modelId}.md`);
-	return existsSync(file) ? file : undefined;
-}
+/**
+ * Which prompt file the model id resolves to: the longest case-insensitive filename prefix
+ * of the id, ties broken by the id's own casing then by the first stem. The rule is
+ * duplicated from pi-model-system-prompt (index.ts) so both report the same file; keep them
+ * in step when it changes.
+ */
+function perModelFile(modelId: string | undefined): string | undefined {
+	if (!modelId) return undefined;
+	let names: string[];
+	try {
+		names = readdirSync(PROMPT_DIR);
+	} catch {
+		return undefined;
+	}
+
+	const id = modelId.toLowerCase();
+	const better = (stem: string, best: string) => {
+		if (stem.length !== best.length) return stem.length > best.length;
+		const exact = (s: string) => s === modelId.slice(0, s.length);
+		return exact(stem) !== exact(best) ? exact(stem) : stem < best;
+	};
+
+	let best: string | undefined;
+	for (const name of names) {
+		if (!name.toLowerCase().endsWith(".md")) continue;
+		const stem = name.slice(0, -3);
+		if (stem && id.startsWith(stem.toLowerCase()) && (best === undefined || better(stem, best))) best = stem;
+	}
+	return best === undefined ? undefined : join(PROMPT_DIR, `${best}.md`);
+}
```

One note for the docs pass: the spec's Implementation Decisions say "`glm-5.3.md` empty and
`glm.md` full means `glm-5.3` gets nothing; `glm-5.3-flash` still gets `glm.md`". Under the
longest-prefix rule as stated everywhere else in the spec, `glm-5.3` is also the longest prefix of
`glm-5.3-flash`, so that id resolves to the empty winner and gets nothing too. The test follows
the rule, not that sentence; the sentence looks like a slip and is left for the docs owner.
