import * as readline from "node:readline";
import { stdin, stdout } from "node:process";
import { serverInfo } from "./data/serverInfo.js";
import { tools } from "./data/tools.js";
import { resources } from "./data/resources.js";

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

function sendResponse(id: number, result: Record<string, unknown>) {
  const response = {
    id,
    result,
    jsonrpc: "2.0",
  };
  console.log(JSON.stringify(response));
}

(async function main() {
  for await (const line of rl) {
    try {
      const json = JSON.parse(line);

      if (json.jsonrpc === "2.0") {
        switch (json.method) {
          case "initialize": {
            sendResponse(json.id, {
              protocolVersion: "2025-03-26",
              capabilities: {
                tools: {
                  listChanged: true,
                },
                resources: {
                  listChanged: true,
                },
              },
              serverInfo,
            });
            break;
          }
          case "tools/list": {
            sendResponse(json.id, {
              tools: tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema,
              })),
            });
            break;
          }
          case "tools/call": {
            const tool = tools.find((t) => t.name === json.params.name);

            if (!tool) {
              sendResponse(json.id, {
                error: {
                  code: -32602,
                  message: `Tool not found: ${json.params.name}`,
                },
              });
              break;
            }

            const input = json.params.arguments;
            const result = await tool.fn(input);
            sendResponse(json.id, result);
            break;
          }
          case "resources/list": {
            sendResponse(json.id, {
              resources: resources.map((resource) => ({
                uri: resource.uri,
                name: resource.name,
              })),
            });
            break;
          }
          case "resources/call": {
            const resource = resources.find((r) => r.uri === json.params.uri);

            if (!resource) {
              sendResponse(json.id, {
                error: {
                  code: -32602,
                  message: `Resource not found: ${json.params.uri}`,
                },
              });
              break;
            }

            const result = await resource.get();
            sendResponse(json.id, result);
            break;
          }
          case "ping": {
            sendResponse(json.id, {});
            break;
          }
        }
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }
})();
