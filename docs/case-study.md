# Case study: AI Front Desk

*Portfolio project by Alberto Machado Domínguez. The company and data are fictional. No results are claimed.*

**CV line:** Designed and built "AI Front Desk", an intake and governance hub for AI requests: rule-based triage (value, effort, data sensitivity, risk, duplicates) that routes ideas to six AI tools I built, a human approval step, an adoption kit (prompt library, training, one-page AI use policy) and an adoption dashboard. Node.js, Claude API (optional), 12 automated tests, live demo.

## The problem
At a growing remote company, AI ideas arrive from every team through chats and emails. Nobody sees them all, so the same idea is requested twice, existing tools are rebuilt, and requests involving customer data or decisions about people skip the questions they should get.

## The approach
- **One front door.** Every idea goes through the same short form: the problem, one example, how long it takes.
- **Rules before AI.** Triage is deterministic so it's testable and explainable: what's missing, value, effort, sensitivity, risk, duplicates, route. AI is an optional layer that can add detail but can't weaken a safety check.
- **Reuse before build.** If an existing tool fits, route to it with a plain reason and a demo link.
- **People decide.** Every decision needs a reason and a role. Anything touching decisions about people goes to human review.
- **Adoption is part of delivery.** Each route comes with prompts, a training and a checklist, and is measured.

## What I built
- Triage rules with redaction (IBAN, card numbers with a Luhn check, emails, phones, keys), hours-per-week parsing, value and effort scoring, risk patterns, duplicate detection and routing to six tools.
- An approval step that blocks approving duplicates, incomplete requests and high-risk requests without an explicit review.
- A dashboard calculation (adoption, hours saved, quality, satisfaction, trend) with a rule-based "what I'd do next" note.
- The adoption kit: 12 prompts, a 40-minute training outline, a one-week checklist and a one-page Responsible AI Use Policy.
- A live demo that runs the same rule files in the browser, a brand (logo, tokens, contrast checks), and 12 tests.
- Two additions to existing tools so the routes are real: a CRM output for Minuta (CRM tasks and a follow-up email draft that is never sent) and a company handbook mode for Threadline (answers that cite the page, stale-page and conflict flags).

## What is simulated
The company, its 20 requests and every dashboard number. Approvals in the demo aren't saved. Integrations with Asana, Slack, HubSpot and Notion are described, not connected. The training is designed, not delivered.

## What I'd improve next
1. Take requests from where people already are: an Asana form or a Slack shortcut, with the same triage.
2. Store decisions in a shared place (an Asana project or a small database) so the log survives a reload.
3. Measure real usage from each tool's own logs (counts only) instead of sample data.
4. Test the duplicate threshold on real requests and tune it; word overlap misses ideas phrased very differently.
5. Run the training once with a real team and update the kit from what people actually got stuck on.
