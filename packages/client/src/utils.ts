import { Content } from "./types.js";

export function dumpContent(content: Array<Content>): void {
  for (const line of content) {
    try {
      console.log(JSON.parse(line.text));
    } catch (error) {
      console.log(line.text);
    }
  }
}
