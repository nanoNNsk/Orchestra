// Self-check for memory load/append round-trip. Run: node src/memory.test.mjs
import assert from "node:assert";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadMemory, appendMemory } from "./memory.mjs";

const ID = "test-mem-role";
const FILE = fileURLToPath(new URL(`../memory/${ID}.md`, import.meta.url));

try {
  assert.equal(loadMemory(ID), "", "no memory before first write");

  appendMemory(ID, "first task", "first result");
  let m = loadMemory(ID);
  assert.ok(m.includes("first task") && m.includes("first result"), "first entry persists");

  appendMemory(ID, "second task", "second result");
  m = loadMemory(ID);
  assert.ok(m.includes("first task") && m.includes("second task"), "append keeps prior entries");

  console.log("memory.test: OK");
} finally {
  rmSync(FILE, { force: true });
}
