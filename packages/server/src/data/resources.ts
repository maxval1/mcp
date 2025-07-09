import { drinks } from "./drinks.js";

export const resources = [
  {
    uri: "menu://app",
    name: "menu",
    get: async () => {
      return {
        contents: [
          {
            uri: "menu://app",
            text: JSON.stringify(drinks),
          },
        ],
      };
    },
  },
];
