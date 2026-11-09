// The hub's name, its tools and its settings live in hub.config.json, so renaming the project is one edit.
import { readFileSync, existsSync } from "node:fs";

export const loadHub = (path = new URL("../hub.config.json", import.meta.url)) => JSON.parse(readFileSync(path, "utf8"));

// Tiny .env loader so the project has zero dependencies.
export function loadDotEnv(path = ".env") {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

export function getConfig(env = process.env) {
  return {
    anthropicKey: env.ANTHROPIC_API_KEY || "",
    model: env.CLAUDE_MODEL || "claude-sonnet-5-5",
    aiMode: env.AI_MODE === "true",
  };
}
