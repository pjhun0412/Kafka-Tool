export * from "./consumeTypes";
export * from "./feedbackTypes";
export * from "./topicTypes";
export * from "./workspaceTypes";

export const emptyServer = {
  name: "",
  brokers: "localhost:9092",
  ssl: false,
  oauthEnabled: false,
  oauthTokenEndpoint: "",
  oauthClientId: "",
  oauthClientSecret: "",
  oauthScope: "",
  oauthAudience: "",
  schemaRegistryUrl: "",
  schemaRegistryAuthType: "none" as "none" | "basic" | "bearer",
  schemaRegistryUsername: "",
  schemaRegistryPassword: "",
  schemaRegistryToken: ""
};

export const fontOptions = [
  { value: "D2Coding, Consolas, 'Courier New', monospace", label: "D2Coding stack" },
  { value: "Consolas, 'Courier New', monospace", label: "Consolas stack" },
  { value: "'JetBrains Mono', Consolas, monospace", label: "JetBrains Mono stack" },
  { value: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", label: "System UI stack" }
];
