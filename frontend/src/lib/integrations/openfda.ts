export interface FdaMatchResult {
  fdaSideEffect: string;
  matchStrength: "exact" | "likely" | "none";
  brandNames: string[];
  /** US/generic name used when caregiver entered an international or brand name */
  resolvedDrugName?: string;
}

interface FdaLabelResult {
  adverse_reactions?: string[];
  warnings?: string[];
  warnings_and_cautions?: string[];
  patient_medicine_information?: string[];
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
  };
}

/** International / common names → US OpenFDA generic names */
const DRUG_ALIASES: Record<string, string[]> = {
  paracetamol: ["acetaminophen", "paracetamol"],
  acetaminophen: ["acetaminophen"],
  tylenol: ["acetaminophen"],
  advil: ["ibuprofen"],
  motrin: ["ibuprofen"],
  ibuprofen: ["ibuprofen"],
  nurofen: ["ibuprofen"],
  lisinopril: ["lisinopril"],
  amlodipine: ["amlodipine"],
  metformin: ["metformin"],
  atorvastatin: ["atorvastatin"],
  lipitor: ["atorvastatin"],
};

const STOP_WORDS = new Set([
  "the", "and", "with", "after", "when", "from", "that", "this", "mom", "reported",
  "she", "her", "was", "has", "had", "very", "much", "some", "also",
]);

const MODIFIERS = new Set([
  "dry", "mild", "severe", "bad", "low", "high", "felt", "having", "being",
  "slight", "light", "moderate", "acute", "chronic",
]);

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function resolveDrugSearchTerms(name: string): string[] {
  const key = normalize(name);
  const fromMap = DRUG_ALIASES[key];
  if (fromMap) return [...new Set(fromMap.map((t) => t.trim()).filter(Boolean))];
  return [name.trim()];
}

function buildSearchTerms(reported: string): { phrase: string; primary: string[]; all: string[] } {
  const phrase = normalize(reported);
  const words = phrase.split(/\W+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const primary = words
    .filter((w) => !MODIFIERS.has(w))
    .sort((a, b) => b.length - a.length);

  const fallback = words.filter((w) => MODIFIERS.has(w));

  const all = [
    ...(phrase.length >= 4 ? [phrase] : []),
    ...primary,
    ...(primary.length === 0 ? fallback : []),
  ];

  return { phrase, primary, all: [...new Set(all)] };
}

function splitLabelSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;])\s+|[\n\r]+|(?<=\))\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

function excerptAroundTerm(text: string, term: string, maxLen = 280): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(term.toLowerCase());
  if (idx === -1) return text.slice(0, maxLen).trim() + "…";

  const sentences = splitLabelSentences(text);
  const sentence = sentences.find((s) => normalize(s).includes(term.toLowerCase()));
  if (sentence) return sentence.trim().slice(0, maxLen);

  const start = Math.max(0, idx - 50);
  return text.slice(start, start + maxLen).trim() + "…";
}

function scoreSentence(sentence: string, terms: { phrase: string; primary: string[] }): number {
  const s = normalize(sentence);
  let score = 0;
  if (terms.phrase.length >= 4 && s.includes(terms.phrase)) score += 100;
  for (const word of terms.primary) {
    if (s.includes(word)) score += 20 + word.length;
  }
  return score;
}

function findBestExcerpt(fdaText: string, terms: ReturnType<typeof buildSearchTerms>): string | null {
  const sentences = splitLabelSentences(fdaText);
  let best: { sentence: string; score: number } | null = null;

  for (const sentence of sentences) {
    const score = scoreSentence(sentence, terms);
    if (score === 0) continue;
    if (!best || score > best.score) best = { sentence, score };
  }

  if (best) return best.sentence.trim().slice(0, 280);

  for (const term of terms.all) {
    if (normalize(fdaText).includes(term)) {
      return excerptAroundTerm(fdaText, term);
    }
  }

  return null;
}

function classifyMatch(
  fdaText: string,
  excerpt: string,
  terms: ReturnType<typeof buildSearchTerms>
): "exact" | "likely" {
  const label = normalize(fdaText);
  const ex = normalize(excerpt);

  if (terms.phrase.length >= 4 && (label.includes(terms.phrase) || ex.includes(terms.phrase))) {
    return "exact";
  }

  const primaryInExcerpt = terms.primary.filter((w) => ex.includes(w));
  if (primaryInExcerpt.length >= 1) return "exact";

  const onlyModifierHit =
    terms.primary.length > 0 &&
    terms.primary.every((w) => !ex.includes(w)) &&
    terms.all.some((w) => MODIFIERS.has(w) && ex.includes(w));

  return onlyModifierHit ? "likely" : "exact";
}

function labelTextFromResult(label: FdaLabelResult): string {
  const parts = [
    ...(label.adverse_reactions ?? []),
    ...(label.warnings ?? []),
    ...(label.warnings_and_cautions ?? []),
    ...(label.patient_medicine_information ?? []),
  ].filter(Boolean);
  return parts.join(" ").slice(0, 8000);
}

async function fetchLabelBySearch(search: string): Promise<FdaLabelResult | null> {
  const url = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(search)}&limit=1`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`OpenFDA request failed (${res.status})`);
  }
  const json = (await res.json()) as { results?: FdaLabelResult[] };
  return json.results?.[0] ?? null;
}

async function fetchOpenFdaLabelResolved(drugName: string): Promise<{
  text: string;
  resolvedName: string;
}> {
  const terms = resolveDrugSearchTerms(drugName);
  const original = drugName.trim();

  for (const term of terms) {
    const label = await fetchLabelBySearch(
      `(openfda.brand_name:"${term}" OR openfda.generic_name:"${term}")`
    );
    if (label) {
      return { text: labelTextFromResult(label), resolvedName: term };
    }
  }

  for (const term of terms) {
    const label = await fetchLabelBySearch(`openfda.generic_name:"${term}"`);
    if (label) {
      return { text: labelTextFromResult(label), resolvedName: term };
    }
  }

  return { text: "", resolvedName: original };
}

export async function fetchOpenFdaLabel(drugName: string): Promise<string> {
  const { text } = await fetchOpenFdaLabelResolved(drugName);
  return text;
}

export async function matchDrugWithOpenFda(
  drugName: string,
  reportedSymptom: string
): Promise<FdaMatchResult> {
  const { text: fdaText, resolvedName } = await fetchOpenFdaLabelResolved(drugName);
  const terms = buildSearchTerms(reportedSymptom);
  const aliasNote =
    normalize(resolvedName) !== normalize(drugName)
      ? ` (searched as ${resolvedName})`
      : "";

  if (!fdaText) {
    const hint =
      normalize(drugName) === "paracetamol"
        ? ' Try "Acetaminophen" — US FDA uses that name.'
        : " Use the US generic name (e.g. Acetaminophen, not Paracetamol).";
    return {
      fdaSideEffect: `No OpenFDA label found for "${drugName}".${hint}`,
      matchStrength: "none",
      brandNames: [],
    };
  }

  const excerpt = findBestExcerpt(fdaText, terms);

  if (!excerpt) {
    return {
      fdaSideEffect: `FDA label found for ${resolvedName}${aliasNote}, but "${reportedSymptom}" is not listed as a side effect on this label.`,
      matchStrength: "none",
      brandNames: [],
      resolvedDrugName: resolvedName,
    };
  }

  const matchStrength = classifyMatch(fdaText, excerpt, terms);

  return {
    fdaSideEffect:
      aliasNote && matchStrength === "exact"
        ? `${excerpt}${aliasNote}`
        : excerpt,
    matchStrength,
    brandNames: [],
    resolvedDrugName: resolvedName,
  };
}
