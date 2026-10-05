/**
 * Copies the shipped presets into the user's prompt directory.
 *
 * `pi install .` only records the project path, so this cannot ride along as an npm lifecycle
 * script — it is an explicit `npm run install-presets` instead. Deliberate: a postinstall hook
 * would also fire on any later `npm install` and put back a preset the user deleted, and deleting
 * the file is how a user turns a model off.
 *
 * A file already in the target directory is the user's, whether or not they edited it, so it is
 * never overwritten. There is no manifest and no state file: what is on disk is the truth.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** The user's prompt directory — the same one the extension reads on every run. */
export const targetDir = () => join(homedir(), ".pi", "agent", "model-system-prompt");

/**
 * Copy every `presets/*.md` into `target`, skipping names that are already there.
 * @returns {{ copied: string[], skipped: string[] }} the basenames, sorted
 */
export function installPresets(target = targetDir(), presets = join(HERE, "presets")) {
	mkdirSync(target, { recursive: true });

	const names = readdirSync(presets)
		.filter((name) => name.endsWith(".md"))
		.sort();

	const copied = [];
	const skipped = [];
	for (const name of names) {
		const dest = join(target, name);
		if (existsSync(dest)) {
			skipped.push(name);
		} else {
			copyFileSync(join(presets, name), dest);
			copied.push(name);
		}
	}
	return { copied, skipped };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const { copied, skipped } = installPresets();
	if (!copied.length && !skipped.length) console.log(`No presets found. Source: ${join(HERE, "presets")}`);
	for (const name of copied) console.log(`installed  ${name}`);
	for (const name of skipped) console.log(`kept       ${name} (already there, left alone)`);
}
