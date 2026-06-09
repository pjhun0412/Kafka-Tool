export * from "./consumeTypes";
export * from "./feedbackTypes";
export * from "./topicTypes";
export * from "./workspaceTypes";
import { INTER_FONT_FAMILY, LEGACY_DEFAULT_FONT_FAMILY } from "./fontConfig";

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
  { value: INTER_FONT_FAMILY, label: "Inter + Noto Sans KR" },
  { value: LEGACY_DEFAULT_FONT_FAMILY, label: "D2Coding stack" },
  { value: "Consolas, 'Courier New', monospace", label: "Consolas stack" },
  { value: "'JetBrains Mono', Consolas, monospace", label: "JetBrains Mono stack" }
];
