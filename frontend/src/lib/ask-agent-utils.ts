const KNOWN_DRUGS = [
  "lisinopril",
  "amlodipine",
  "metformin",
  "acetaminophen",
  "paracetamol",
  "atorvastatin",
  "omeprazole",
];

export function extractDrugNameFromQuestion(question: string): string | null {
  const q = question.toLowerCase();
  for (const drug of KNOWN_DRUGS) {
    if (q.includes(drug)) {
      return drug === "paracetamol" ? "acetaminophen" : drug;
    }
  }
  const match = q.match(/\babout\s+([a-z]{4,})\b/);
  return match?.[1] ?? null;
}
