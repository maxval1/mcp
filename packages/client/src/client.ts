import { Message } from "./types.js";

export async function callAI(messages: Array<Message>, tools: Array<unknown>) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4096,
      messages,
      tools,
    }),
  });

  const data = await response.json();
  return data;
}
