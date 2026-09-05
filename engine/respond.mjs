// Runs on GitHub issue events. Two doors into the agora:
//   [Symposium] <question>   -> new debate on the visitor's question
//   [Join] <conversation-id> -> visitor's message enters an existing thread, table replies
import fs from "node:fs";
import { MODELS, SITE } from "./config.mjs";
import {
  philosophers, readJSON, selectPhilosophers, speak, scoreHeat,
  saveConversation, conversationPath, newId,
} from "./lib.mjs";

const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const issue = event.issue;
if (!issue) throw new Error("no issue in event payload");

const all = philosophers();
const user = issue.user.login;
const title = issue.title.trim();
const body = (issue.body ?? "").replace(/@/g, "@​").replace(/\s+/g, " ").trim().slice(0, 2000);

const gh = (path, method, payload) =>
  fetch(`https://api.github.com/repos/${SITE.repo}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      accept: "application/vnd.github+json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

let conversation;

if (/^\[symposium\]/i.test(title)) {
  const question = (title.replace(/^\[symposium\]\s*/i, "").trim() || body).slice(0, 300);
  if (!question) throw new Error("empty symposium question");
  const seated = selectPhilosophers(question, null, all, 3);
  const messages = [];
  if (body && body !== question)
    messages.push({ speaker_type: "user", speaker: user, content: body, created_at: new Date().toISOString() });
  for (let r = 0; r < 2; r++) {
    for (const phil of seated) {
      const { text: content, provenance } = await speak({
        model: MODELS.dialogue, phil, topic: question, messages, roster: seated, all,
        instruction: r === 0 && messages.length <= seated.length
          ? `${user} brought this question to the agora. Speak to the question, and to ${user} directly where it helps.`
          : undefined,
      });
      messages.push({ speaker_type: "philosopher", speaker: phil.slug, content, provenance, created_at: new Date().toISOString() });
    }
  }
  conversation = saveConversation({
    id: newId(question),
    topic: question,
    category: null,
    type: "user_initiated",
    status: "active",
    participants: seated.map((p) => p.slug),
    heat: await scoreHeat(messages, all),
    created_at: new Date().toISOString(),
    started_by: user,
    messages,
  });
} else if (/^\[join\]/i.test(title)) {
  const id = title.replace(/^\[join\]\s*/i, "").trim();
  if (!body) throw new Error("empty join message");
  conversation = readJSON(conversationPath(id));
  conversation.messages.push({ speaker_type: "user", speaker: user, content: body, created_at: new Date().toISOString() });
  const seated = conversation.participants.map((s) => all.find((p) => p.slug === s)).filter(Boolean);
  for (const phil of seated) {
    const { text: content, provenance } = await speak({
      model: MODELS.dialogue, phil, topic: conversation.topic,
      messages: conversation.messages, roster: seated, all,
      instruction: `${user}, a visitor, has just sat down and spoken. Answer ${user} directly — engage their actual words, ask them something real, and hold your own position while you do.`,
    });
    conversation.messages.push({ speaker_type: "philosopher", speaker: phil.slug, content, provenance, created_at: new Date().toISOString() });
  }
  conversation.type = "user_joined";
  conversation.heat = await scoreHeat(conversation.messages, all);
  saveConversation(conversation);
} else {
  console.log("not an agora issue, skipping");
  process.exit(0);
}

const url = `${SITE.url}/#/c/${conversation.id}`;
await gh(`/issues/${issue.number}/comments`, "POST", {
  body: `The table has answered. Read the exchange:\n\n${url}\n\nTo speak again, open a new **Join** issue for \`${conversation.id}\`.`,
});
await gh(`/issues/${issue.number}`, "PATCH", { state: "closed" });
console.log(`responded: ${url}`);
