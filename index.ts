/**
 * pi-model-system-prompt
 *
 * Appends a per-model system prompt to every run. The text for the active model is
 * read from ~/.pi/agent/model-system-prompt/, choosing the file whose name is the longest
 * case-insensitive prefix of the model id; no file means no injection.
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

import { readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

function promptsDir(): string {
	return join(homedir(), ".pi", "agent", "model-system-prompt");
}

/**
 * The prompt file the model id resolves to: the longest case-insensitive filename prefix
 * of the id. The directory is listed rather than probed because case-insensitivity has to
 * hold on Linux, where an exact-case probe cannot see a mis-cased name. A `.md` with an
 * empty stem is not a candidate, and ties (only possible on a case-sensitive filesystem,
 * where two names may differ only in case) go to the stem whose casing matches the id, then
 * to the lexicographically first, so the answer never depends on readdir order. The exact
 * file needs no branch: no longer name can prefix the id it is compared against.
 */
function promptFileFor(dir: string, modelId: string): string | undefined {
	let names: string[];
	try {
		names = readdirSync(dir);
	} catch {
		return undefined; // no prompt directory
	}

	const id = modelId.toLowerCase();
	const better = (stem: string, best: string) => {
		if (stem.length !== best.length) return stem.length > best.length;
		const exact = (s: string) => s === modelId.slice(0, s.length);
		return exact(stem) !== exact(best) ? exact(stem) : stem < best;
	};

	let best: string | undefined;
	let bestName: string | undefined;
	for (const name of names) {
		if (!name.toLowerCase().endsWith(".md")) continue;
		const stem = name.slice(0, -3);
		if (stem && id.startsWith(stem.toLowerCase()) && (best === undefined || better(stem, best))) {
			best = stem;
			bestName = name;
		}
	}
	// The listed name, not `${best}.md`: a candidate may be mis-cased in its extension
	// ("GLM.MD"), and rebuilding would then read a file that does not exist on a
	// case-sensitive filesystem — the winner would resolve and then read as missing.
	return bestName === undefined ? undefined : join(dir, bestName);
}

export default function modelSystemPrompts(pi: ExtensionAPI) {
	pi.on("before_agent_start", (event, ctx) => {
		// `ctx.model`, not `ctx.getModel()`: on the real ExtensionContext the active model is a
		// property. Reading it per run is what makes a mid-session model switch take effect.
		const modelId = ctx.model?.id;
		if (!modelId) return;

		// The winner is chosen by name alone, so an empty or unreadable one means off — no
		// shorter candidate is consulted. Unreadable is a no-op like every other form of
		// absence, not an error: a permissions slip on the user's side must not break their run.
		const file = promptFileFor(promptsDir(), modelId);
		if (!file) return;

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
