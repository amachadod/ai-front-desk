// Text helpers shared by the triage rules. Plain ES modules with no Node imports,
// so the same code runs in tests, on the command line and in the demo page.

const STOP = new Set(("a an and are as at be but by can could do does for from get got have how i if in into is it its just " +
  "me more most my need needs of on or our out so some than that the their them then there these they this to too " +
  "up us we what when where which who will with would you your about all also any every lot lots really want wants").split(" "));

export const normalize = (s) => String(s || "").normalize("NFKC").toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();

const stem = (w) => w.replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "");
export const words = (s) => normalize(s).replace(/[^\p{L}\p{N}\s]/gu, " ").split(" ").filter((w) => w.length > 2 && !STOP.has(w)).map(stem);

// How alike two texts are, from 0 to 1 (shared content words over all content words).
export function similarity(a, b) {
  const A = new Set(words(a)), B = new Set(words(b));
  if (!A.size || !B.size) return 0;
  let both = 0;
  for (const w of A) if (B.has(w)) both++;
  return both / (A.size + B.size - both);
}

export const hasPhrase = (text, phrase) => {
  const t = ` ${normalize(text).replace(/[^\p{L}\p{N}'\s-]/gu, " ")} `;
  return t.includes(` ${normalize(phrase)} `);
};

const luhn = (digits) => {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = +digits[digits.length - 1 - i];
    if (i % 2) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
};

// Removes sensitive details before anything is stored, shown or sent to an AI model.
export function redact(text) {
  const found = { iban: 0, card: 0, email: 0, phone: 0, secret: 0 };
  let t = String(text || "");
  t = t.replace(/\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,4})?\b/g, () => { found.iban++; return "[IBAN removed]"; });
  t = t.replace(/\b(?:\d[ -]?){13,19}\b/g, (m) => { const d = m.replace(/\D/g, ""); if (d.length >= 13 && luhn(d)) { found.card++; return "[card number removed]"; } return m; });
  t = t.replace(/\b(?:sk-[A-Za-z0-9-]{16,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|pat-[a-z0-9]{2,4}-[A-Za-z0-9-]{16,})\b/g, () => { found.secret++; return "[secret removed]"; });
  t = t.replace(/(password|passcode|api key)\s*[:=]\s*\S+/gi, (m, k) => { found.secret++; return `${k}: [secret removed]`; });
  t = t.replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, () => { found.email++; return "[email removed]"; });
  t = t.replace(/(?<!\w)\+?\d[\d ()-]{8,}\d\b/g, (m) => { if (m.replace(/\D/g, "").length < 9) return m; found.phone++; return "[phone removed]"; });
  return { text: t, found, count: Object.values(found).reduce((a, b) => a + b, 0) };
}
