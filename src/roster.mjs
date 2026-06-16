// The org chart lives in orchestra.json. This is the only module that reads or
// writes it, so the hire protocol has one door to go through.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const PATH = fileURLToPath(new URL("../orchestra.json", import.meta.url));

export function load() {
  return JSON.parse(readFileSync(PATH, "utf8"));
}

export function save(data) {
  writeFileSync(PATH, JSON.stringify(data, null, 2) + "\n");
}

export const rolesIn = (data, dept) => data.roles.filter((r) => r.department === dept);
export const getRole = (data, id) => data.roles.find((r) => r.id === id);
export const skillIds = (data) => data.skills.map((s) => s.id);
