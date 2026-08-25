#!/usr/bin/env bun

const PORT = 58372;
const PATH = "/v1/ai/language-model";
const UPSTREAM = "https://router.hwqtpa.easypanel.host/v1/chat/completions";
const SECRETS = "/Users/tim/dev/dotfiles/fish/secrets.fish";
const KEY_NAME = "OMNIROUTE_OMP_API_KEY";

const json = (body, status = 200) => Response.json(body, { status });
async function apiKey() {
  const text = await Bun.file(SECRETS).text();
  const match = text.match(new RegExp(`set -gx ${KEY_NAME} ([^\\s]+)`));
  return match?.[1];
}

function openAiMessages(prompt = []) {
  return prompt.map((message) => {
    if (message.role === "system" || message.role === "user") {
      const content = Array.isArray(message.content)
        ? message.content
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("")
        : (message.content ?? "");
      return { role: message.role, content };
    }

    if (message.role === "assistant") {
      const parts = Array.isArray(message.content) ? message.content : [];
      const text = parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");
      const toolCalls = parts
        .filter((part) => part.type === "tool-call")
        .map((part) => ({
          id: part.toolCallId,
          type: "function",
          function: {
            name: part.toolName,
            arguments: JSON.stringify(part.input ?? {}),
          },
        }));
      return {
        role: "assistant",
        content: text || null,
        ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
      };
    }

    const part = Array.isArray(message.content) ? message.content[0] : {};
    return {
      role: "tool",
      tool_call_id: part.toolCallId ?? "",
      content: part.output?.value ?? "",
    };
  });
}

function openAiTools(tools = []) {
  return tools
    .filter((tool) => tool.type === "function")
    .map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description ?? "",
        parameters: tool.inputSchema ?? {},
      },
    }));
}

function gatewayToOpenAi(body, model) {
  const request = {
    model: model || "cx/gpt-5.6-luna",
    messages: openAiMessages(body.prompt),
    stream: false,
  };
  if (body.maxOutputTokens != null) request.max_tokens = body.maxOutputTokens;
  const tools = openAiTools(body.tools);
  if (tools.length) request.tools = tools;
  if (body.toolChoice?.type === "required") request.tool_choice = "required";
  else if (body.toolChoice?.type === "none") request.tool_choice = "none";
  return request;
}

function sse(response, model) {
  const choice = response.choices?.[0] ?? {};
  const message = choice.message ?? {};
  const events = [
    {
      type: "response-metadata",
      modelId: model,
      timestamp: new Date().toISOString(),
    },
  ];
  if (message.content)
    events.push({ type: "text-delta", id: "answer", delta: message.content });
  for (const call of message.tool_calls ?? []) {
    const input = JSON.parse(call.function?.arguments || "{}");
    events.push({
      type: "tool-call",
      toolCallId: call.id,
      toolName: call.function?.name ?? "",
      input,
    });
  }
  events.push({
    type: "finish",
    finishReason: {
      unified: message.tool_calls?.length ? "tool-calls" : "stop",
    },
  });
  return events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");
}

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: PORT,
  async fetch(request) {
    if (request.method !== "POST" || new URL(request.url).pathname !== PATH)
      return new Response("Not found", { status: 404 });
    try {
      const body = await request.json();
      const key = await apiKey();
      if (!key)
        return json({ error: { message: `${KEY_NAME} is not set` } }, 500);
      const model =
        request.headers
          .get("ai-language-model-id")
          ?.replace(/^openai\//, "cx/") ?? "cx/gpt-5.6-luna";
      const upstream = await fetch(UPSTREAM, {
        method: "POST",
        headers: {
          authorization: `Bearer ${key}`,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(gatewayToOpenAi(body, model)),
      });
      const response = await upstream.json();
      if (!upstream.ok) return json(response, upstream.status);
      return new Response(sse(response, model), {
        status: 200,
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
        },
      });
    } catch (error) {
      return json({ error: { message: String(error) } }, 502);
    }
  },
});

console.log(
  `fx Omnirouter proxy: http://${server.hostname}:${server.port}${PATH}`,
);
