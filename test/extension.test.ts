import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import type {
	BeforeAgentStartEvent,
	BeforeAgentStartEventResult,
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import modelSystemPrompts from "../index.ts";

/**
 * The handler shape this suite drives. pi's own `ExtensionHandler` also admits an async handler,
 * but this extension is synchronous, and the tests assert on the value it hands straight back.
 * Event, context and result types all come from pi.
 */
type BeforeAgentStart = (
	event: BeforeAgentStartEvent,
	ctx: ExtensionContext,
) => BeforeAgentStartEventResult | undefined;

type Handlers = Map<string, BeforeAgentStart>;

type PromptFixture = {
	/** The `model-system-prompt` directory under this run's temporary HOME. */
	dir: string;
	handlers: Handlers;
	write: (name: string, content: string) => void;
};

/**
 * Register the extension against a stub `pi` and hand back its handlers by event name.
 *
 * The stub carries only the one API method the extension calls. Asserting it through `unknown`
 * is the price of not fabricating the rest of `ExtensionAPI`; the context stub below is typed
 * for real, which is where a wrong shape would actually bite.
 */
function createHarness(): Handlers {
	const handlers: Handlers = new Map();
	const pi = { on: (name: string, handler: BeforeAgentStart) => handlers.set(name, handler) } as unknown as ExtensionAPI;
	modelSystemPrompts(pi);
	return handlers;
}

/**
 * The context the handler sees, derived from pi's own type: a member `ExtensionContext` does
 * not have is a compile error here, instead of a stub the tests quietly agree with.
 *
 * `Partial` because the handler reads exactly one field. The real handler signature demands a
 * whole `ExtensionContext`; `runBeforeAgentStart` widens this rather than both casting away the
 * check and inventing the other seventeen members.
 */
function createCtx(modelId: string | undefined): Partial<ExtensionContext> {
	return { model: modelId === undefined ? undefined : ({ id: modelId } as ExtensionContext["model"]) };
}

const runBeforeAgentStart = (handlers: Handlers, { modelId, systemPrompt = "BASE" }: { modelId?: string; systemPrompt?: string }) =>
	handlers.get("before_agent_start")!({ systemPrompt } as BeforeAgentStartEvent, createCtx(modelId) as ExtensionContext);

/** Point homedir() at a temp dir holding the given `modelId.md` files. */
function withPrompts(files: Record<string, string>, body: (fixture: PromptFixture) => void): void {
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

test("returns nothing when the prompt cannot be read", () => {
	withPrompts({}, ({ dir, handlers }) => {
		// A directory where the file should be: readFileSync throws EISDIR, standing in for any
		// unreadable-file case (permissions, wrong type) on a platform where chmod is a no-op.
		mkdirSync(join(dir, "glm-4.7-flash.md"));
		assert.equal(runBeforeAgentStart(handlers, { modelId: "glm-4.7-flash" }), undefined);
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
	const styleExtension = (pi: ExtensionAPI) =>
		pi.on("before_agent_start", (event: BeforeAgentStartEvent) => ({ systemPrompt: `${event.systemPrompt} [STYLE]` }));

	for (const [first, expected] of [
		// The later handler appends after the earlier one, so the interleaving follows load order.
		["style", "BASE [STYLE]\n\n[MODEL]"],
		["model", "BASE\n\n[MODEL] [STYLE]"],
	] as const) {
		const order = first === "style" ? ["style", "model"] : ["model", "style"];
		withPrompts({ "glm-4.7-flash.md": "[MODEL]" }, ({ handlers }) => {
			const styleHandlers: Handlers = new Map();
			styleExtension({ on: (name: string, handler: BeforeAgentStart) => styleHandlers.set(name, handler) } as unknown as ExtensionAPI);

			const run = (name: string, systemPrompt: string) =>
				(name === "style" ? styleHandlers : handlers).get("before_agent_start")!(
					{ systemPrompt } as BeforeAgentStartEvent,
					createCtx("glm-4.7-flash") as ExtensionContext,
				);

			// Both stubs always hand back a result, always with a systemPrompt, so these `!`s are
			// belt-and-braces rather than a live assumption: an undefined step fails the equality
			// check below, legibly.
			const step1 = run(order[0], "BASE")!;
			const step2 = run(order[1], step1.systemPrompt!)!;
			assert.equal(step2.systemPrompt, expected, `load order: ${order.join(" then ")}`);
		});
	}
});
