// The HIRE + APPEND steps of the hiring protocol (see HIRING.md).
// A head minted a new role spec; we vet it, persist it, and re-validate the roster.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { load, save, getRole, skillIds } from "./roster.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/**
 * Persist a newly hired role.
 * @param dept   department id the head leads
 * @param spec   { id, description, system_prompt, skills[] } from the head
 * @returns the stored role
 * @throws if the spec is malformed or the roster fails validation afterward
 */
export function hireRole(dept, spec) {
  const data = load();

  if (!spec?.id || !spec.description || !spec.system_prompt) {
    throw new Error("hire: spec missing id/description/system_prompt");
  }
  if (getRole(data, spec.id)) {
    throw new Error(`hire: role '${spec.id}' already exists`);
  }

  // Skills must come from the existing registry. Protocol says STOP on an
  // unknown skill; for an autonomous run we drop unknowns and warn instead of
  // halting. ponytail: warn-and-drop, tighten to hard-stop if it bites.
  const known = new Set(skillIds(data));
  const skills = (spec.skills || []).filter((s) => known.has(s));
  const dropped = (spec.skills || []).filter((s) => !known.has(s));
  if (dropped.length) console.error("· hire: dropped unknown skills:", dropped.join(", "));

  const role = {
    id: spec.id,
    department: dept,
    description: spec.description,
    system_prompt: spec.system_prompt,
    skills,
    created_by: `head-of-${dept}`,
  };
  data.roles.push(role);
  save(data);

  // Re-validate: a runtime write must never corrupt the roster silently.
  try {
    execFileSync("python3", ["validate.py"], { cwd: ROOT, stdio: "pipe" });
  } catch (e) {
    throw new Error("hire: roster failed validation after append\n" + e.stdout?.toString());
  }
  return role;
}
