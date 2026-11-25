// Condensed from the public Explorer's delivery-email story and /solid design notes.
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
    oneLine: "Group code by reasons for change; policy ownership is its own responsibility.",
    application:
      "Three responsibilities change for different reasons: improving AI interpretation or writing, changing information-sharing rules, and changing the email-provider integration. These can be functions or modules in one application — they do not require separate agents. Keeping all three in one agent means a prompt change ships with a permission change, reviewed by no one. Note that creating separate agents does not automatically create separate authority: if they share credentials, the boundary is cosmetic.",
    pitfall:
      "One component reads the document, plans the work and executes tools. A change to any of the three forces a redeploy — and a re-review — of all of them, so reviews stop happening.",
    bad: `agent.run(doc)      // reads, plans,
                    // and calls tools`,
    proposed:
      "Separate interpretation, policy ownership and delivery. The checked operation is defined explicitly by the application: the order comes from the request context, the recipient is resolved from the order record, and only approved fields enter the template. A denial stops the run; the sender receives exactly the permitted operation.",
    good: `const proposal = agent.propose(note)

// the application defines the checked operation
const operation = {
  type: "sendDeliveryUpdate",
  order: taskContext.selectedOrder, // not from the note
  recipient: order.supplierContact, // resolved by the app
  fields: ["orderRef", "deliveryDate"],
}

const decision = policy.authorise(operation, taskContext)
if (!decision.allowed) return deny(decision.reason)

// the sender receives exactly this permitted operation
return sender.deliver(decision.permit)`,
  },
  {
    id: "O",
    name: "Open / Closed",
    oneLine: "Extend behaviour through stable interfaces; unchanged trust is not guaranteed.",
    application:
      "New tools should slot in behind a stable registration contract without repeatedly changing the high-level workflow. But each extension is also a new capability, so permission review is an explicit step of adding one: who may use it, on which resources, under which task grants. Default denial is an application-policy decision, not a guarantee supplied by OCP.",
    pitfall:
      "Each new tool is wired straight into the agent. Adding 'send email' silently grants every existing workflow a way out of the company — no permission review happened because none was required.",
    bad: `agent.tools.push(emailTool)`,
    proposed:
      "Extend tools through a stable registration and policy contract. Registration requires an explicit permission review; new capabilities start denied and receive explicit task grants.",
    good: `registry.add(emailTool, {
  default: "deny",        // policy decision
  allowWhen: r => policy.check(r.identity,
    r.taskGrant, r.operation, r.resource)
})
// review required: who may use
// this tool, on what resources?`,
  },
  {
    id: "L",
    name: "Liskov Substitution",
    oneLine:
      "A replacement must preserve the behavioural contract callers rely on, including relevant effects.",
    application:
      "Callers rely on more than a signature: documented effects and failure behaviour are part of the contract. A 'summarise' tool swapped for a richer one that also fetches URLs keeps the signature but breaks the contract callers depended on. A compatible signature or an effects declaration does not establish that an implementation honours the contract. Tests provide evidence; runtime restrictions constrain reachable effects.",
    pitfall:
      "The richer summariser passes type-checking and declares its effects honestly. Its hidden network fetch only appears in production, where nothing constrains it.",
    bad: `interface Summariser {
  run(text): string
  effects: ["none"]  // declaration only
}`,
    proposed:
      "Validate replacements with contract tests that compare observable behaviour, and confine the executor slot at runtime so undeclared effects are unreachable. The two mechanisms do different jobs: tests give evidence, confinement gives a bound.",
    good: `// contract tests: same inputs,
// same observable behaviour
assertSameBehaviour(SummariserV1, SummariserV2)

// runtime: this executor slot is
// granted no network capability`,
  },
  {
    id: "I",
    name: "Interface Segregation",
    oneLine: "Give clients focused interfaces; resource authorisation is still required.",
    application:
      "Clients should receive the operations they need, not a general-purpose client holding every scope. But interface shape and resource permissions are separate concerns: a narrow readNote(id) interface still requires authorisation for the specific note. The check compares the requested ID against the caller's access and the task grant before reading.",
    pitfall:
      "The agent holds a god-credential: files, mail, CRM. A summary task can reach internal pricing because the interface exposes everything and nothing checks the resource.",
    bad: `tools: { fs, mail, crm }  // all scopes`,
    proposed:
      "Expose task-shaped operations instead of general-purpose clients, and enforce resource-level access for every accepted ID. A narrow method name does not prevent access to a forbidden resource.",
    good: `readNote(id: NoteId): Note
// before reading:
//   check(id is in caller.access)
//   check(id is in taskGrant.scope)
// otherwise deny`,
  },
  {
    id: "D",
    name: "Dependency Inversion",
    oneLine:
      "Point dependencies toward high-level abstractions; authentication is a separate concern.",
    application:
      "The policy module defines the capability contracts; concrete adapters implement those contracts. The dependency points inward — adapters depend on the policy's interface, not the reverse. Dependency injection alone does not demonstrate inversion: injecting a concrete god-client changes nothing. Adapter credentials are constrained separately, scoped to the signed-in user and the task grant.",
    pitfall:
      "The agent depends on concrete clients holding long-lived keys. Document content can influence credentialed execution; it does not literally acquire the secret keys.",
    bad: `new EmailClient(process.env.SMTP_KEY)`,
    proposed:
      "Policy owns the capability interface; adapters implement it and receive separately scoped credentials. Authority flows from the authenticated user, not from the document.",
    good: `// policy owns the contract
interface MailPort { send(draft): Receipt }

// adapter implements it, built per
// request with user-scoped credentials
class UserMailAdapter implements MailPort`,
  },
] as const;
