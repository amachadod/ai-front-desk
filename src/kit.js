// Reads the adoption kit's prompt library (kit/prompt-library.md) so each route can show its prompts.

export function parsePrompts(md) {
  const out = [];
  for (const block of String(md).split(/^### /m).slice(1)) {
    const [titleLine, ...lines] = block.split("\n");
    const field = (name) => {
      const i = lines.findIndex((l) => l.toLowerCase().startsWith(`- **${name.toLowerCase()}:**`));
      if (i < 0) return "";
      const first = lines[i].replace(/^- \*\*[^*]+:\*\*\s*/, "");
      const more = [];
      for (let j = i + 1; j < lines.length && !/^- \*\*/.test(lines[j]) && !/^#/.test(lines[j]); j++) more.push(lines[j].replace(/^\s{2}/, ""));
      return [first, ...more].join("\n").trim();
    };
    out.push({
      title: titleLine.trim(),
      teams: field("Teams").split(",").map((s) => s.trim()).filter(Boolean),
      tool: field("Tool").toLowerCase() || null,
      when: field("When to use"),
      prompt: field("Prompt"),
      example: field("Example"),
      check: field("Check before you send"),
    });
  }
  return out;
}

export function promptsFor(prompts, { tool, team }) {
  const byTool = prompts.filter((p) => p.tool === tool);
  const byTeam = prompts.filter((p) => !byTool.includes(p) && team && p.teams.includes(team));
  return [...byTool, ...byTeam].slice(0, 3);
}
