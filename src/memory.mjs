// Per-role memory: the context a role carries between tasks (the "accumulates
// context" half of the design). Stored as plain markdown, one file per role,
// loaded only when that role runs.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DIR = fileURLToPath(new URL("../memory", import.meta.url));
const file = (id) => `${DIR}/${id}.md`;

export function loadMemory(id) {
  return existsSync(file(id)) ? readFileSync(file(id), "utf8").trim() : "";
}

export function appendMemory(id, task, result) {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  const entry = `## ${new Date().toISOString()}\n- Task: ${task}\n- Did: ${result.slice(0, 400)}\n\n`;
  writeFileSync(file(id), (existsSync(file(id)) ? readFileSync(file(id), "utf8") : "") + entry);
  // ponytail: append-only, grows unbounded. Add summarize/compaction when a
  // role's memory file outgrows the model's context budget — not before.
}
