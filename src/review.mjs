// Roster status + review. Shows the full inventory — skill registry, every
// department, every role with its skills — and flags roles whose descriptions
// overlap so the Chairman can merge duplicates by hand. Run: node src/review.mjs
import { load } from "./roster.mjs";

const STOP = new Set("a an the and or for to of in on with your you role".split(" "));
const words = (s) =>
  new Set(s.toLowerCase().match(/[a-z]+/g)?.filter((w) => w.length > 2 && !STOP.has(w)) || []);
const overlap = (a, b) => [...a].filter((w) => b.has(w)).length;

const data = load();

// Skill registry.
console.log(`SKILLS (${data.skills.length})`);
for (const s of data.skills) console.log(`    ${s.id} — ${s.description}`);
console.log();

// Departments, roles, and each role's skills.
console.log(`DEPARTMENTS (${data.departments.length}) · ROLES (${data.roles.length})\n`);
let flagged = 0;
for (const dept of data.departments) {
  const roles = data.roles.filter((r) => r.department === dept.id);
  console.log(`■ ${dept.id} (${roles.length})  head: ${dept.head}`);
  for (const r of roles) {
    const tag = r.created_by && r.created_by !== "seed" ? `  [hired by ${r.created_by}]` : "";
    console.log(`    ${r.id} — ${r.description}`);
    console.log(`        skills: ${r.skills.join(", ") || "(none)"}${tag}`);
  }

  // Flag same-department pairs sharing 2+ meaningful words.
  for (let i = 0; i < roles.length; i++)
    for (let j = i + 1; j < roles.length; j++) {
      const shared = overlap(words(roles[i].description), words(roles[j].description));
      if (shared >= 2) {
        console.log(`    ⚠ overlap: '${roles[i].id}' vs '${roles[j].id}' (${shared} shared terms) — review for merge`);
        flagged++;
      }
    }
  console.log();
}
console.log(flagged ? `${flagged} possible overlap(s) to review.` : "No overlaps flagged.");
