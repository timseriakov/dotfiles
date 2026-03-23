#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import os from "node:os";

const CONFIG = {
  repo: "code-yeongyu/oh-my-openagent",
  stateDir: path.join(os.homedir(), ".openclaw-watch"),
  stateFile: "omo_last_tag.txt",
  openclawConfigPath: path.join(os.homedir(), ".openclaw", "openclaw.json"),
};

const ZAI_API_KEY = process.env.ZAI_API_KEY;
let TELEGRAM_BOT_TOKEN = "";
let TELEGRAM_CHAT_ID = "";

if (!ZAI_API_KEY) {
  console.error("[ERROR] ZAI_API_KEY not set in environment");
  process.exit(1);
}

function loadConfig() {
  const raw = fs.readFileSync(CONFIG.openclawConfigPath, "utf-8");
  const parsed = JSON.parse(raw);
  const channel = parsed?.channels?.telegram || {};
  return {
    token: channel.botToken || "",
    chatId: Array.isArray(channel.allowFrom) ? String(channel.allowFrom[0]) : "",
  };
}

async function fetchGitHub(apiPath) {
  const url = `https://api.github.com/repos/${CONFIG.repo}${apiPath}`;
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => res.statusCode === 200 ? resolve(JSON.parse(data)) : reject(new Error(`GH error: ${res.statusCode} ${data}`)));
    }).on("error", reject);
  });
}

async function generateSummary(latest, prev, commits) {
  const prompt = `Релиз ${latest.tag_name}. Что нового:\n${latest.body}\n\nКоммиты:\n${commits.map(c => `- ${c.message}`).join("\n")}`;
  const body = JSON.stringify({
    model: "glm-4.7",
    messages: [
        { role: "system", content: "Ты аналитик релизов. Пиши на русском в формате Telegram HTML. Разрешены только <b>, <i>, <code>, <pre>." },
        { role: "user", content: prompt }
    ]
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "open.bigmodel.cn",
      path: "/api/paas/v4/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZAI_API_KEY}`,
        "Content-Length": Buffer.byteLength(body)
      }
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        if (res.statusCode === 200) {
          const resp = JSON.parse(data);
          resolve(resp.choices?.[0]?.message?.content || "No summary");
        } else reject(new Error(`LLM API error: ${res.statusCode} ${data}`));
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function sendTelegram(text) {
  const body = JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" });
  return new Promise((resolve, reject) => {
    const req = https.request(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => res.statusCode === 200 ? resolve(JSON.parse(data)) : reject(new Error(`TG error: ${res.statusCode} ${data}`)));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const t = loadConfig();
  TELEGRAM_BOT_TOKEN = t.token;
  TELEGRAM_CHAT_ID = t.chatId;

  console.log("[START] Release Watcher (Direct ZAI)");
  const releases = await fetchGitHub("/releases?per_page=2");
  const latest = releases[0];
  const lastSeen = fs.existsSync(path.join(CONFIG.stateDir, CONFIG.stateFile)) ? fs.readFileSync(path.join(CONFIG.stateDir, CONFIG.stateFile), "utf-8").trim() : null;

  if (latest.tag_name === lastSeen) {
    console.log("[INFO] No new release");
    return;
  }

  const compare = await fetchGitHub(`/compare/${releases[1].tag_name}...${latest.tag_name}`);
  const commits = compare.commits || [];
  
  console.log("[INFO] Generating summary...");
  const summary = await generateSummary(latest, releases[1], commits);
  await sendTelegram(`<b>Новый релиз ${latest.tag_name}</b>\n\n${summary}`);
  
  if (!fs.existsSync(CONFIG.stateDir)) fs.mkdirSync(CONFIG.stateDir, { recursive: true });
  fs.writeFileSync(path.join(CONFIG.stateDir, CONFIG.stateFile), latest.tag_name);
  console.log("[SUCCESS] Notification sent");
}

main().catch(e => { console.error("[FATAL]", e); process.exit(1); });
