# Preset research and writing

How a preset gets made: pick a harness, harvest its prompt text, judge every piece, write the file.
The decisions settled for every round live in `AGENTS.md` under **Preset research and writing**;
this file is the method. Read both before starting a round.

## A round's artifacts

| Artifact | Path |
| --- | --- |
| the dispatch prompt, verbatim, with its parameters | `.scratch/presets-<name>/research-brief.md` |
| one 抽证清单 per scope | `.scratch/presets-<name>/research/<scope>.md` |
| the preset | `presets/<id-prefix>.md` |
| the model list and source note | `README.md` and `README.zh-CN.md` |

`<name>` is the preset family (`kimi`, `deepseek-glm`, `claude-code`). The brief is a record of what
was actually sent, so a later reader can reproduce or dispute the round. Number the briefs when a
round has more than one (`research-brief-02.md`), and leave the earlier one in place.

## Source

The harness's own artifact and nothing else: its source checkout, or the shipped bundle or binary
when the product is closed. A third-party collection of the same text is a cross-check at most —
never the evidence, never the quote.

Pin the bytes: package version plus channel, tarball integrity, binary hash, commit sha and date.
Where the pin lives is settled in `AGENTS.md`.

The text is usually not where the product name suggests. Claude Code's system prompt is in the
platform package's binary (`@anthropic-ai/claude-code-win32-x64`), not in `@anthropic-ai/claude-code`,
which is a 28 KB installer. List what the package actually contains before hunting inside it.

## Reading a binary source

This machine has no `strings`. Locate with `grep -aboF '<literal>' <binary>`; read a span with

    node -e "process.stdout.write(require('fs').readFileSync('<binary>').subarray(OFF,OFF+LEN).toString('utf8'))"

The byte offset is the citation: `<binary>@<offset>`. Re-check every finished quote with `grep -aboF`
before the file is done — a quote that will not relocate to its offset is a wrong quote. Two traps:
the same text often sits in the binary in two or more copies (function-name tables, a second
entrypoint), so say which copy you quoted; and assembly is conditional, so the literal *and* the
branch selecting it are both evidence.

Enumerate to a closed set and say how. Find the assembly point, walk every element it can emit, and
list the gates that switch each one on. Then state what the sweep covered and what it did not, with
"searched and absent" kept separate from "not searched".

## The judgment rubric

A **candidate** is instruction text the model actually reads: system prompt sections, injected
reminders, guard text, subagent identity contracts, the behavioural rules inside tool descriptions
(not their parameter docs), skills that regulate how to work, and the prompts for one-shot tasks
like compaction.

Not candidates: code, types, tests and fixtures, i18n, UI copy, log and error strings, third-party
API manuals, this repo's own engineering conventions, README navigation, transport and packaging
text. Do not silently drop one that is arguable — put it in the table as 不借鉴 and name the category.

Ask two questions in order.

**First, does it change behaviour?** Answer in one sentence, in one of: communication and delivery,
verification and evidence, completion and blocker claims, task scope, autonomy and asking, safety
and untrusted content, irreversible actions and outside effects, output format, collaboration and
delegation, context and compaction. No answer means 不借鉴.

**Second, does it name a tool?** Check the name against pi's built-in tools — not against whatever
this session happens to have installed, since a preset ships to users who have only the base harness.
Then:

| The name refers to | Verdict | In the 理由 column |
| --- | --- | --- |
| nothing, or a pi capability (read, write, edit, shell, search) | 借鉴 / 剥离后借鉴 | for 剥离: the sentence in English with the name replaced by `{{read tool}}`, `{{edit tool}}`, `{{shell}}`, `{{search tool}}` |
| a tool or mechanism pi does not have (`TodoWrite`, `Task`, `WebFetch`, plan mode, hooks, permission modes, statusline, teams) | 不借鉴 | `点名了 pi 没有的能力：<name>` |

Two readings are wrong. "It is unrelated to our tool, so take it" — unrelated is not a reason; text
that is not a behavioural rule is 不借鉴 however general it reads. And "it names a tool, so drop it"
— naming decides *how* to take a rule, not whether. The usability line above is the one exception,
and it is why a rule naming a pi-absent tool is dropped rather than rewritten into a placeholder: a
shell around a rule the model cannot act on is noise in every prompt from then on.

## The 抽证清单 file

A table, `| 位置 | 偏移/行号 | 内容 | 判定 | 理由 |`, sorted by position, every candidate in it
including the ones whose every row is 不借鉴. The 内容 column is a verbatim excerpt — truncate with
`…`, mark `[概括]` when it can only be summarised, mark `[拼接]` and keep `${...}` placeholders
unevaluated when the source assembles the text. Then two closing sections: `## 判定自检` with the
rows most likely to be overturned and both readings, and `## 未覆盖` with what was not read.

## Dispatch

Two scopes in parallel works well: the main prompt assembly in one, the tool, subagent and utility
prompts in the other, with the seam decided up front (does it reach the system prompt through the
assembler? then it is the first scope) and neither child repeating the other's rows.

Dispatch parameters that matter: `agent: scout`, `skill: research`, the model and thinking level
fixed in `AGENTS.md`, `output` bound to the same path the child writes, and a task body that points
at the brief file rather than restating it. Then read the child's output file back — a child that returns
its report as chat instead of writing the file is common enough that the bound `output` is worth
having.

## Writing the preset file

Markdown, `# Section` headings, one rule per bullet, English, imperative. Capability phrasing rather
than tool names. No provenance header and no citations.

Take the structure from what the source does with its own tiers. Then check the result the way a
round always checks it: the twins byte-identical, and the diff between tiers exactly the section
that should differ.
