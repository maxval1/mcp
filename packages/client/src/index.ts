import * as readline from "node:readline";
import { spawn } from "node:child_process";
import { intro, isCancel, select, text } from "@clack/prompts";
import chalk from "chalk";
import "dotenv/config";
import { Tool, Resource, Content } from "./types.js";
import { callAiWithTools, dumpContent } from "./utils.js";

(async () => {
  const serverProcess = spawn("node", ["../server/dist/index.js"], {
    stdio: ["pipe", "pipe", "inherit"],
  });

  const rl = readline.createInterface({
    input: serverProcess.stdout,
    output: undefined,
  });

  let lastId = 0;

  async function send(
    method: string,
    params: Record<string, unknown> = {},
    isNotification?: boolean,
  ) {
    serverProcess.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id: isNotification ? undefined : lastId++,
      }) + "\n",
    );

    if (isNotification) {
      return;
    }

    const json = await new Promise<string>((res) => {
      rl.question("", res);
    });

    return JSON.parse(json).result;
  }

  const {
    serverInfo,
    capabilities,
  }: {
    serverInfo: { name: string; version: string };
    capabilities: {
      tools?: unknown[];
      resources?: unknown[];
    };
  } = await send("initialize", {
    protocolVersion: "20250-03-26",
    capabilities: {},
    clientInfo: {
      name: "My Client",
      version: "1.0.0",
    },
  });

  await send("notifications/initialized", {}, true);

  const tools: Array<Tool> = capabilities.tools
    ? (await send("tools/list", { _meta: { progressToken: 1 } })).tools
    : [];

  const resources: Array<Resource> = capabilities.resources
    ? (await send("resources/list", { _meta: { progressToken: 1 } })).resources
    : [];

  intro(`Connected to ${serverInfo.name} v${serverInfo.version}`);

  while (true) {
    const options = [
      {
        value: "ai",
        label: "Asking a question with AI",
      },
    ];

    if (resources.length > 0) {
      options.unshift({ value: "resources", label: "Get a resource" });
    }
    if (tools.length > 0) {
      options.unshift({ value: "tool", label: "Run a tool" });
    }

    const action = await select({
      message: "What would you like to do?",
      options,
    });

    if (isCancel(action)) {
      process.exit(0);
    }

    if (action === "tool") {
      const tool = await select({
        message: "Select a tool",
        options: tools.map((tool) => ({
          value: tool,
          label: tool.name,
        })),
      });

      if (isCancel(tool)) {
        process.exit(0);
      }

      const args: Record<string, string> = {};

      const properties = Object.keys(tool?.inputSchema.properties ?? {}).filter(
        (k) => {
          const prop = tool.inputSchema.properties[k];
          return (
            prop &&
            typeof prop === "object" &&
            "type" in prop &&
            prop.type === "string"
          );
        },
      );

      for (const key of properties) {
        const answer = await text({
          message: key,
          initialValue: "",
        });

        if (isCancel(answer)) {
          process.exit(0);
        }

        args[key] = answer;
      }

      const {
        content,
      }: {
        content: Array<Content>;
      } = await send("tools/call", {
        name: tool.name,
        arguments: args,
      });

      dumpContent(content);
    }

    if (action === "resources") {
      const resource = await select({
        message: "Select a resource.",
        options: resources.map((resource) => ({
          value: resource,
          label: resource.name,
        })),
      });

      if (isCancel(resource)) {
        process.exit(0);
      }

      const {
        contents,
      }: {
        contents: Array<Content>;
      } = await send("resources/call", {
        uri: resource.uri,
      });

      dumpContent(contents);
    }

    if (action === "ai") {
      const prompt = await text({
        message: "What would you like to ask?",
        initialValue: "What kind of resources do you have?",
      });

      if (isCancel(prompt)) {
        process.exit(0);
      }

      const messages: Array<{
        role: string;
        content: any;
        type?: string;
        text?: string;
        name?: string;
        input?: string;
        id?: string;
      }> = [{ role: "user", content: prompt }];
      const promptResult = await callAiWithTools(messages, tools);

      messages.push({
        role: "assistant",
        content: promptResult,
      });

      console.log(promptResult);

      if (!Array.isArray(promptResult)) {
        process.exit(0);
      }

      for (const toll of promptResult) {
        if (toll.type === "string") {
          console.log(toll.text);
        }
      }

      const lastMessage = promptResult[promptResult.length - 1] || {};

      if (lastMessage.type === "tool_use") {
        console.log(
          chalk.blueBright(
            `Using tool: ${lastMessage.name} - ${JSON.stringify(lastMessage.input)}`,
          ),
        );

        const { content }: { content: Array<Content> } = await send(
          "tools/call",
          {
            name: lastMessage.name,
            arguments: lastMessage.input,
          },
        );

        messages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: lastMessage.id,
              content: content[0].text,
            },
          ],
        });

        const followUpResult = await callAiWithTools(messages, tools);

        for (const tool of followUpResult) {
          if (tool.type === "string") {
            console.log(tool.text);
          }
        }
      }
    }
  }
})();
