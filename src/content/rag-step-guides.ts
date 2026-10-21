/** Short orientation cues; exact records and verdicts remain in the recorded step output. */
export const KNOWLEDGE_GUIDES = [
  {
    input: "Source pages",
    output: "Text + source identity",
    think: "If the source URL is lost here, how could a later answer cite it?",
  },
  {
    input: "Reviewed source text",
    output: "Bounded passage records",
    think: "Would splitting a name from its role make the passage harder to retrieve?",
  },
  {
    input: "Passage text",
    output: "Numeric vectors",
    think: "Why must the question and passages use the same encoder?",
  },
  {
    input: "Vectors + passage records",
    output: "Searchable index",
    think: "Could vectors alone provide evidence for an answer?",
  },
] as const;

export const REQUEST_GUIDES = [
  {
    input: "One user question",
    output: "Required facts identified",
    think: "Which facts would a complete answer have to include?",
  },
  {
    input: "Question + access policy",
    output: "Allowed request or stop",
    think: "Should a model be able to override an access denial?",
  },
  {
    input: "Allowed request + cache",
    output: "Cache decision + model choice",
    think: "Does selecting a small model mean it has already generated an answer?",
  },
  {
    input: "Question + prepared index",
    output: "Ranked eligible passages",
    think: "Could a fluent answer compensate for missing evidence?",
  },
  {
    input: "Retrieved passages",
    output: "Evidence within a budget",
    think: "What could go wrong if unrelated text crowds out a required fact?",
  },
  {
    input: "Context + workflow policy",
    output: "Passage lookup or no tool call",
    think: "If the context already contains every required fact, what would another tool call add?",
  },
  {
    input: "Required facts + evidence",
    output: "Continue or safe stop",
    think: "When is an honest evidence gap better than a plausible guess?",
  },
  {
    input: "Prompt + selected profile",
    output: "Draft claims or no generation",
    think: "Why does a reused prompt prefix still need a new generation?",
  },
  {
    input: "Draft claims + source IDs",
    output: "Support and citation verdicts",
    think: "Can a citation resolve to a real passage but still fail to support the claim?",
  },
  {
    input: "Checked claims + current sources",
    output: "Release decision",
    think: "Should a cached answer bypass the application's current release checks?",
  },
  {
    input: "Release decision",
    output: "Checked answer or safe notice",
    think: "Can you trace this result back to the question that started the request?",
  },
] as const;
