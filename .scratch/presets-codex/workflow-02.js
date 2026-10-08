// 调研 02 的派遣脚本：四个并行 scope，各写各的清单文件。
// 用法（主代理）：subagent({ workflow: "./.scratch/presets-codex/workflow-02.js", async: true, timeoutMs: 3600000 })
const BRIEF = "D:/project/pi-extension/model-system-prompt/.scratch/presets-codex/research-brief-02.md";
const MODEL = "minimax-cn/MiniMax-M3.1-Flash-Preview:high";

const SCOPES = [
	{
		key: "A-5-6",
		scope: "Scope A（gpt-5.6 主提示词，1 份文本）",
		output: "D:/project/pi-extension/model-system-prompt/.scratch/presets-codex/research/instructions-5-6.md",
	},
	{
		key: "B-6-luna-sol",
		scope: "Scope B（gpt-6-luna + gpt-6-sol 主提示词，2 份文本）",
		output: "D:/project/pi-extension/model-system-prompt/.scratch/presets-codex/research/instructions-6-luna-sol.md",
	},
	{
		key: "C-6-astra-6-1-sol",
		scope: "Scope C（gpt-6-astra + gpt-6.1-sol 主提示词，2 份文本）",
		output:
			"D:/project/pi-extension/model-system-prompt/.scratch/presets-codex/research/instructions-6-astra-6-1-sol.md",
	},
	{
		key: "D-tools-layers",
		scope: "Scope D（工具说明 + 附加层提示词）",
		output: "D:/project/pi-extension/model-system-prompt/.scratch/presets-codex/research/tools-and-layers.md",
	},
];

const results = await runs.all(
	SCOPES.map((s) => ({
		key: s.key,
		label: "调研 02 · " + s.scope,
		agent: "scout",
		skill: "research",
		model: MODEL,
		output: s.output,
		task: [
			"执行调研任务：读取并严格按 " + BRIEF + " 完成你负责的 scope。",
			"你负责 " + s.scope + "。",
			"输出文件（只写这一个，绝对路径）：" + s.output,
			"brief 里的「已定决策」「工具名对照表」「共同部分」「本轮特有的源与读取方法」「硬约束」全部适用。",
		].join("\n"),
	})),
);

return results.map((r) => ({
	key: r.key,
	ok: r.ok,
	outputReference: r.outputReference,
	outputPath: r.outputPath,
	error: r.error,
}));
