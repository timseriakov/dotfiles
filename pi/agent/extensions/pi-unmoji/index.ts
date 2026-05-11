import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type UnmojiMode = "strip" | "nerd";

type UnmojiConfig = {
  mode?: UnmojiMode;
};

type TextBlock = {
  type: "text";
  text: string;
  textSignature?: string;
};

type AssistantContentBlock =
  | TextBlock
  | {
      type: "thinking";
      thinking: string;
      thinkingSignature?: string;
      redacted?: boolean;
    }
  | {
      type: "toolCall";
      id: string;
      name: string;
      arguments: Record<string, unknown>;
      thoughtSignature?: string;
    };

type AssistantMessageLike = {
  role: "assistant";
  content: AssistantContentBlock[];
  [key: string]: unknown;
};

const CONFIG_PATH = path.join(os.homedir(), ".pi", "agent", "unmoji.json");

const NERD_REPLACEMENTS = new Map<string, string>([
  ["✅", "󰄬"],
  ["❌", "󰅖"],
  ["⚠", ""],
  ["⚠️", ""],
  ["🔥", "󰈸"],
  ["🚀", "󰜎"],
  ["🐛", ""],
  ["📦", "󰏗"],
  ["📝", "󰍨"],
  ["🔍", "󰍉"],
  ["💡", "󰌶"],
  ["🔧", ""],
  ["⚙", ""],
  ["⚙️", ""],
  ["📁", ""],
  ["📄", ""],
  ["🔒", ""],
  ["🔓", ""],
  ["⬆", ""],
  ["⬆️", ""],
  ["⬇", ""],
  ["⬇️", ""],
  ["➡", ""],
  ["➡️", ""],
  ["⬅", ""],
  ["⬅️", ""],
]);

const GRAPHEME_SEGMENTER = new Intl.Segmenter("en", {
  granularity: "grapheme",
});

const RE_KEYCAP = /^[#*0-9]\uFE0F?\u20E3$/u;
const RE_REGIONAL_INDICATORS = /^(?:\p{Regional_Indicator}){1,2}$/u;
const RE_SKIN_TONE = /\p{Emoji_Modifier}/u;
const RE_ZWJ = /\u200D/u;
const RE_VARIATION_SELECTOR = /\uFE0F/u;
const RE_EMOJI_PRESENTATION = /\p{Emoji_Presentation}/u;
const RE_EXTENDED_PICTOGRAPHIC = /\p{Extended_Pictographic}/u;

export default function (pi: ExtensionAPI) {
  // message_update exposes streaming deltas, but public docs only describe message_end
  // as replaceable. Leave streamed chunks untouched and sanitize finalized assistant
  // messages in message_end.
  pi.on("message_update", async () => {
    return;
  });

  pi.on("message_end", async (event) => {
    if (event.message.role !== "assistant") return;

    const config = await loadConfig();
    const originalMessage = event.message as AssistantMessageLike;
    const sanitizedMessage = sanitizeAssistantMessage(
      originalMessage,
      config.mode ?? "strip",
    );

    if (!assistantMessagesEqual(originalMessage, sanitizedMessage)) {
      return { message: sanitizedMessage };
    }

    return;
  });
}

async function loadConfig(): Promise<Required<UnmojiConfig>> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as UnmojiConfig;
    const mode = parsed.mode === "nerd" ? "nerd" : "strip";
    return { mode };
  } catch {
    return { mode: "strip" };
  }
}

function sanitizeAssistantMessage(
  message: AssistantMessageLike,
  mode: UnmojiMode,
): AssistantMessageLike {
  const content = message.content.map((block) => {
    if (block.type !== "text") return block;

    const text = sanitizeMarkdownText(block.text, mode);
    return text === block.text ? block : { ...block, text };
  });

  return { ...message, role: "assistant", content };
}

function sanitizeMarkdownText(markdown: string, mode: UnmojiMode): string {
  let cursor = 0;
  let output = "";

  while (cursor < markdown.length) {
    const fenced = readFencedCodeBlock(markdown, cursor);
    if (fenced) {
      output += fenced.raw;
      cursor = fenced.end;
      continue;
    }

    const inlineCode = readInlineCodeSpan(markdown, cursor);
    if (inlineCode) {
      output += inlineCode.raw;
      cursor = inlineCode.end;
      continue;
    }

    const nextSpecial = findNextSpecialIndex(markdown, cursor);
    const end = nextSpecial === -1 ? markdown.length : nextSpecial;
    const plainText = sanitizePlainText(markdown.slice(cursor, end), mode);
    output += normalizePlainTextChunk(
      plainText,
      output.length === 0 || output.endsWith("\n"),
    );
    cursor = end;
  }

  return output;
}

function sanitizePlainText(text: string, mode: UnmojiMode): string {
  let output = "";

  for (const { segment } of GRAPHEME_SEGMENTER.segment(text)) {
    const replacement = getReplacement(segment, mode);
    if (replacement !== null) {
      output += replacement;
      continue;
    }

    if (isEmojiCluster(segment)) continue;
    output += segment;
  }

  return output;
}

function getReplacement(segment: string, mode: UnmojiMode): string | null {
  if (mode !== "nerd") return null;
  return NERD_REPLACEMENTS.get(segment.normalize("NFC")) ?? null;
}

function isEmojiCluster(segment: string): boolean {
  if (RE_KEYCAP.test(segment)) return true;
  if (RE_REGIONAL_INDICATORS.test(segment)) return true;
  if (RE_SKIN_TONE.test(segment)) return true;
  if (RE_ZWJ.test(segment)) return true;

  const hasVariationSelector = RE_VARIATION_SELECTOR.test(segment);
  const hasEmojiPresentation = RE_EMOJI_PRESENTATION.test(segment);
  const hasExtendedPictographic = RE_EXTENDED_PICTOGRAPHIC.test(segment);

  if (hasEmojiPresentation) return true;
  if (hasExtendedPictographic) return true;
  if (hasVariationSelector) return true;

  return false;
}

function normalizePlainTextChunk(
  text: string,
  startsAtLineStart: boolean,
): string {
  const lines = text.split("\n");

  return lines
    .map((line, index) => {
      const match = /^(\s*)(.*)$/.exec(line);
      if (!match) return line;

      const [, indent, body] = match;
      const normalizedBody = body
        .replace(/[ \t]{2,}/g, " ")
        .replace(/[ \t]+$/g, "");
      const isChunkLineStart = index === 0 ? startsAtLineStart : true;

      if (!isChunkLineStart) {
        return indent + normalizedBody;
      }

      const normalizedIndent = indent.length >= 2 ? indent : "";
      const trimmedBody =
        normalizedIndent === ""
          ? normalizedBody.replace(/^[ \t]+/g, "")
          : normalizedBody;
      return normalizedIndent + trimmedBody;
    })
    .join("\n");
}

function findNextSpecialIndex(text: string, from: number): number {
  const nextBacktick = text.indexOf("`", from);
  const nextFence = findFenceStart(text, from);

  if (nextBacktick === -1) return nextFence;
  if (nextFence === -1) return nextBacktick;
  return Math.min(nextBacktick, nextFence);
}

function findFenceStart(text: string, from: number): number {
  const backtickFence = text.indexOf("\n```", Math.max(0, from - 1));
  const tildeFence = text.indexOf("\n~~~", Math.max(0, from - 1));
  const starts = [backtickFence, tildeFence]
    .filter((value) => value !== -1)
    .map((value) => value + 1);

  if (from === 0) {
    if (text.startsWith("```")) starts.push(0);
    if (text.startsWith("~~~")) starts.push(0);
  }

  return starts.length === 0
    ? -1
    : Math.min(...starts.filter((value) => value >= from));
}

function readFencedCodeBlock(
  text: string,
  index: number,
): { raw: string; end: number } | null {
  if (!isLineStart(text, index)) return null;

  const marker = text[index];
  if (marker !== "`" && marker !== "~") return null;

  const markerLength = countRepeatedChar(text, index, marker);
  if (markerLength < 3) return null;

  const lineEnd = findLineEnd(text, index);
  const opener = text.slice(index, lineEnd);
  if (
    !/^([`~]{3,})([^`]*)?$/.test(opener) &&
    !/^([`~]{3,})([^~]*)?$/.test(opener)
  ) {
    return null;
  }

  let cursor = lineEnd;
  while (cursor < text.length) {
    const nextLineEnd = findLineEnd(text, cursor);
    const lineStart = cursor;
    const line = text.slice(lineStart, nextLineEnd);
    const closingRun = countRepeatedChar(line, 0, marker);

    if (closingRun >= markerLength && line.slice(closingRun).trim() === "") {
      return { raw: text.slice(index, nextLineEnd), end: nextLineEnd };
    }

    cursor = nextLineEnd;
  }

  return { raw: text.slice(index), end: text.length };
}

function readInlineCodeSpan(
  text: string,
  index: number,
): { raw: string; end: number } | null {
  if (text[index] !== "`") return null;
  if (isLineStart(text, index) && countRepeatedChar(text, index, "`") >= 3)
    return null;

  const tickCount = countRepeatedChar(text, index, "`");
  const delimiter = "`".repeat(tickCount);
  const closeIndex = text.indexOf(delimiter, index + tickCount);

  if (closeIndex === -1) return null;
  return {
    raw: text.slice(index, closeIndex + tickCount),
    end: closeIndex + tickCount,
  };
}

function isLineStart(text: string, index: number): boolean {
  return index === 0 || text[index - 1] === "\n";
}

function findLineEnd(text: string, index: number): number {
  const nextNewline = text.indexOf("\n", index);
  return nextNewline === -1 ? text.length : nextNewline + 1;
}

function countRepeatedChar(text: string, index: number, char: string): number {
  let count = 0;
  while (text[index + count] === char) count += 1;
  return count;
}

function assistantMessagesEqual(
  left: AssistantMessageLike,
  right: AssistantMessageLike,
): boolean {
  if (left === right) return true;
  return JSON.stringify(left) === JSON.stringify(right);
}
