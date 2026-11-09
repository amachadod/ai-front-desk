// The human step. Nothing is built, connected or rolled out until a person decides, and every
// decision records who decided (a role, not a name) and why.

export const DECISIONS = ["approve", "changes", "decline"];
const OUTCOME = { approve: "Approved", changes: "Changes requested", decline: "Declined" };

export function decide(card, { decision, reason, by, reviewedRisk = false }, now = new Date()) {
  if (!DECISIONS.includes(decision)) throw new Error(`Decision must be one of: ${DECISIONS.join(", ")}.`);
  const why = String(reason || "").trim();
  if (why.length < 8) throw new Error("Write a short reason. Every decision is recorded with its reason.");
  if (!by || !String(by).trim()) throw new Error("Say who is deciding (a role is enough, for example \"Head of Support\").");
  if (decision === "approve") {
    if (card.status === "Needs info") throw new Error("This request is missing information. Ask for changes first.");
    if (card.route.type === "duplicate") throw new Error(`This looks like a duplicate of ${card.route.of}. Merge them or ask for changes.`);
    if (card.risk === "high" && !reviewedRisk) throw new Error("High-risk request: approve only after reviewing it against the Responsible AI Use Policy with its owner, and confirm that you did.");
  }
  return {
    id: card.id, decision, outcome: OUTCOME[decision], reason: why.slice(0, 500), by: String(by).trim().slice(0, 80),
    reviewedRisk: Boolean(reviewedRisk), at: now.toISOString(),
    next: decision === "approve" ? (card.route.tool ? `Roll out ${card.route.toolName || card.route.tool} to the team with the adoption kit.` : "Scope a small pilot and measure it.") : decision === "changes" ? "Back to the requester with the reason." : "Closed. The reason is kept so the idea isn't re-submitted blindly.",
  };
}

// Log-safe summary: counts only, never the request text.
export function decisionCounts(log) {
  const c = { Approved: 0, "Changes requested": 0, Declined: 0 };
  for (const d of log) c[d.outcome] = (c[d.outcome] || 0) + 1;
  return c;
}
