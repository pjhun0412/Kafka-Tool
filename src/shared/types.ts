export type ServerProfile = {
  id: string;
  name: string;
  brokers: string[];
};

export type TopicSummary = {
  name: string;
  partitions: number;
  replicationFactor: number;
};

export type TopicDetail = {
  name: string;
  partitions: Array<{
    partition: number;
    leader: number;
    replicas: number[];
    isr: number[];
  }>;
  offsets: Array<{
    partition: number;
    low: string;
    high: string;
  }>;
};

export type ConsumerGroupSummary = {
  groupId: string;
  state?: string;
  protocol?: string;
};

export type ConsumerGroupLagRow = {
  topic: string;
  partition: number;
  currentOffset: string;
  endOffset: string;
  lag: string;
  metadata?: string;
};

export type ConsumerGroupLagDetail = {
  groupId: string;
  state?: string;
  protocol?: string;
  members: number;
  totalLag: string;
  rows: ConsumerGroupLagRow[];
};

export type AppPreferences = {
  favoriteTopicsByServer: Record<string, string[]>;
  consumeDefaultsByServer: Record<string, Partial<{
    mode: "offset" | "timeRange" | "live";
    limit: number;
    partition: string;
    offsetOrder: "asc" | "desc";
    autoScroll: boolean;
    maxMessages: number;
    filterField: "all" | "key" | "value" | "offset" | "partition" | "timestamp";
  }>>;
  layout?: Partial<{
    sidebarWidth: number;
    serverPanelHeight: number;
    messagePaneHeight: number;
  }>;
  windowBounds?: Partial<{
    x: number;
    y: number;
    width: number;
    height: number;
    maximized: boolean;
  }>;
};

export type AppSettingsBundle = {
  version: number;
  exportedAt: string;
  servers: ServerProfile[];
  preferences: AppPreferences;
};

export type ImportSettingsResult = {
  servers: ServerProfile[];
  preferences: AppPreferences;
};

export type ProducedMessage = {
  topic: string;
  partition?: number;
  offset?: string;
};

export type ConsumedMessage = {
  serverId?: string;
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
  key: string;
  value: string;
  headers: Record<string, string>;
};

export type MessageExportFormat = "json" | "csv";

export type MessageExportRequest = {
  topic: string;
  format: MessageExportFormat;
  messages: ConsumedMessage[];
};

export type StartConsumeRequest = {
  serverId: string;
  topic: string;
  fromBeginning: boolean;
  partition?: number;
};

export type StopConsumeRequest = {
  serverId?: string;
  topic?: string;
};

export type ProduceRequest = {
  serverId: string;
  topic: string;
  key?: string;
  value: string;
};

export type ConsumeOffsetRequest = {
  serverId: string;
  topic: string;
  partition: number;
  offset: string;
  limit: number;
};

export type ConsumeTimeRangeRequest = {
  serverId: string;
  topic: string;
  partition?: number;
  startTimestamp: number;
  endTimestamp: number;
  limit: number;
};

export type KafkaApi = {
  listServers: () => Promise<ServerProfile[]>;
  saveServer: (server: Omit<ServerProfile, "id"> & { id?: string }) => Promise<ServerProfile[]>;
  deleteServer: (id: string) => Promise<ServerProfile[]>;
  reorderServers: (ids: string[]) => Promise<ServerProfile[]>;
  exportSettings: () => Promise<string | null>;
  importSettings: () => Promise<ImportSettingsResult | null>;
  loadPreferences: () => Promise<AppPreferences>;
  savePreferences: (preferences: AppPreferences) => Promise<AppPreferences>;
  listTopics: (serverId: string) => Promise<TopicSummary[]>;
  getTopicDetail: (serverId: string, topic: string) => Promise<TopicDetail>;
  listConsumerGroups: (serverId: string) => Promise<ConsumerGroupSummary[]>;
  getConsumerGroupLag: (serverId: string, groupId: string) => Promise<ConsumerGroupLagDetail>;
  exportMessages: (request: MessageExportRequest) => Promise<string | null>;
  produce: (message: ProduceRequest) => Promise<ProducedMessage[]>;
  consumeFromOffset: (request: ConsumeOffsetRequest) => Promise<ConsumedMessage[]>;
  consumeTimeRange: (request: ConsumeTimeRangeRequest) => Promise<ConsumedMessage[]>;
  startConsume: (request: StartConsumeRequest) => Promise<void>;
  stopConsume: (request?: StopConsumeRequest) => Promise<void>;
  onConsumeMessage: (callback: (message: ConsumedMessage) => void) => () => void;
  onConsumeError: (callback: (error: string) => void) => () => void;
  onSettingsImported: (callback: (result: ImportSettingsResult) => void) => () => void;
  onSettingsExported: (callback: (filePath: string) => void) => () => void;
  onSettingsError: (callback: (error: string) => void) => () => void;
};
