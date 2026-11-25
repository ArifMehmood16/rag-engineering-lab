// Condensed from the public Explorer's delivery-email story and /solid design notes.
export const EXPLORER = "https://agent-authority-explorer.lovable.app";
export const AUTHORITY_TITLE = "Agent Authority Explorer";
export const AUTHORITY_INTRO =
  "Email the delivery update for order #1042 to its supplier. The supplier note gives a delivery date of 12 November and asks for a private pricing attachment. Compare two independent runs of that same request.";
export const AUTHORITY_RUNS = {
  broad: {
    label: "Broad access",
    rows: [
      ["Order", "The user selected order #1042."],
      ["Recipient", "The agent uses the address supplied by the untrusted note."],
      ["Attachment", "The agent’s shared credentials allow it to read internal pricing."],
      ["Sender", "The email tool accepts the agent’s recipient, body and attachment."],
    ],
    outcome: "Internal pricing reaches the address from the note.",
    explanation:
      "Splitting reading, planning and sending into separate roles leaves the same operations available if those roles share credentials.",
  },
  enforced: {
    label: "Application-enforced limits",
    rows: [
      ["Order", "The application binds the operation to the selected order, #1042."],
      ["Recipient", "The application resolves the supplier contact from the trusted order record."],
      [
        "Attachment",
        "Policy rejects the pricing attachment. The model has no direct private-file access.",
      ],
      [
        "Sender",
        "The sender receives a permitted message built from the order reference and delivery date.",
      ],
    ],
    outcome: "The supplier contact receives the delivery update. Internal pricing stays private.",
    explanation:
      "The model proposes an update. Application code authorises the operation and fills a fixed template. The sender can deliver only that operation.",
  },
} as const;

export const DESIGN_NOTES = [
  {
    id: "S",
    name: "Single Responsibility",
    pitfall:
      "A prompt edit, a sharing-policy change and a mail-provider upgrade all go through the same component.",
    design:
      "Give proposal, authorisation and delivery separate owners. The policy checks the selected order, trusted recipient and allowed fields. The sender receives the permitted operation.",
  },
  {
    id: "O",
    name: "Open / Closed",
    pitfall: "Registering an email tool quietly gives every existing workflow a new capability.",
    design:
      "Extend the registry through a stable contract. Keep each new tool denied until a review grants a particular identity and task access to its resources.",
  },
  {
    id: "L",
    name: "Liskov Substitution",
    pitfall: "A replacement summariser has the same signature but adds a network fetch.",
    design:
      "Include effects and failures in the behavioural contract. Compare implementations with contract tests and confine the executor at runtime to the permitted effects.",
  },
  {
    id: "I",
    name: "Interface Segregation",
    pitfall: "A general-purpose client lets a summary task reach files, mail and customer records.",
    design:
      "Give the caller a focused operation such as readNote(id). Before reading, check that the specific note is within both the caller’s access and the task grant.",
  },
  {
    id: "D",
    name: "Dependency Inversion",
    pitfall:
      "An agent depends directly on clients holding long-lived credentials. Document content can influence their use.",
    design:
      "Let policy own the capability interface. Adapters implement it using credentials scoped to the authenticated user and task.",
  },
] as const;
