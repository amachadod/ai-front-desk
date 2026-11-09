// npm run triage -- "Title" "What the problem is, an example, and how long it takes"
// Triages one request with the rules. With AI_MODE=true and a key, Claude adds a reading on top.
import { loadHub, loadDotEnv, getConfig } from "../src/config.js";
import { triage } from "../src/triage.js";
import { classifyWithClaude, mergeAi } from "../src/ai.js";

loadDotEnv();
const hub = loadHub();
const config = getConfig();
const [title, ...rest] = process.argv.slice(2);
if (!title) { console.error('Usage: npm run triage -- "Title" "Description"'); process.exit(1); }
let card = triage({ id: "R-NEW", title, text: rest.join(" ") }, { tools: hub.tools, threshold: hub.duplicateThreshold });
if (config.aiMode) {
  try { card = mergeAi(card, await classifyWithClaude(card, { tools: hub.tools, teams: hub.teams, apiKey: config.anthropicKey, model: config.model }), hub.tools, hub.teams); }
  catch (e) { console.error(`AI mode skipped: ${e.message}. Showing the rules' result.`); }
}
console.log(JSON.stringify(card, null, 2));
