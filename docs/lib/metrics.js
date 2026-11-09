// The adoption dashboard, computed from usage data. In the demo the data is illustrative sample data.

const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const avg = (ratings) => {
  const n = Object.values(ratings || {}).reduce((s, v) => s + v, 0);
  const sum = Object.entries(ratings || {}).reduce((s, [k, v]) => s + +k * v, 0);
  return n ? Math.round((sum / n) * 10) / 10 : null;
};

export function weekStats(w, licensed) {
  return {
    week: w.week,
    activeUsers: w.activeUsers,
    adoptionRate: pct(w.activeUsers, licensed),
    outputs: w.outputs,
    hoursSaved: Math.round((w.minutesSaved / 60) * 10) / 10,
    acceptedShare: pct(w.outputs - w.edited - w.rejected, w.outputs),
    editedShare: pct(w.edited, w.outputs),
    rejectedShare: pct(w.rejected, w.outputs),
    satisfaction: avg(w.ratings),
  };
}

export function dashboard(usage) {
  if (!usage?.weeks?.length) throw new Error("No usage data.");
  const weeks = usage.weeks.map((w) => weekStats(w, usage.licensed));
  const now = weeks.at(-1), before = weeks.at(-2) || now;
  const change = (k) => Math.round((now[k] - before[k]) * 10) / 10;
  const byTool = Object.entries(usage.byTool || {}).map(([tool, t]) => ({ tool, outputs: t.outputs, rejectedShare: pct(t.rejected, t.outputs), hoursSaved: Math.round((t.minutesSaved / 60) * 10) / 10 }))
    .sort((a, b) => b.outputs - a.outputs);
  return {
    label: usage.label || "Illustrative sample data",
    licensed: usage.licensed,
    current: now,
    change: { adoptionRate: change("adoptionRate"), hoursSaved: change("hoursSaved"), rejectedShare: change("rejectedShare"), satisfaction: now.satisfaction != null && before.satisfaction != null ? change("satisfaction") : null },
    trend: weeks.map((w) => ({ week: w.week, adoptionRate: w.adoptionRate, hoursSaved: w.hoursSaved })),
    byTool,
    action: nextAction(now, before, byTool),
  };
}

// One plain "what I would do about it" note, chosen by rules from the numbers.
export function nextAction(now, before, byTool) {
  const worst = byTool.filter((t) => t.outputs >= 20).sort((a, b) => b.rejectedShare - a.rejectedShare)[0];
  if (worst && worst.rejectedShare >= 15) return `${worst.tool}: ${worst.rejectedShare}% of outputs are rejected. I'd sit with two users of it this week, collect five rejected examples, and update its prompts and the kit's "check before you send" line.`;
  if (now.adoptionRate - before.adoptionRate < 0) return `Adoption dropped ${Math.abs(Math.round((now.adoptionRate - before.adoptionRate) * 10) / 10)} points. I'd ask the teams that stopped what got in the way, and repeat the 30-minute training for them.`;
  if (now.adoptionRate < 50) return `Only ${now.adoptionRate}% of licensed people use it weekly. I'd run the 30-minute training with the two least active teams and share one success story from each active team.`;
  return "Adoption and quality are steady. I'd pick the next request from the queue with the best value-to-effort ratio and pilot it with one team.";
}
