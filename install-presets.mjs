/**
 * Copies the shipped presets into the user's prompt directory.
 *
 * Two callers, one behaviour:
 *   - the package's `postinstall` hook, so that `pi install npm:pi-model-system-prompt` is the whole
 *     of install: pi runs npm install for the package and npm runs this. npm runs it once per
 *     installed version, and an already-satisfied dependency is left alone, so a preset the user
 *     deleted is not put back by a later install.
 *   - `npm run install-presets`, for a dev checkout, which pi loads from source and npm never
 *     installs. A plain `npm install` in the checkout also runs the hook, since npm runs the root
 *     project's own postinstall.
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
	// A package without its presets is not an install failure: seeding nothing is a no-op, and a
	// postinstall that throws would fail the user's whole `pi install`.
	if (!existsSync(presets)) return { copied: [], skipped: [] };

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
