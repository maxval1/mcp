import * as readline from "node:readline";
import { stdin, stdout } from "node:process";
import { serverInfo } from "./serverInfo.js";

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
              },
              serverInfo,
            });
            break;
          }
          default:
            console.log(`Unknown method: ${json.method}`);
        }
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }
})();
