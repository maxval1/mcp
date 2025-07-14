export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    properties: Record<string, unknown>;
  };
}

export interface Resource {
  uri: string;
  name: string;
}

export interface Content {
  text: string;
}

export interface Message {
  role: string;
  content: string;
}
