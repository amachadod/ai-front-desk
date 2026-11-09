import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { loadHub } from "../src/config.js";
import { redact, similarity } from "../src/text.js";
import { triage, triageAll, hoursPerWeek, matchTool } from "../src/triage.js";
import { decide, decisionCounts } from "../src/approval.js";
import { dashboard, weekStats } from "../src/metrics.js";
import { parsePrompts, promptsFor } from "../src/kit.js";
import { mergeAi, classifyWithClaude, buildPrompt } from "../src/ai.js";
import { sample } from "../scripts/data.js";

const hub = loadHub();
const { requests, usage, promptsMd } = sample();
const opts = { tools: hub.tools, threshold: hub.duplicateThreshold };
const cards = triageAll(requests, opts);
const card = (id) => cards.find((c) => c.id === id);

test("redaction removes IBANs, card numbers, emails, phone numbers and keys", () => {
  const r = redact("Paid to IBAN DE89 3704 0044 0532 0130 00, card 4111 1111 1111 1111, ana@x.example, +351 912 345 678, key sk-ant-abcdefghijklmnop1234, password: hunter2. Order 1234 5678.");
  assert.deepEqual(r.found, { iban: 1, card: 1, email: 1, phone: 1, secret: 2 });
  assert.ok(!/DE89|4111|ana@|912 345|sk-ant|hunter2/.test(r.text));
  assert.match(r.text, /Order 1234 5678/);
});

test("the story request is routed to Minuta with a plain reason and a demo link", () => {
  const c = card("R-101");
  assert.equal(c.status, "Ready for approval");
  assert.equal(c.route.tool, "minuta");
  assert.match(c.route.reason, /^Minuta already does this/);
  assert.equal(c.hoursPerWeek, 6);
  assert.equal(c.risk, "low");
  assert.equal(hub.tools.find((t) => t.id === c.route.tool).demo, "https://amachadod.github.io/minuta/");
});

test("every tool in the suite is reachable by a request", () => {
  const routed = new Set(cards.map((c) => c.route.tool).filter(Boolean));
  for (const t of hub.tools) assert.ok(routed.has(t.id), t.id);
  assert.equal(matchTool("can we use Signalpost for the launch?", hub.tools).tool.id, "signalpost");
  assert.equal(matchTool("translate articles into Spanish", hub.tools), null);
});

test("vague requests ask for what's missing instead of guessing", () => {
  const c = card("R-116");
  assert.equal(c.status, "Needs info");
  assert.ok(c.missing.some((q) => /real example/.test(q)));
  assert.ok(c.missing.some((q) => /hours a week/.test(q)));
  assert.equal(hoursPerWeek("90 minutes a day"), 7.5);
  assert.equal(hoursPerWeek("12 hours a month"), 2.8);
  assert.equal(hoursPerWeek("Four of us each spend 30 minutes a week"), 2);
});

test("duplicates are found and point to the earlier request", () => {
  assert.equal(card("R-102").route.type, "duplicate");
  assert.equal(card("R-102").route.of, "R-101");
  assert.equal(card("R-113").route.of, "R-104");
  assert.ok(similarity("summarise customer calls into tasks", "turn customer call notes into tasks") > 0.3);
  assert.equal(cards.filter((c) => c.route.type === "duplicate").length, 2);
});

test("sensitive data is flagged and redacted before it is shown or stored", () => {
  const iban = card("R-106");
  assert.equal(iban.sensitivity, "financial");
  assert.equal(iban.risk, "medium");
  assert.ok(iban.redacted && !iban.text.includes("DE89"));
  const list = card("R-112");
  assert.equal(list.sensitivity, "personal");
  assert.ok(!/@|912 345/.test(list.text));
  assert.equal(list.route.tool, null, "placeholders like [email removed] don't route to the email tool");
  assert.ok(!JSON.stringify(cards).includes("DE89 3704"));
});

test("requests that affect decisions about people always go to human review", () => {
  for (const id of ["R-105", "R-114"]) {
    assert.equal(card(id).status, "Needs human review", id);
    assert.equal(card(id).risk, "high", id);
  }
  const t = triage({ id: "X", title: "Use AI to decide who gets a promotion", text: "Rank our engineers by output." }, opts);
  assert.equal(t.route.type, "human-review");
  assert.match(card("R-111").riskReasons.join(" "), /without a human check/);
});

test("approval needs a person, a reason, and extra care for risky requests", () => {
  const now = new Date("2026-11-09T10:00:00Z");
  assert.throws(() => decide(card("R-101"), { decision: "approve", reason: "", by: "Head of CS" }), /reason/);
  assert.throws(() => decide(card("R-101"), { decision: "approve", reason: "Looks good to me", by: "" }), /who is deciding/);
  assert.throws(() => decide(card("R-116"), { decision: "approve", reason: "Looks good to me", by: "CFO" }), /missing information/);
  assert.throws(() => decide(card("R-102"), { decision: "approve", reason: "Looks good to me", by: "Sales lead" }), /duplicate of R-101/);
  assert.throws(() => decide(card("R-105"), { decision: "approve", reason: "Saves screening time", by: "Hiring manager" }), /High-risk/);
  const ok = decide(card("R-101"), { decision: "approve", reason: "Clear saving, tool exists", by: "Head of CS" }, now);
  assert.equal(ok.outcome, "Approved");
  assert.equal(ok.next, "Roll out Minuta to the team with the adoption kit.");
  const no = decide(card("R-105"), { decision: "decline", reason: "AI must not rank applicants", by: "Head of People" }, now);
  assert.deepEqual(decisionCounts([ok, no]), { Approved: 1, "Changes requested": 0, Declined: 1 });
});

test("dashboard numbers are computed from the data and labelled illustrative", () => {
  const d = dashboard(usage);
  assert.equal(d.label, "Illustrative sample data");
  assert.equal(d.current.activeUsers, 34);
  assert.equal(d.current.adoptionRate, 56.7);
  assert.equal(d.current.hoursSaved, 71.7);
  assert.equal(d.current.rejectedShare, 9.5);
  assert.equal(d.current.satisfaction, 4.1);
  assert.equal(d.trend.length, 8);
  assert.match(d.action, /^posta: 18.3% of outputs are rejected/);
  const w = weekStats({ week: "w", activeUsers: 5, outputs: 10, edited: 2, rejected: 1, minutesSaved: 90, ratings: { 5: 1, 3: 1 } }, 20);
  assert.deepEqual([w.adoptionRate, w.acceptedShare, w.hoursSaved, w.satisfaction], [25, 70, 1.5, 4]);
  assert.throws(() => dashboard({ weeks: [] }), /No usage data/);
});

test("the adoption kit exists, is labelled, and gives each route its prompts", () => {
  const prompts = parsePrompts(promptsMd);
  assert.ok(prompts.length >= 10 && prompts.length <= 15);
  assert.ok(prompts.every((p) => p.when && p.prompt && p.example && p.check));
  assert.deepEqual(promptsFor(prompts, { tool: "minuta", team: "Sales" }).map((p) => p.tool).slice(0, 2), ["minuta", "minuta"]);
  const kit = readdirSync(new URL("../kit/", import.meta.url));
  for (const f of ["prompt-library.md", "training-outline.md", "onboarding-checklist.md", "responsible-ai-policy.md"]) assert.ok(kit.includes(f), f);
  assert.match(readFileSync(new URL("../kit/training-outline.md", import.meta.url), "utf8"), /Designed, not yet delivered to a team/);
});

test("AI mode is optional, sees only redacted text, and can raise but never lower a risk", async () => {
  const c = card("R-106");
  const { user } = buildPrompt(c, hub.tools, hub.teams);
  assert.ok(!user.includes("DE89"));
  assert.equal(mergeAi(card("R-105"), { risk: "low", tool: "minuta", team: "Product" }, hub.tools, hub.teams).risk, "high");
  const raised = mergeAi(card("R-115"), { risk: "high", risk_reason: "Translations shown to customers unchecked", tool: null, team: "Support" }, hub.tools, hub.teams);
  assert.equal(raised.status, "Needs human review");
  const suggested = mergeAi(card("R-120"), { risk: "low", tool: "plano", team: "Finance", reason: "budget numbers" }, hub.tools, hub.teams);
  assert.equal(suggested.route.tool, "plano");
  await assert.rejects(() => classifyWithClaude(c, { tools: hub.tools, teams: hub.teams, apiKey: "" }), /not set/);
  let body;
  const out = await classifyWithClaude(c, { tools: hub.tools, teams: hub.teams, apiKey: "k", model: "m", fetchImpl: async (u, init) => { body = JSON.parse(init.body); return new Response(JSON.stringify({ content: [{ type: "tool_use", name: "classify_request", input: { risk: "low" } }] })); } });
  assert.deepEqual(out, { risk: "low" });
  assert.deepEqual(body.tool_choice, { type: "tool", name: "classify_request" });
});

test("no secrets in the repository and the demo uses the same rules as the code", () => {
  const files = ["src/text.js", "src/triage.js", "src/approval.js", "src/metrics.js", "src/kit.js"];
  for (const f of files) assert.equal(readFileSync(new URL(`../docs/lib/${f.slice(4)}`, import.meta.url), "utf8"), readFileSync(new URL(`../${f}`, import.meta.url), "utf8"), `${f}: run npm run build:demo`);
  const env = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
  assert.match(env, /^ANTHROPIC_API_KEY=$/m);
});
