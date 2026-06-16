// Frontend logic check for the chat app — drives chat.html in jsdom with stubbed
// fetch, so the drawer, history, and hire-toast behaviours are verified without a
// real browser or server. Run: node web/chat.test.mjs
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const HTML = readFileSync(fileURLToPath(new URL("./chat.html", import.meta.url)), "utf8");
const ROSTER = JSON.parse(readFileSync(fileURLToPath(new URL("../orchestra.json", import.meta.url)), "utf8"));

// A roster that already contains the freshly-hired role, so the 🆕 badge can render.
const ROSTER_WITH_HIRE = structuredClone(ROSTER);
ROSTER_WITH_HIRE.roles.push({
  id: "songwriter", department: "creative", description: "jingles",
  system_prompt: "x", skills: ["write-prose"], created_by: "head-of-creative",
});

const ASK_HIRED = {
  reply: "Here you go.", department: "creative", roleId: "songwriter", hired: true,
  trace: ["CEO → creative: ...", "creative head → HIRED 'songwriter'", "'songwriter' worked", "CEO → reply"],
};

const makeFetch = (roster) => async (url) => {
  if (url === "/roster") return { json: async () => roster };
  if (url === "/ask") return { json: async () => ASK_HIRED };
  throw new Error("unexpected fetch " + url);
};

function boot(html, { storage = {}, fetchImpl, confirm = () => true } = {}) {
  return new JSDOM(html, {
    runScripts: "dangerously",
    url: "http://localhost:4567/", // non-opaque origin so localStorage works
    beforeParse(window) {
      window.fetch = fetchImpl;
      window.confirm = confirm;
      window.scrollTo = () => {};
      for (const [k, v] of Object.entries(storage)) window.localStorage.setItem(k, v);
    },
  });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, label, tries = 80) {
  for (let i = 0; i < tries; i++) { if (fn()) return; await wait(10); }
  throw new Error("waitFor timed out: " + label);
}

// 1. Drawer renders the org chart + chat shows empty state.
{
  const { window: w } = boot(HTML, { fetchImpl: makeFetch(ROSTER) });
  const doc = w.document;
  await waitFor(() => doc.getElementById("stat").textContent.includes("roles"), "stat");
  assert.match(doc.getElementById("stat").textContent, /11 roles · 6 departments · 12 skills/);
  assert.ok(doc.getElementById("tree").querySelector("details.dept"), "tree has departments");
  assert.match(doc.getElementById("logcol").textContent, /No messages yet/);
}

// 2. Send → history saved, trace + reply rendered, hire toast + 🆕 badge.
{
  const { window: w } = boot(HTML, { fetchImpl: makeFetch(ROSTER_WITH_HIRE) });
  const doc = w.document;
  await waitFor(() => doc.getElementById("stat").textContent.includes("roles"), "stat");
  doc.getElementById("m").value = "write me a jingle";
  doc.getElementById("f").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));

  await waitFor(() => (w.localStorage.getItem("orchestra-chat") || "").includes("Here you go."), "saved reply");
  const saved = JSON.parse(w.localStorage.getItem("orchestra-chat"));
  assert.ok(saved.some((e) => e.type === "you" && e.text === "write me a jingle"), "user msg saved");
  assert.ok(saved.some((e) => e.type === "ceo" && e.text === "Here you go."), "reply saved");
  assert.ok(saved.some((e) => e.type === "trace"), "trace saved");

  await waitFor(() => doc.getElementById("toast").classList.contains("show"), "toast shown");
  assert.match(doc.getElementById("toast").textContent, /songwriter/);
  await waitFor(() => doc.getElementById("tree").textContent.includes("🆕"), "new-hire badge");
}

// 3. History restores across a reload.
{
  const stored = JSON.stringify([
    { type: "you", text: "earlier question" },
    { type: "ceo", text: "earlier answer" },
  ]);
  const { window: w } = boot(HTML, { fetchImpl: makeFetch(ROSTER), storage: { "orchestra-chat": stored } });
  const doc = w.document;
  await waitFor(() => doc.getElementById("logcol").textContent.includes("earlier"), "restore");
  assert.match(doc.getElementById("logcol").textContent, /earlier question/);
  assert.match(doc.getElementById("logcol").textContent, /earlier answer/);
  assert.ok(!doc.getElementById("logcol").textContent.includes("No messages yet"), "not empty state");
}

// 4. Clear empties history (and shows the empty state).
{
  const stored = JSON.stringify([{ type: "you", text: "to be cleared" }]);
  const { window: w } = boot(HTML, { fetchImpl: makeFetch(ROSTER), storage: { "orchestra-chat": stored }, confirm: () => true });
  const doc = w.document;
  await waitFor(() => doc.getElementById("logcol").textContent.includes("to be cleared"), "preload");
  doc.getElementById("clear").click();
  await waitFor(() => (w.localStorage.getItem("orchestra-chat") || "") === "[]", "cleared");
  assert.match(doc.getElementById("logcol").textContent, /No messages yet/);
}

console.log("chat.test: OK");
process.exit(0); // stop dangling jsdom timers/async from racing teardown
