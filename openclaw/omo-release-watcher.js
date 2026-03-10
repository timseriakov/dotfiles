#!/usr/bin/env node

/**
 * oh-my-openagent Release Watcher
 *
 * Polls GitHub releases for code-yeongyu/oh-my-openagent,
 * tracks last seen tag, and sends LLM-generated explanatory notifications
 * about new features and how to use them.
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import os from "node:os";

// Configuration
const CONFIG = {
  repo: "code-yeongyu/oh-my-openagent",
  stateDir: path.join(os.homedir(), ".openclaw-watch"),
  stateFile: "omo_last_tag.txt",
  checkIntervalMinutes: 120,
  openclawConfigPath:
    process.env.OPENCLAW_CONFIG_PATH ||
    path.join(os.homedir(), ".openclaw", "openclaw.json"),
};

// Read required env vars
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
let TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
let TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

if (!OPENAI_API_KEY) {
  console.error("[ERROR] OPENAI_API_KEY not set in environment");
  process.exit(1);
}

function loadTelegramFromOpenClawConfig() {
  try {
    const raw = fs.readFileSync(CONFIG.openclawConfigPath, "utf-8");
    const parsed = JSON.parse(raw);
    const channel = parsed?.channels?.telegram || {};
    const tokenFromConfig = channel.botToken || "";
    const chatFromAllowList =
      Array.isArray(channel.allowFrom) && channel.allowFrom.length > 0
        ? String(channel.allowFrom[0])
        : "";

    return {
      token: tokenFromConfig,
      chatId: chatFromAllowList,
    };
  } catch (e) {
    console.error(
      `[WARN] Could not read OpenClaw config ${CONFIG.openclawConfigPath}: ${e.message}`,
    );
    return { token: "", chatId: "" };
  }
}

/**
 * Fetch from GitHub API
 */
async function fetchGitHub(path) {
  const url = `https://api.github.com/repos/${CONFIG.repo}${path}`;
  const options = {
    headers: {
      "User-Agent": "openclaw-release-watcher/1.0",
      ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    },
  };

  return new Promise((resolve, reject) => {
    https
      .get(url, options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`JSON parse failed: ${e.message}`));
            }
          } else {
            reject(
              new Error(
                `GitHub API error: ${res.statusCode} ${res.statusMessage}`,
              ),
            );
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * Fetch commits between two tags
 */
async function fetchCommits(prevTag, newTag) {
  try {
    const compare = await fetchGitHub(`/compare/${prevTag}...${newTag}`);
    const commits = compare.commits || [];
    return commits.map((c) => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message.split("\n")[0],
    }));
  } catch (e) {
    console.error(`[WARN] Could not fetch commits: ${e.message}`);
    return [];
  }
}

/**
 * Generate LLM summary using OpenAI API
 */
async function generateSummary(latest, prev, commits) {
  const prompt = `
Ты release-аналитик. Сожми релиз для практического использования.

Проект: ${CONFIG.repo}
Новый релиз: ${latest.tag_name} (${latest.name || ""})
Предыдущий релиз: ${prev ? prev.tag_name : "N/A"}
Ссылка: ${latest.html_url}

Release body:
${latest.body || ""}

Ключевые коммиты (первые 25):
${commits
  .slice(0, 25)
  .map((c) => `- ${c.sha} ${c.message}`)
  .join("\n")}

Сформируй ответ СТРОГО в формате Telegram HTML (parse_mode=HTML), не Markdown.
Разрешены только теги: <b>, <i>, <code>, <pre>.
Не используй заголовки с решетками, fenced code blocks и markdown-списки.

Структура:
<b>Что нового</b>
• пункт

<b>Кому важно</b>
• пункт

<b>Как использовать</b>
• пункт

<b>Что проверить после обновления</b>
• пункт

<b>Риски/совместимость</b>
• пункт

Пиши по-русски, без воды, максимально прикладно.
`;

  const options = {
    hostname: "api.openai.com",
    port: 443,
    path: "/v1/responses",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            const output = response.output?.[0]?.content?.[0]?.text || "";
            const normalized = output.replace(/^\s*-\s+/gm, "• ");
            resolve(normalized);
          } catch (e) {
            reject(new Error(`Parse LLM response failed: ${e.message}`));
          }
        } else {
          reject(
            new Error(
              `OpenAI API error: ${res.statusCode} ${res.statusMessage}`,
            ),
          );
        }
      });
    });

    req.on("error", reject);
    req.write(
      JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
      }),
    );
    req.end();
  });
}

/**
 * Send message to Telegram
 */
function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: "HTML",
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(
              new Error(
                `Telegram error: ${res.statusCode} ${res.statusMessage}`,
              ),
            );
          }
        });
      },
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Get or create last seen tag
 */
function getLastSeenTag() {
  const stateFile = path.join(CONFIG.stateDir, CONFIG.stateFile);
  try {
    if (fs.existsSync(stateFile)) {
      return fs.readFileSync(stateFile, "utf-8").trim();
    }
  } catch (e) {
    console.error(`[WARN] Could not read state file: ${e.message}`);
  }
  return null;
}

/**
 * Save last seen tag
 */
function saveLastSeenTag(tag) {
  const stateFile = path.join(CONFIG.stateDir, CONFIG.stateFile);
  try {
    if (!fs.existsSync(CONFIG.stateDir)) {
      fs.mkdirSync(CONFIG.stateDir, { recursive: true });
    }
    fs.writeFileSync(stateFile, tag, "utf-8");
  } catch (e) {
    console.error(`[ERROR] Could not write state file: ${e.message}`);
  }
}

/**
 * Main check loop
 */
async function checkForNewRelease() {
  try {
    console.log(
      `[${new Date().toISOString()}] Checking ${CONFIG.repo} for new releases...`,
    );

    const releases = await fetchGitHub("/releases?per_page=2");
    if (!releases || releases.length === 0) {
      console.log("[INFO] No releases found");
      return;
    }

    const latest = releases[0];
    const prev = releases.length > 1 ? releases[1] : null;
    const latestTag = latest.tag_name;

    const lastSeen = getLastSeenTag();
    console.log(
      `[INFO] Latest: ${latestTag}, Last seen: ${lastSeen || "none"}`,
    );

    if (latestTag === lastSeen) {
      console.log("[INFO] No new release");
      return;
    }

    console.log(`[INFO] New release detected: ${latestTag}`);

    // Fetch commits for comparison
    const commits = prev ? await fetchCommits(prev.tag_name, latestTag) : [];

    // Generate summary
    console.log("[INFO] Generating LLM summary...");
    const summary = await generateSummary(latest, prev, commits);

    // Send notification
    const message = `<b>Новый релиз ${CONFIG.repo}: ${latestTag}</b>\n${latest.html_url}\n\n${summary}`;
    console.log("[INFO] Sending Telegram notification...");
    await sendTelegram(message);

    // Update state
    saveLastSeenTag(latestTag);
    console.log("[SUCCESS] Notification sent and state updated");
  } catch (e) {
    const message = String(e.message || e);
    if (message.includes("rate limit")) {
      console.error(`[WARN] GitHub API rate limit hit: ${message}`);
      console.log("[INFO] Skipping this run; will retry on next schedule");
      return;
    }
    console.error(`[ERROR] Check failed: ${message}`);
    throw e;
  }
}

/**
 * Entry point
 */
async function main() {
  const configTelegram = loadTelegramFromOpenClawConfig();
  if (!TELEGRAM_BOT_TOKEN) {
    TELEGRAM_BOT_TOKEN = configTelegram.token;
  }
  if (!TELEGRAM_CHAT_ID) {
    TELEGRAM_CHAT_ID = configTelegram.chatId;
  }

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("[ERROR] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID are missing");
    console.error(
      "[HINT] Set env vars or configure channels.telegram.botToken + channels.telegram.allowFrom in ~/.openclaw/openclaw.json",
    );
    process.exit(1);
  }

  console.log("[START] oh-my-openagent Release Watcher");
  console.log("[INFO] OPENAI_API_KEY configured");
  console.log("[INFO] TELEGRAM_BOT_TOKEN configured");
  console.log(`[INFO] Chat ID: ${TELEGRAM_CHAT_ID}`);
  console.log("[INFO] State directory:", CONFIG.stateDir);
  console.log("");

  // Single check mode (for cron/scheduled execution)
  await checkForNewRelease();

  console.log("");
  console.log("[DONE] Exiting");
  process.exit(0);
}

// Run
main().catch((error) => {
  console.error("[FATAL]", error);
  process.exit(1);
});
