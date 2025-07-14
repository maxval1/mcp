import { callAI } from "./client.js";
import { Content, Message, Tool } from "./types.js";

export function dumpContent(content: Array<Content>): void {
  for (const line of content) {
    try {
      console.log(JSON.parse(line.text));
    } catch (error) {
      console.log(line.text);
    }
  }
}

export async function callAiWithTools(
  messages: Array<Message>,
  tools: Array<Tool>,
): Promise<
  Array<{
    id?: string;
    type?: string;
    content?: string;
    text?: string;
    name?: string;
    input?: string;
  }>
> {
  const r = await callAI(
    messages,
    tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema,
    })),
  );

  return r;
}
