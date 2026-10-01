import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import modelSystemPrompts from "../index.ts";

/** Register the extension against a stub `pi` and hand back its handlers by event name. */
function createHarness() {
	const handlers = new Map();
	modelSystemPrompts({ on: (name, handler) => handlers.set(name, handler) });
	return handlers;
}

// Mirrors the real ExtensionContext: the active model is the `model` property, not a method.
// See ExtensionContext in pi's dist/core/extensions/types.d.ts.
function createCtx(modelId) {
	return { model: modelId === undefined ? undefined : { id: modelId } };
}

const runBeforeAgentStart = (handlers, { modelId, systemPrompt = "BASE" }) =>
	handlers.get("before_agent_start")({ systemPrompt }, createCtx(modelId));

/** Point homedir() at a temp dir holding the given `modelId.md` files. */
function withPrompts(files, body) {
	const home = mkdtempSync(join(tmpdir(), "model-system-prompts-"));
	const dir = join(home, ".pi", "agent", "model-system-prompt");
	mkdirSync(dir, { recursive: true });
	for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);

	const previousHome = process.env.HOME;
	const previousUserProfile = process.env.USERPROFILE;
	process.env.HOME = home;
	process.env.USERPROFILE = home;
	try {
		body({ dir, handlers: createHarness(), write: (name, content) => writeFileSync(join(dir, name), content) });
	} finally {
		if (previousHome === undefined) delete process.env.HOME;
		else process.env.HOME = previousHome;
		if (previousUserProfile === undefined) delete process.env.USERPROFILE;
		else process.env.USERPROFILE = previousUserProfile;
		rmSync(home, { recursive: true, force: true });
	}
}

test("appends the active model's file after the rendered prompt", () => {
	withPrompts({ "glm-4.7-flash.md": "Be terse." }, ({ handlers }) => {
		const result = runBeforeAgentStart(handlers, { modelId: "glm-4.7-flash" });
		assert.equal(result?.systemPrompt, "BASE\n\nBe terse.");
	});
});

test("delivers the file body whole: interior bytes reach the prompt unaltered", () => {
	// 40 blank-line-separated rules, each indented, so any truncation, reflow or re-indenting
	// shows up as a diff. The first line is unindented: the extension trims the file, so blank
	// edges are not content.
	const body = Array.from({ length: 40 }, (_, i) => `rule ${i}: keep the code boring.`)
		.map((line, i) => (i === 0 ? line : `  ${line}`))
		.join("\n\n");

	withPrompts({ "glm-4.7-flash.md": body }, ({ handlers }) => {
		const result = runBeforeAgentStart(handlers, { modelId: "glm-4.7-flash" });
		assert.equal(result?.systemPrompt, `BASE\n\n${body}`);
	});
});

test("model ids with dots and hyphens resolve to their file", () => {
	const id = "MiniMax-M3.1-Flash-Preview";
	withPrompts({ [`${id}.md`]: "Quote parameters." }, ({ handlers }) => {
		const result = runBeforeAgentStart(handlers, { modelId: id });
		assert.equal(result?.systemPrompt, "BASE\n\nQuote parameters.");
	});
});

test("returns nothing when the active model has no file", () => {
	withPrompts({ "glm-4.7-flash.md": "Be terse." }, ({ handlers }) => {
		assert.equal(runBeforeAgentStart(handlers, { modelId: "gemini-3.7-flash" }), undefined);
	});
});

test("returns nothing when the prompt directory does not exist", () => {
	withPrompts({}, ({ handlers }) => {
		assert.equal(runBeforeAgentStart(handlers, { modelId: "glm-4.7-flash" }), undefined);
	});
});

test("returns nothing for an empty or whitespace-only file", () => {
	withPrompts({ "a.md": "", "b.md": "  \n\t " }, ({ handlers }) => {
		assert.equal(runBeforeAgentStart(handlers, { modelId: "a" }), undefined);
		assert.equal(runBeforeAgentStart(handlers, { modelId: "b" }), undefined);
	});
});

test("returns nothing when no model is selected", () => {
	withPrompts({ "glm-4.7-flash.md": "Be terse." }, ({ handlers }) => {
		assert.equal(runBeforeAgentStart(handlers, { modelId: undefined }), undefined);
	});
});

test("reads the file fresh, so edits apply to the next run", () => {
	withPrompts({ "glm-4.7-flash.md": "First." }, ({ handlers, write }) => {
		assert.equal(runBeforeAgentStart(handlers, { modelId: "glm-4.7-flash" })?.systemPrompt, "BASE\n\nFirst.");
		write("glm-4.7-flash.md", "Second.");
		assert.equal(runBeforeAgentStart(handlers, { modelId: "glm-4.7-flash" })?.systemPrompt, "BASE\n\nSecond.");
	});
});

test("composes with another force-appending extension in either load order", () => {
	// Stands in for any extension (ponytail today) that force-appends on every run.
	const styleExtension = (pi) => pi.on("before_agent_start", (event) => ({ systemPrompt: `${event.systemPrompt} [STYLE]` }));

	for (const [first, expected] of [
		// The later handler appends after the earlier one, so the interleaving follows load order.
		["style", "BASE [STYLE]\n\n[MODEL]"],
		["model", "BASE\n\n[MODEL] [STYLE]"],
	]) {
		const order = first === "style" ? ["style", "model"] : ["model", "style"];
		withPrompts({ "glm-4.7-flash.md": "[MODEL]" }, ({ handlers }) => {
			const styleHandlers = new Map();
			styleExtension({ on: (name, handler) => styleHandlers.set(name, handler) });

			const run = (name, event) =>
				(name === "style" ? styleHandlers : handlers).get("before_agent_start")(event, createCtx("glm-4.7-flash"));

			const step1 = run(order[0], { systemPrompt: "BASE" });
			const step2 = run(order[1], { systemPrompt: step1.systemPrompt });
			assert.equal(step2.systemPrompt, expected, `load order: ${order.join(" then ")}`);
		});
	}
});
