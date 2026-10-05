import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { installPresets } from "../install-presets.mjs";

/** A temp stand-in for `presets/`, plus a temp stand-in for the user's prompt directory. */
function withDirs(body: (dirs: { presets: string; target: string; put: (name: string, content: string) => void }) => void) {
	const root = mkdtempSync(join(tmpdir(), "install-presets-"));
	const presets = join(root, "presets");
	const target = join(root, "user");
	mkdirSync(presets, { recursive: true });
	try {
		body({
			presets,
			target,
			put: (name: string, content: string) => writeFileSync(join(presets, name), content),
		});
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

test("copies a preset into a target directory that does not exist yet", () => {
	withDirs(({ presets, target, put }) => {
		put("m.md", "PRESET BODY");
		assert.equal(existsSync(target), false, "precondition: target is absent");

		assert.deepEqual(installPresets(target, presets), { copied: ["m.md"], skipped: [] });
		assert.equal(readFileSync(join(target, "m.md"), "utf8"), "PRESET BODY");
	});
});

test("never overwrites a file the user already has, edited or not", () => {
	withDirs(({ presets, target, put }) => {
		put("m.md", "PRESET BODY");
		mkdirSync(target, { recursive: true });
		writeFileSync(join(target, "m.md"), "USER EDITED THIS");

		assert.deepEqual(installPresets(target, presets), { copied: [], skipped: ["m.md"] });
		assert.equal(readFileSync(join(target, "m.md"), "utf8"), "USER EDITED THIS");
	});
});

test("copies only the missing presets and reports both sets", () => {
	withDirs(({ presets, target, put }) => {
		put("a.md", "A");
		put("b.md", "B");
		put("notes.txt", "not a prompt");
		mkdirSync(target, { recursive: true });
		writeFileSync(join(target, "a.md"), "MINE");

		const result = installPresets(target, presets);
		assert.deepEqual(result.copied, ["b.md"]);
		assert.deepEqual(result.skipped, ["a.md"]);
		assert.equal(readFileSync(join(target, "a.md"), "utf8"), "MINE");
		assert.equal(existsSync(join(target, "notes.txt")), false, "only .md files are prompts");
	});
});

test("installing twice is idempotent, and the shipped preset is a real file", () => {
	withDirs(({ presets, target, put }) => {
		put("m.md", "PRESET BODY");
		installPresets(target, presets);
		assert.deepEqual(installPresets(target, presets), { copied: [], skipped: ["m.md"] });
		assert.equal(readFileSync(join(target, "m.md"), "utf8"), "PRESET BODY");
	});

	const shipped = join(import.meta.dirname, "..", "presets", "MiniMax-M3.1-Flash-Preview.md");
	assert.equal(existsSync(shipped), true, "the preset is in the repo, not only in the user directory");
});

test("the documented command seeds a fresh home directory through the real entry point", () => {
	// USERPROFILE is what os.homedir() reads on win32, HOME everywhere else: set both, and point
	// them at a temp dir so this test cannot write into the developer's real home directory.
	const fakeHome = mkdtempSync(join(tmpdir(), "install-presets-home-"));
	const name = "MiniMax-M3.1-Flash-Preview.md";
	const seeded = join(fakeHome, ".pi", "agent", "model-system-prompt", name);
	try {
		const run = spawnSync(process.execPath, ["install-presets.mjs"], {
			cwd: join(import.meta.dirname, ".."),
			env: { ...process.env, USERPROFILE: fakeHome, HOME: fakeHome },
			encoding: "utf8",
		});

		assert.equal(run.status, 0, run.stderr);
		assert.match(run.stdout, /installed\s+MiniMax-M3\.1-Flash-Preview\.md/);
		assert.equal(existsSync(seeded), true, "the preset landed in the redirected home");
		assert.deepEqual(
			readFileSync(seeded),
			readFileSync(join(import.meta.dirname, "..", "presets", name)),
		);
	} finally {
		rmSync(fakeHome, { recursive: true, force: true });
	}
});
