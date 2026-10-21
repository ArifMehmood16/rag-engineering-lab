import { APOLLO_QUESTIONS, type EvidenceRecord } from "@/content/apollo";
import { REQUEST_SCENARIOS } from "@/content/rag-scenarios";
import { advance, initEngine } from "./apollo-engine";

/** A new example is isolated. Only the explicit repeat example starts with an approved cache entry. */
export function scenarioSeed(id: string, records: EvidenceRecord[]) {
  const scenario = REQUEST_SCENARIOS.find((s) => s.id === id)!;
  const question = APOLLO_QUESTIONS.find((q) => q.id === scenario.questionId)!;
  let seed = initEngine(question.text, scenario.config);
  if (scenario.warm) {
    let cold = seed;
    while (!cold.halted && cold.cursor < 10) cold = advance(cold, records);
    if (!cold.ctx.released)
      throw new Error("The cache example must be seeded by a released, checked answer.");
    seed = initEngine(question.text, scenario.config, cold.memory);
  }
  return seed;
}
