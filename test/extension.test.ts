import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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

test("a family file serves an id with no file of its own", () => {
	withPrompts({ "glm.md": "Family text." }, ({ handlers }) => {
		const result = runBeforeAgentStart(handlers, { modelId: "glm-5.3-flash" });
		assert.equal(result?.systemPrompt, "BASE\n\nFamily text.");
	});
});

test("the exact file wins over a shorter family file", () => {
	withPrompts({ "glm.md": "Family text.", "glm-5.3.md": "Exact text." }, ({ handlers }) => {
		const result = runBeforeAgentStart(handlers, { modelId: "glm-5.3" });
		assert.equal(result?.systemPrompt, "BASE\n\nExact text.");
	});
});

test("the longest of three candidates wins", () => {
	const files = { "glm.md": "One.", "glm-5.3.md": "Two.", "glm-5.3-flash.md": "Three." };
	withPrompts(files, ({ handlers }) => {
		const result = runBeforeAgentStart(handlers, { modelId: "glm-5.3-flash-2" });
		assert.equal(result?.systemPrompt, "BASE\n\nThree.");
	});
});

test("an empty winner suppresses the family file and does not fall back", () => {
	withPrompts({ "glm.md": "Family text.", "glm-5.3.md": "" }, ({ handlers }) => {
		assert.equal(runBeforeAgentStart(handlers, { modelId: "glm-5.3" }), undefined);
		// "glm-5.3" is still the longest prefix of "glm-5.3-flash", so it is that id's winner too.
		assert.equal(runBeforeAgentStart(handlers, { modelId: "glm-5.3-flash" }), undefined);
	});
});

test("a whitespace-only winner suppresses the family file", () => {
	withPrompts({ "glm.md": "Family text.", "glm-5.3.md": "  \n\t " }, ({ handlers }) => {
		assert.equal(runBeforeAgentStart(handlers, { modelId: "glm-5.3" }), undefined);
	});
});

test("an unreadable winner does not fall back to the family file", () => {
	withPrompts({ "glm.md": "Family text." }, ({ dir, handlers }) => {
		mkdirSync(join(dir, "glm-5.3.md"));
		assert.equal(runBeforeAgentStart(handlers, { modelId: "glm-5.3" }), undefined);
	});
});

test("matches the model id case-insensitively", () => {
	withPrompts({ "MiniMax-M3.md": "Be terse." }, ({ handlers }) => {
		assert.equal(runBeforeAgentStart(handlers, { modelId: "minimax-m3" })?.systemPrompt, "BASE\n\nBe terse.");
	});
});

test("a file named .md is not a candidate, being an empty prefix", () => {
	withPrompts({ ".md": "Nothing.", "g.md": "Geen." }, ({ handlers }) => {
		assert.equal(runBeforeAgentStart(handlers, { modelId: "glm-5.3" })?.systemPrompt, "BASE\n\nGeen.");
	});
});

test("names differing only in case break to the id's own casing, then to the first stem", (t) => {
	// Only a case-sensitive filesystem can hold two names that differ only in case; where it
	// cannot, the second write lands on the first file and there is no tie to break, so the
	// whole case is skipped rather than asserting a name that could not exist.
	let caseSensitive = false;
	withPrompts({}, ({ dir, write }) => {
		write("probe.md", "a");
		write("PROBE.md", "b");
		caseSensitive = readdirSync(dir).includes("PROBE.md");
	});
	if (!caseSensitive) {
		t.diagnostic("this filesystem cannot hold two names differing only in case; the case did not run");
		return;
	}

	withPrompts({ "gLM-5.3.md": "Mixed case.", "GLM-5.3.md": "Upper case.", "glm-5.3.md": "Lower case." }, ({ handlers }) => {
		// The stem whose casing matches the id wins, whatever readdir handed over first.
		assert.equal(runBeforeAgentStart(handlers, { modelId: "glm-5.3" })?.systemPrompt, "BASE\n\nLower case.");
		assert.equal(runBeforeAgentStart(handlers, { modelId: "GLM-5.3" })?.systemPrompt, "BASE\n\nUpper case.");
		// No stem's casing equals the id, so the lexicographically first stem wins. In code-unit
		// order 'G' (0x47) sorts before 'g' (0x67), so "GLM-5.3" comes first of the three.
		assert.equal(runBeforeAgentStart(handlers, { modelId: "gLm-5.3" })?.systemPrompt, "BASE\n\nUpper case.");
	});
	withPrompts({ "gLM-5.3.md": "Mixed case.", "glM-5.3.md": "Other mixed case." }, ({ handlers }) => {
		// No stem's casing matches the id, so the lexicographically first stem wins: "gLM" before "glM".
		assert.equal(runBeforeAgentStart(handlers, { modelId: "Glm-5.3" })?.systemPrompt, "BASE\n\nMixed case.");
	});
});

test("the prefix is raw, so glm.md serves glmish-2 with no separator", () => {
	// Pinned on purpose: the spec accepts a raw prefix as the cost of the simplest rule, so a
	// file claiming ids it was not named for is the feature working, not a bug to repair here.
	withPrompts({ "glm.md": "Family text." }, ({ handlers }) => {
		assert.equal(runBeforeAgentStart(handlers, { modelId: "glmish-2" })?.systemPrompt, "BASE\n\nFamily text.");
	});
});

test("an upper-case extension is a candidate, and is read under the name on disk", () => {
	// The winner is the listed entry, not a rebuilt `${stem}.md`: rebuilding would ask for
	// "glm.md", which does not exist here beside "GLM.MD" on a case-sensitive filesystem.
	withPrompts({ "GLM.MD": "Upper extension." }, ({ handlers }) => {
		assert.equal(runBeforeAgentStart(handlers, { modelId: "glm" })?.systemPrompt, "BASE\n\nUpper extension.");
	});
});

test("an id with a slash resolves to the flat file, never a nested one", () => {
	// The flat listing is the whole rule, so a prompt file in a subdirectory is invisible.
	withPrompts({ "openai.md": "Flat text." }, ({ dir, handlers }) => {
		mkdirSync(join(dir, "openai"));
		writeFileSync(join(dir, "openai", "gpt-4.md"), "Nested text.");
		assert.equal(runBeforeAgentStart(handlers, { modelId: "openai/gpt-4" })?.systemPrompt, "BASE\n\nFlat text.");
	});
	withPrompts({}, ({ dir, handlers }) => {
		mkdirSync(join(dir, "openai"));
		writeFileSync(join(dir, "openai", "gpt-4.md"), "Nested text.");
		assert.equal(runBeforeAgentStart(handlers, { modelId: "openai/gpt-4" }), undefined);
	});
});

test("resolution is per run and uncached: a new longer file wins on the next call", () => {
	withPrompts({ "glm-5.3.md": "Family text." }, ({ handlers, write }) => {
		assert.equal(runBeforeAgentStart(handlers, { modelId: "glm-5.3" })?.systemPrompt, "BASE\n\nFamily text.");
		write("glm-5.3-flash.md", "Flash text.");
		assert.equal(runBeforeAgentStart(handlers, { modelId: "glm-5.3-flash" })?.systemPrompt, "BASE\n\nFlash text.");
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
