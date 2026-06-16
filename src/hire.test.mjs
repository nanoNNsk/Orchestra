// Self-check for the hire path. Backs up the roster, exercises hireRole, restores.
// Run: node src/hire.test.mjs
import assert from "node:assert";
import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { hireRole } from "./hire.mjs";
import { load } from "./roster.mjs";

const ROSTER = fileURLToPath(new URL("../orchestra.json", import.meta.url));
copyFileSync(ROSTER, ROSTER + ".bak");

try {
  const before = load().roles.length;

  // 1. A valid hire is appended, keeps only known skills, and passes validation.
  const role = hireRole("engineering", {
    id: "test-sec-engineer",
    description: "Application security review",
    system_prompt: "You are a Security Engineer.",
    skills: ["review-code", "made-up-skill"], // the bogus one must be dropped
  });
  assert.equal(load().roles.length, before + 1, "role should be appended");
  assert.deepEqual(role.skills, ["review-code"], "unknown skills should be dropped");
  assert.equal(role.created_by, "head-of-engineering");

  // 2. Hiring a duplicate id throws.
  assert.throws(
    () => hireRole("engineering", {
      id: "test-sec-engineer", description: "x", system_prompt: "y", skills: [],
    }),
    /already exists/,
  );

  // 3. A malformed spec throws.
  assert.throws(() => hireRole("engineering", { id: "x" }), /missing/);

  console.log("hire.test: OK");
} finally {
  copyFileSync(ROSTER + ".bak", ROSTER); // restore the seed roster
}
