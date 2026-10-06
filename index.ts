/**
 * pi-model-system-prompt
 *
 * Appends a per-model system prompt to every run. The text for the active model is
 * read from ~/.pi/agent/model-system-prompt/<modelId>.md; no file means no injection.
 *
 * Why force-append instead of a structured section: once any handler sets
 * `forceSystemPrompt`, `buildSystemPromptState()` returns that text alone and drops
 * every section. Ponytail force-appends on every run, so a section set here would be
 * recorded in the transcript and never reach the model. Reading `event.systemPrompt`
 * (the prompt as currently rendered) and appending composes with any other extension
 * regardless of load order.
 *
 * Read per run, so editing a .md takes effect on the next message with no /reload.
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

function promptsDir(): string {
	return join(homedir(), ".pi", "agent", "model-system-prompt");
}

export default function modelSystemPrompts(pi: ExtensionAPI) {
	pi.on("before_agent_start", (event, ctx) => {
		// `ctx.model`, not `ctx.getModel()`: on the real ExtensionContext the active model is a
		// property. Reading it per run is what makes a mid-session model switch take effect.
		const modelId = ctx.model?.id;
		if (!modelId) return;

		const file = join(promptsDir(), `${modelId}.md`);
		if (!existsSync(file)) return;

		// Unreadable is a no-op like every other form of absence, not an error: a permissions
		// slip on the user's side must not break their run.
		let text: string;
		try {
			text = readFileSync(file, "utf8");
		} catch {
			return;
		}
		text = text.trim();
		if (!text) return;

		return { systemPrompt: `${event.systemPrompt}\n\n${text}` };
	});
}
