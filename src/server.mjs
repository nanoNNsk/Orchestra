// Minimal chat server for Orchestra. No web framework — Node's http is enough
// for one conversation with the CEO. Run: node src/server.mjs  (then open the URL)
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { orchestrate } from "./run.mjs";
import { load } from "./roster.mjs";

const PORT = process.env.PORT || 4567;
const PAGE = fileURLToPath(new URL("../web/chat.html", import.meta.url));

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(readFileSync(PAGE));
  }
  if (req.method === "GET" && req.url === "/roster") {
    // Live org chart for the Company panel — read fresh so hires show up.
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(load()));
  }
  if (req.method === "POST" && req.url === "/ask") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      try {
        const { message } = JSON.parse(body || "{}");
        const out = await orchestrate(String(message || "").trim());
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(out));
      } catch (e) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: String(e.message || e) }));
      }
    });
    return;
  }
  res.writeHead(404).end("not found");
});

server.listen(PORT, () => console.log(`Orchestra chat → http://localhost:${PORT}`));
