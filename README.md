# AI Front Desk

**One front door for AI ideas: request, route, approve, measure.**

People submit an AI idea in plain words. The front desk asks for what's missing, scores value, effort, data sensitivity and risk, spots duplicates, and recommends an existing tool when one fits. A person approves, the team gets trained with a ready-made adoption kit, and a dashboard shows whether it helped.

**Who it's for:** operations, enablement and team leads at a growing company who get more AI ideas than they can check, and want each one routed, risk-checked and measured.

👉 **[Live demo](https://amachadod.github.io/ai-front-desk/)**: follow one request through all six steps, triage your own idea with the real rules, browse a queue of 20 requests and the adoption dashboard.

*Portfolio project by Alberto Machado Domínguez. The company, people and numbers in the demo are fictional. "Northwind SaaS" is a made-up remote software company.*

---

## 1. The problem

AI requests pile up, overlap, and skip risk checks.

- **They pile up.** Every team has "could AI do this?" ideas scattered across chats, emails and docs, with nowhere to send them.
- **They overlap.** Two teams ask for the same thing, or for something a tool already does.
- **They skip risk checks.** Requests with customer data, bank details or decisions about people slip through because nobody asked the questions.

## 2. How it works

```
  REQUEST            TRIAGE                       ROUTE                 APPROVE            TRAIN              MEASURE
 ┌─────────┐   ┌──────────────────────┐   ┌───────────────────┐   ┌──────────────┐   ┌──────────────┐   ┌────────────────┐
 │ an idea │──▶│ redact sensitive data│──▶│ existing tool?    │──▶│ a person     │──▶│ kit: prompts,│──▶│ adoption, hours│
 │ in plain│   │ ask what's missing   │   │ duplicate?        │   │ decides, with│   │ training,    │   │ saved, quality,│
 │ words   │   │ value · effort · risk│   │ human review?     │   │ a reason     │   │ checklist    │   │ satisfaction   │
 └─────────┘   └──────────────────────┘   │ new idea?         │   └──────────────┘   └──────────────┘   └────────────────┘
                                          └───────────────────┘
```

1. **Request.** Someone writes the idea: the problem, one example, how long it takes. *"We spend hours summarising customer calls."*
2. **Triage.** Bank details, card numbers, emails, phone numbers and keys are removed first. Then rules work out the team, the hours per week, value (1 to 5), effort (1 to 5), data sensitivity and risk, ask back for anything missing, and compare it with earlier requests to find duplicates.
3. **Route.** If one of my existing tools does the job, it says which and why, with a link to its demo. Duplicates are sent to be merged. Anything that would decide or influence outcomes for people (hiring, pay, performance, monitoring) goes to **human review** and is never routed to a tool automatically. Everything else is a new idea to scope.
4. **Approve.** A person approves, asks for changes or declines. Every decision needs a reason and records the decider's role. High-risk requests need an explicit "I reviewed this against the policy" before they can be approved.
5. **Train.** The route comes with a short guide and prompts from the adoption kit.
6. **Measure.** The dashboard shows adoption, estimated hours saved, quality (accepted, edited, rejected) and satisfaction, plus one "what I would do about it" note. In the demo these are illustrative sample data.

**Rules first, AI optional.** Triage is deterministic rules: keywords, patterns for sensitive data and risky requests, value and effort scoring, and word-overlap similarity for duplicates. That makes it testable and explainable. An optional **AI mode** (`AI_MODE=true` with a Claude API key) asks Claude for a clearer title, a summary, the team and a tool suggestion. Claude only sees the redacted text, its suggestions are checked against the known teams and tools, and it can raise a risk but never lower one. The demo runs on rules only.

## 3. How it connects to my other tools

| Tool | What it does | The front desk routes here when… | Demo |
|---|---|---|---|
| [Minuta](https://github.com/amachadod/minuta) | Turns call notes into tasks, in an issue tracker (Linear) or, new, a CRM (HubSpot-style) with a follow-up email draft that is never sent | The request is about calls, meetings, transcripts or follow-ups | [Open](https://amachadod.github.io/minuta/) |
| [Posta](https://github.com/amachadod/posta) | Reads the inbox every morning, sends a briefing and drafts replies in your voice | It's about email overload, inbox triage or reply drafts | [Open](https://amachadod.github.io/posta/) |
| [Threadline](https://github.com/amachadod/threadline) | Turns documents into a second brain; new handbook mode answers from Notion pages, cites them, and flags stale or conflicting pages | It's about company knowledge, the handbook or policy questions | [Open](https://amachadod.github.io/threadline/) |
| [Signalpost](https://github.com/amachadod/signalpost) | Writes a native post per social network from a plain-words plan, checks the rules, schedules after approval | It's about social posts, captions or a content calendar | [Open](https://amachadod.github.io/signalpost/) |
| [Plano](https://github.com/amachadod/plano) | Forecasts what a paid media budget buys across channels and markets | It's about media budgets, forecasts, CPA or ROAS | [Open](https://amachadod.github.io/plano/) |
| [AdsDetective](https://github.com/amachadod/adsdetective) | Ranks which ads keep running in Meta's public Ad Library | It's about competitor ads or creative research | [Open](https://amachadod.github.io/adsdetective/) |

The routing keywords for each tool live in [`hub.config.json`](hub.config.json), next to the hub's name, so adding a tool or renaming the hub is one edit.

## 4. What is real and what is simulated

| Real | Simulated |
|---|---|
| The triage rules: missing info, value, effort, sensitivity, risk, duplicates, routing | Northwind SaaS, its people and its 20 requests |
| Redaction of IBANs, card numbers (checked with the Luhn test), emails, phone numbers and keys | Every dashboard number: illustrative sample data |
| The approval rules and the dashboard calculations, with unit tests | Approvals in the demo: they live in the page and disappear on reload |
| The optional AI mode (Claude API, forced tool use), tested with a fake API | Integrations with Asana, Slack, HubSpot or Notion: described, not connected |
| The adoption kit and the Responsible AI Use Policy, as finished documents | The training: designed, not yet delivered to a team |
| The six tools it routes to, each with its own repo and demo | |

The demo page runs the same rule files as the tests: `npm run build:demo` copies `src/` into `docs/lib/`, and a test fails if they differ.

## 5. Safety and governance

- **A human approves.** Nothing is built, connected or rolled out without a recorded decision, a reason and the decider's role.
- **Outside text is data, not instructions.** Requests are read and scored, never obeyed. In AI mode the request is wrapped as data and Claude can't change the safety result.
- **Nothing stored beyond the task.** The demo keeps nothing. Logs hold counts only. Decisions record a role, not a name.
- **Redaction first.** Sensitive details are removed before a request is shown, compared with others, or sent to an AI model.
- **No HR data, no decisions about people.** The front desk never connects to HR or employee data systems. Requests about hiring, pay, performance or monitoring go to human review.
- **GDPR note.** Collect only what a request needs, for a clear purpose. Call recordings need consent from everyone on the call. Personal data stays in approved tools. Check your own legal basis before using real data.

## 6. Adoption kit

Four documents in [`kit/`](kit/) that ship with every approved route:

| File | What it is | When in the first week |
|---|---|---|
| [Prompt library](kit/prompt-library.md) | 12 prompts for marketing, sales, support and customer success, each with when to use it, an example and a "check before you send" line | Day 1: find your team's three prompts |
| [Training outline](kit/training-outline.md) | A 40-minute session with a live demo and two exercises. *Designed, not yet delivered to a team.* | Day 3 |
| [One-week checklist](kit/onboarding-checklist.md) | Day-by-day steps from reading the policy to rating outputs | Days 1 to 5 |
| [Responsible AI Use Policy](kit/responsible-ai-policy.md) | One page: purpose, approved tools, data rules, human check, outside text, logging, who to ask. A template to adapt with legal and security. | Day 1 |

## 7. Run it yourself

You need [Node.js 20+](https://nodejs.org). No dependencies and no keys for the demo.

```bash
git clone https://github.com/amachadod/ai-front-desk.git
cd ai-front-desk
npm run demo                       # triages the 20 sample requests and prints the dashboard
npm run triage -- "Translate help articles" "About 6 hours a week translating 120 articles into Spanish"
npm run build:demo                 # rebuilds docs/data.js and copies the rules to docs/lib/
npm test
```

To open the demo locally, serve the `docs/` folder (for example `npx serve docs` or `python3 -m http.server -d docs`), because browsers block JavaScript modules opened straight from a file.

**AI mode (optional).** Copy `.env.example` to `.env`, set `AI_MODE=true` and add `ANTHROPIC_API_KEY`. `npm run triage` then adds Claude's reading on top of the rules. Keys never go in the repository; on GitHub they'd go in Actions secrets.

**Rename it.** Change `name` in [`hub.config.json`](hub.config.json) and the title of this README. The demo page reads the name from the config.

**Brand.** [`brand/`](brand/) has the logo, the colour tokens (light and dark, contrast-checked) and notes on how the suite shares one visual language.

```
src/         text (redaction, similarity), triage, approval, metrics, kit, ai (optional)
scripts/     demo, triage, build-demo
examples/    20 fictional requests, illustrative usage data
kit/         prompt library, training outline, checklist, policy
brand/       logo, tokens, contrast notes
docs/        demo page (GitHub Pages), its data, a copy of the rules, and the case study
test/        node:test suite
```

## 8. Tests

```bash
npm test     # 12 tests
```

They cover: redaction of every sensitive type; the story request routed to Minuta; every tool reachable; vague requests asking for what's missing; hours-per-week parsing; duplicate detection; sensitive data flagged and never left in the output; requests about people always going to human review; approval needing a person, a reason and a risk confirmation; dashboard numbers computed and labelled illustrative; the kit's files and prompt format; AI mode only seeing redacted text and never lowering a risk; and the demo's copy of the rules matching the source. A GitHub Actions workflow runs them on every push.

## 9. Case study

[docs/case-study.md](docs/case-study.md): the problem, the approach, what I built, what is simulated and what I'd improve next.

## 10. Contact

Built by Alberto Machado Domínguez · [albertomachdom@gmail.com](mailto:albertomachdom@gmail.com) · [LinkedIn](https://www.linkedin.com/in/alberto-machado-dom%C3%ADnguez-708290251/) · [Code on GitHub](https://github.com/amachadod/ai-front-desk)

MIT license. Claude, Asana, Slack, HubSpot, Notion and the other products named are trademarks of their owners. This is an independent project, not affiliated with any of them.
