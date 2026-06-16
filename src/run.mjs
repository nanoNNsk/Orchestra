// Orchestra CEO loop: Chairman -> CEO -> department head -> role -> consolidated reply.
// Usage (CLI):  node src/run.mjs "your request to the company"
// Or import { orchestrate } from "./run.mjs" and call it (the server does).
//
// Reuse-first routing; hires only when no role fits. The CEO sees each step's
// RESULT, never a role's raw transcript.
import { load, rolesIn, getRole, skillIds } from "./roster.mjs";
import { run, runJSON } from "./agent.mjs";
import { hireRole } from "./hire.mjs";
import { loadMemory, appendMemory } from "./memory.mjs";

/**
 * Route one Chairman request through the company and return the reply.
 * @param message   the Chairman's request
 * @param onTrace   optional callback(step:string) for live progress
 * @returns { reply, department, roleId, hired, trace }
 */
export async function orchestrate(message, onTrace = () => {}) {
  const trace = [];
  const step = (s) => { trace.push(s); onTrace(s); };

  const data = load();

  // 1. CEO picks a department.
  const deptList = data.departments.map((d) => `- ${d.id}: ${d.description}`).join("\n");
  const { department, reason: deptReason } = await runJSON(
    "You are the CEO of Orchestra. Route the Chairman's request to the single best department.",
    `Chairman's request:\n${message}\n\nDepartments:\n${deptList}`,
    {
      type: "object", additionalProperties: false,
      properties: {
        department: { type: "string", enum: data.departments.map((d) => d.id) },
        reason: { type: "string" },
      },
      required: ["department", "reason"],
    },
    { effort: "low" },
  );
  step(`CEO → ${department}: ${deptReason}`);

  // 2. Department head reuses a fitting role, or hires one if none fits.
  const roles = rolesIn(data, department);
  const roleList = roles.map((r) => `- ${r.id}: ${r.description}`).join("\n");
  const decision = await runJSON(
    `You are the head of the ${department} department at Orchestra. ` +
      "Prefer reusing an existing role. Only hire a new one if none fits the task.",
    `Task:\n${message}\n\nExisting roles:\n${roleList}\n\n` +
      `Skills you may assign (use only these ids): ${skillIds(data).join(", ")}`,
    {
      // OpenAI strict schemas: every property must be in `required`; "optional"
      // fields are expressed as nullable instead.
      type: "object", additionalProperties: false,
      properties: {
        action: { type: "string", enum: ["reuse", "hire"] },
        role: { type: ["string", "null"], description: "existing role id when action=reuse, else null" },
        new_role: {
          type: ["object", "null"], additionalProperties: false,
          description: "the new specialist when action=hire, else null",
          properties: {
            id: { type: "string", description: "kebab-case" },
            description: { type: "string", description: "one sharp line" },
            system_prompt: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
          },
          required: ["id", "description", "system_prompt", "skills"],
        },
        reason: { type: "string" },
      },
      required: ["action", "role", "new_role", "reason"],
    },
    { effort: "low" },
  );

  let role, hired = false;
  if (decision.action === "hire" && decision.new_role) {
    role = hireRole(department, decision.new_role);
    hired = true;
    step(`${department} head → HIRED '${role.id}': ${decision.reason}`);
  } else {
    role = getRole(data, decision.role) || roles[0];
    step(`${department} head → reuse '${role.id}': ${decision.reason}`);
  }

  // 3. The role works in its own isolated context, carrying its past memory.
  const memory = loadMemory(role.id);
  const result = await run(
    `${role.system_prompt}\nYour skills: ${role.skills.join(", ") || "none"}.` +
      (memory ? `\n\nYour memory from past work:\n${memory}` : ""),
    message,
    { skills: role.skills },
  );
  appendMemory(role.id, message, result);
  step(`'${role.id}' worked${memory ? " (with memory)" : ""}`);

  // 4. CEO consolidates the specialist's result into one reply to the Chairman.
  const reply = await run(
    "You are the CEO of Orchestra, the only one who speaks to the Chairman. " +
      "Using the specialist's result, reply to the Chairman directly and concisely. " +
      "Do not mention internal delegation or roles.",
    `Chairman asked:\n${message}\n\nSpecialist (${role.id}) produced:\n${result}`,
  );
  step("CEO → reply");

  return { reply, department, roleId: role.id, hired, trace };
}

// CLI entrypoint.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const message = process.argv.slice(2).join(" ").trim();
  if (!message) {
    console.error('Usage: node src/run.mjs "your request"');
    process.exit(1);
  }
  const { reply } = await orchestrate(message, (s) => console.error("·", s));
  console.log("\n" + reply);
}
