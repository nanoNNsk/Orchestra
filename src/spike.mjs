// S1 spike: prove the Codex SDK runs end to end against the ChatGPT-authed CLI.
// Run: node src/spike.mjs
import { Codex } from "@openai/codex-sdk";

const codex = new Codex();
const thread = codex.startThread({
  sandboxMode: "read-only",   // a spike doesn't touch the filesystem
  approvalPolicy: "never",    // non-interactive: never pause for a prompt
  skipGitRepoCheck: true,
});

const turn = await thread.run("Reply with exactly: Orchestra spike OK");
console.log("finalResponse:", turn.finalResponse);
