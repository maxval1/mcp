import { drinks } from "./drinks.js";

export const tools = [
  {
    name: "getDrinkNames",
    description: "Get a list of drink names",
    inputSchema: {
      type: "object",
      properties: {},
    },
    fn: async (args: unknown) => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ names: drinks.map((d) => d.name) }),
          },
        ],
      };
    },
  },
  {
    name: "getDrinkDetails",
    description: "Get details of a drink",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
      },
      required: ["name"],
    },
    fn: async (args: { name: string }) => {
      const { name } = args;
      const drink = drinks.find((d) => d.name === name);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(drink || { error: "Drink not found" }),
          },
        ],
      };
    },
  },
];
