// Thin wrapper over the Codex SDK. Each call starts its OWN thread, so every
// role reasons in an isolated context — nobody inherits another role's transcript.
import { Codex } from "@openai/codex-sdk";

const codex = new Codex();

// Minimal skill -> Codex capability mapping (the S1 "skill = tool" wiring).
// Skills that produce/modify artifacts need a writable sandbox; the rest stay
// read-only. web-search flips on the agent's web tool + network.
// ponytail: a lookup table, not a tool framework. Grow it when skills do.
const MUTATING = new Set([
  "write-code", "run-tests", "edit-image", "generate-image", "draft-document",
]);

export function skillsToThreadOptions(skills = []) {
  const opts = {
    approvalPolicy: "never",   // non-interactive: never pause for human approval
    skipGitRepoCheck: true,
    sandboxMode: skills.some((s) => MUTATING.has(s)) ? "workspace-write" : "read-only",
  };
  if (skills.includes("web-search")) {
    opts.webSearchEnabled = true;
    opts.networkAccessEnabled = true;
  }
  return opts;
}

/**
 * Run one agent turn.
 * @param instructions  the role's system prompt (prepended; Codex has no separate system slot)
 * @param task          the actual work
 * @param opts.skills   role skills -> thread capabilities
 * @param opts.schema   JSON schema -> forces structured JSON in finalResponse
 * @param opts.effort   model reasoning effort (use "low" for cheap routing)
 * @returns finalResponse string (JSON text when schema is given)
 */
export async function run(instructions, task, { skills = [], schema, effort } = {}) {
  const thread = codex.startThread({
    ...skillsToThreadOptions(skills),
    ...(effort ? { modelReasoningEffort: effort } : {}),
  });
  const input = `${instructions}\n\n--- TASK ---\n${task}`;
  const turn = await thread.run(input, schema ? { outputSchema: schema } : undefined);
  return turn.finalResponse;
}

/** Run with a schema and parse the JSON result. */
export async function runJSON(instructions, task, schema, opts = {}) {
  const text = await run(instructions, task, { ...opts, schema });
  return JSON.parse(text);
}
