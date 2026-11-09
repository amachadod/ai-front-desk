// npm run demo: triages the 20 sample requests, walks the main story through approval, and prints the dashboard.
import { loadHub } from "../src/config.js";
import { triageAll } from "../src/triage.js";
import { decide } from "../src/approval.js";
import { dashboard } from "../src/metrics.js";
import { parsePrompts, promptsFor } from "../src/kit.js";
import { sample } from "./data.js";

const hub = loadHub();
const { requests, usage, promptsMd } = sample();
const cards = triageAll(requests, { tools: hub.tools, threshold: hub.duplicateThreshold });
console.log(`${hub.name}: ${hub.tagline}\n${hub.companyNote}\n`);
for (const c of cards) console.log(`${c.id}  ${c.status.padEnd(19)} ${(c.route.tool || "new idea").padEnd(12)} risk ${c.risk.padEnd(6)} ${c.priority.padEnd(16)} ${c.title}`);
const story = cards[0];
const tool = hub.tools.find((t) => t.id === story.route.tool);
console.log(`\nStory: "${story.title}" → ${tool.name}. ${story.route.reason}`);
console.log(decide(story, { decision: "approve", reason: "Clear time saving, low risk, tool already exists.", by: "Head of Customer Success" }));
console.log("Prompts from the kit:", promptsFor(parsePrompts(promptsMd), { tool: tool.id, team: story.team }).map((p) => p.title).join("; "));
const d = dashboard(usage);
console.log(`\nDashboard (${d.label}): adoption ${d.current.adoptionRate}%, ${d.current.activeUsers} active users, ${d.current.hoursSaved} hours saved this week, ${d.current.rejectedShare}% rejected, satisfaction ${d.current.satisfaction}/5.\nWhat I'd do: ${d.action}`);
