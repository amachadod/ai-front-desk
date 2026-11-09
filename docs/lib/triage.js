// Triage: turns a free-text AI idea into a structured request card.
// Everything here is deterministic rules, so it's testable and explainable. An optional AI mode
// (src/ai.js) can add a richer reading, but it can never lower a risk or skip a check made here.
import { normalize, words, similarity, hasPhrase, redact } from "./text.js";

const TEAM_WORDS = {
  Marketing: ["marketing", "campaign", "campaigns", "social", "content", "brand", "seo", "newsletter", "ads"],
  Sales: ["sales", "prospect", "prospects", "deal", "deals", "pipeline", "discovery", "leads", "quota"],
  Support: ["support", "ticket", "tickets", "help desk", "helpdesk", "agents", "customer questions"],
  "Customer success": ["customer success", "renewal", "renewals", "churn", "onboarding customers", "check-in", "qbr"],
  Finance: ["finance", "invoice", "invoices", "expenses", "budget approval", "accounting", "payments", "reconcile"],
  Operations: ["operations", "ops", "process", "internal", "handbook", "policy", "meetings"],
  Product: ["product", "feature requests", "roadmap", "release notes", "bugs"],
};

// Requests that would decide or influence outcomes for people go to a human, whatever else they say.
const PEOPLE_DECISIONS = [
  /\b(rank|score|screen|filter|shortlist|evaluate|rate|grade|assess)\w*\b[^.]{0,40}\b(candidates?|cvs?|resumes?|applicants?|employees?|staff|people|colleagues|agents?|reps?)\b/i,
  /\b(hire|hiring|fire|firing|dismiss\w*|promot\w*|layoffs?|redundanc\w*|salar\w*|bonus\w*|performance reviews?|disciplin\w*)\b/i,
  /\b(monitor|track|watch)\w*\b[^.]{0,30}\b(employees?|staff|colleagues|agents?|people)\b/i,
];
const NO_HUMAN = [/\b(automatically|auto)[- ]?(send|reply|replies|approve|publish|post)\w*\b/i, /\bwithout (a )?(human|anyone|review|checking)\b/i];
const PERSONAL = [/\bcustomer (list|lists|data|emails|database)\b/i, /\bpersonal data\b/i, /\b(health|medical|passport|national id|social security)\b/i, /\bhome address\w*\b/i];
const INTEGRATION = /\b(api|integrat\w*|connect\w*|sync\w*|hubspot|salesforce|zendesk|asana|slack|notion|webhook)\b/i;
const CUSTOMER_FACING = /\b(customer|customers|client|clients|revenue|churn|response time|first reply|renewal)\b/i;

export function hoursPerWeek(text) {
  const t = normalize(text).replace(/,/g, "");
  const m = t.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?)\b(?:\s+(?:a|per|each|every))?\s+(day|week|month)\b/);
  if (m) {
    let h = +m[1];
    if (/^m/.test(m[2])) h /= 60;
    if (m[3] === "day") h *= 5;
    if (m[3] === "month") h /= 4.33;
    const NUM = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    const ppl = t.match(/\b(\d+|two|three|four|five|six|seven|eight|nine|ten)\s+(people|agents|reps|of us|team members|managers)\b/);
    if (ppl && /\beach\b/.test(t)) h *= NUM[ppl[1]] || +ppl[1];
    return Math.round(h * 10) / 10;
  }
  if (/\b(hours|whole day|half a day|all day)\b/.test(t)) return null;
  return null;
}

function detectTeam(req) {
  if (req.team) return req.team;
  const scores = Object.entries(TEAM_WORDS).map(([team, ws]) => [team, ws.filter((w) => hasPhrase(`${req.title} ${req.text}`, w)).length]).sort((a, b) => b[1] - a[1]);
  return scores[0][1] ? scores[0][0] : null;
}

export function matchTool(text, tools) {
  const scored = tools.map((t) => {
    const hits = t.keywords.filter((k) => hasPhrase(text, k));
    const named = hasPhrase(text, t.name);
    return { tool: t, hits, score: hits.length + (named ? 3 : 0), named };
  }).sort((a, b) => b.score - a.score);
  return scored[0].score ? scored[0] : null;
}

export function findDuplicates(req, earlier, threshold = 0.35) {
  const me = `${req.title} ${req.text}`;
  return earlier.filter((o) => o.id !== req.id)
    .map((o) => ({ id: o.id, title: redact(o.title).text, score: Math.round(similarity(me, redact(`${o.title} ${o.text}`).text) * 100) / 100 }))
    .filter((d) => d.score >= threshold).sort((a, b) => b.score - a.score);
}

export function triage(req, { tools, earlier = [], threshold = 0.35 } = {}) {
  const red = redact(`${req.title || ""}\n${req.text || ""}`);
  const [title, ...rest] = red.text.split("\n");
  const text = rest.join("\n");
  const all = `${title} ${text}`;
  const plain = all.replace(/\[[a-z ]+ removed\]/gi, " "); // placeholders mustn't match tool keywords ("[email removed]")
  const team = detectTeam({ ...req, title, text });

  // Data sensitivity
  const found = Object.entries(red.found).filter(([, n]) => n).map(([k, n]) => `${n} ${k === "iban" ? "IBAN" : k === "secret" ? "secret" : k}${n > 1 ? "s" : ""}`);
  const personal = PERSONAL.filter((r) => r.test(all)).length > 0 || red.found.email > 1 || red.found.phone > 0;
  const sensitivity = red.found.secret ? "secrets" : red.found.iban || red.found.card ? "financial" : personal || red.found.email ? "personal" : "none";

  // Risk
  const reasons = [];
  if (PEOPLE_DECISIONS.some((r) => r.test(all))) reasons.push("It would decide or influence outcomes for people (hiring, pay, performance or monitoring). AI must not make those decisions.");
  const high = reasons.length > 0;
  if (sensitivity !== "none") reasons.push(`It contains or mentions ${sensitivity === "personal" ? "personal data" : sensitivity === "financial" ? "financial details" : "secrets"}${found.length ? ` (${found.join(", ")} removed)` : ""}.`);
  if (NO_HUMAN.some((r) => r.test(all))) reasons.push("It asks for something to be sent or published without a human check.");
  const risk = high ? "high" : reasons.length ? "medium" : "low";

  // Value and effort
  const hours = hoursPerWeek(all);
  let value = hours == null ? 2 : hours >= 10 ? 5 : hours >= 5 ? 4 : hours >= 2 ? 3 : 2;
  if (CUSTOMER_FACING.test(all)) value = Math.min(5, value + 1);
  const match = matchTool(plain, tools);
  let effort = match ? 1 : 3;
  if (INTEGRATION.test(all)) effort += 1;
  if (sensitivity !== "none") effort += 1;
  effort = Math.min(5, effort);
  const priority = value >= 4 && effort <= 2 ? "Quick win" : value >= 4 ? "Worth it" : effort <= 2 ? "Easy, small gain" : "Park for now";

  // What's missing
  const missing = [];
  if (words(text).length < 10) missing.push("What exactly is the problem? Describe one real example.");
  if (hours == null) missing.push("How often does this happen, and roughly how many hours a week does it take?");
  if (!team) missing.push("Which team is this for, and who would use it?");

  const duplicates = findDuplicates({ id: req.id, title, text }, earlier, threshold);

  let route;
  if (high) route = { type: "human-review", tool: match?.tool.id || null, reason: "Needs human review before anything else. Requests that affect decisions about people are never routed to a tool automatically." };
  else if (duplicates.length) route = { type: "duplicate", tool: match?.tool.id || null, of: duplicates[0].id, reason: `Looks like request ${duplicates[0].id} ("${duplicates[0].title}"). Merge them so the work happens once.` };
  else if (match) route = { type: "existing-tool", tool: match.tool.id, reason: `${match.tool.name} already does this: ${match.tool.does} Matched on: ${[...(match.named ? [match.tool.name] : []), ...match.hits].slice(0, 4).join(", ")}.`, confidence: Math.min(1, 0.4 + 0.15 * match.score) };
  else route = { type: "new", tool: null, reason: "No existing tool fits. Scope it as a new idea: one example, the people who'd use it, and how you'd know it worked." };

  if (route.tool) route.toolName = tools.find((t) => t.id === route.tool)?.name || route.tool;
  const status = route.type === "human-review" ? "Needs human review" : route.type === "duplicate" ? "Possible duplicate" : missing.length >= 2 ? "Needs info" : "Ready for approval";
  return {
    id: req.id, title, text, team, submittedBy: req.submittedBy || null, date: req.date || null,
    sensitivity, redacted: red.count > 0, removed: found, risk, riskReasons: reasons,
    hoursPerWeek: hours, value, effort, priority, missing, duplicates, route, status,
  };
}

// Triage a whole queue in order, so each request is compared with the ones before it.
export function triageAll(requests, opts) {
  const out = [];
  for (const r of requests) out.push(triage(r, { ...opts, earlier: requests.slice(0, requests.indexOf(r)) }));
  return out;
}
