export type ServerProfile = {
  id: string;
  name: string;
  brokers: string[];
  schemaRegistry?: {
    url: string;
    auth?: {
      type: "basic" | "bearer";
      username?: string;
      password?: string;
      token?: string;
    };
  };
  security?: {
    ssl?: boolean;
    sasl?: {
      mechanism: "oauthbearer";
      tokenEndpoint: string;
      clientId: string;
      clientSecret: string;
      scope?: string;
      audience?: string;
    };
  };
};

export type TopicSummary = {
  name: string;
  partitions: number;
  replicationFactor: number;
  messageCount?: string;
  sizeBytes?: string;
};

export type TopicMessageCounts = Record<string, string>;

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

export type TopicConfigEntry = {
  name: string;
  value: string;
  source: string;
  isDefault: boolean;
  isSensitive: boolean;
  readOnly: boolean;
  synonyms: Array<{
    name: string;
    value: string;
    source: string;
  }>;
};

export type BrokerSummary = {
  nodeId: number;
  host: string;
  port: number;
  controller: boolean;
  leaderCount: number;
  replicaCount: number;
  inSyncReplicaCount: number;
  outOfSyncReplicaCount: number;
  onlinePartitionCount: number;
  underReplicatedPartitionCount: number;
  leaderSkewPercent: number;
  partitionSkewPercent: number;
};

export type BrokerConfigEntry = {
  name: string;
  value: string;
  source: string;
  isDefault: boolean;
  isSensitive: boolean;
  readOnly: boolean;
  synonyms: Array<{
    name: string;
    value: string;
    source: string;
  }>;
};

export type BrokerLogDirectory = {
  path: string;
  error?: string;
  topics: Array<{
    topic: string;
    partition: number;
    sizeBytes?: string;
    offsetLag?: string;
    isFuture?: boolean;
  }>;
};

export type BrokerDetail = {
  broker: BrokerSummary;
  configs: BrokerConfigEntry[];
  logDirectories: BrokerLogDirectory[];
  logDirectoriesSupported: boolean;
};

export type BrokerConfigUpdateRequest = {
  serverId: string;
  brokerId: number;
  name: string;
  value: string;
  validateOnly?: boolean;
};

export type TopicConfigUpdateRequest = {
  serverId: string;
  topic: string;
  entries: Array<{
    name: string;
    value: string;
  }>;
  validateOnly?: boolean;
};

export type ConsumerGroupSummary = {
  groupId: string;
  state?: string;
  protocol?: string;
  members?: number;
  coordinator?: string;
  topics?: number;
  assignedPartitions?: number;
  totalLag?: string;
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

export type ManualAvroSchema = {
  encoding: "raw" | "confluent";
  schemaId?: number;
  schema: string;
  updatedAt: string;
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
    filterField: "all" | "key" | "value" | "headers" | "headersEmpty" | "offset" | "partition" | "timestamp";
  }>>;
  manualAvroSchemasByServer?: Record<string, Record<string, ManualAvroSchema>>;
  layout?: Partial<{
    sidebarWidth: number;
    serverPanelHeight: number;
    messagePaneHeight: number;
    sidebarCollapsed: boolean;
  }>;
  appearance?: Partial<{
    fontFamily: string;
    fontSize: number;
  }>;
  exportFormatTemplate?: string;
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
  consumerId?: string;
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
  key: string;
  value: string;
  headers: Record<string, string>;
  decoded?: {
    format: "avro";
    schemaId?: number;
    source?: "registry" | "manual";
    encoding?: "raw" | "confluent";
    value?: unknown;
    error?: string;
  };
};

export type MessageExportFormat = "json" | "csv" | "log";

export type AppPreferenceSection = "general" | "avro";

export type MessageExportRequest = {
  topic: string;
  format: MessageExportFormat;
  messages: ConsumedMessage[];
  template?: string;
};

export type OffsetMessageExportRequest = ConsumeOffsetRequest & {
  format: MessageExportFormat;
  template?: string;
};

export type TopicMutationRequest = {
  serverId: string;
  topics: string[];
};

export type ConsumerGroupMutationRequest = {
  serverId: string;
  groupIds: string[];
};

export type UpdateStatus = {
  status: "checking" | "available" | "not-available" | "download-progress" | "downloaded" | "error";
  message: string;
  version?: string;
  percent?: number;
};

export type StartConsumeRequest = {
  serverId: string;
  topic: string;
  consumerId?: string;
  fromBeginning: boolean;
  partition?: number;
};

export type StopConsumeRequest = {
  serverId?: string;
  topic?: string;
  consumerId?: string;
};

export type ProduceRequest = {
  serverId: string;
  topic: string;
  key?: string;
  value: string;
  headers?: Record<string, string>;
};

export type ConsumeOffsetRequest = {
  serverId: string;
  topic: string;
  partition: number;
  offset: string;
  limit: number;
  order?: "asc" | "desc";
  endOffsetExclusive?: string;
};

export type ConsumeOffsetResult = {
  messages: ConsumedMessage[];
  endOffsetExclusive?: string;
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
  checkForUpdates: () => Promise<void>;
  installUpdate: () => Promise<void>;
  loadPreferences: () => Promise<AppPreferences>;
  savePreferences: (preferences: AppPreferences) => Promise<AppPreferences>;
  checkHealth: (serverId: string) => Promise<void>;
  listTopics: (serverId: string) => Promise<TopicSummary[]>;
  listTopicMessageCounts: (serverId: string, topics: string[]) => Promise<TopicMessageCounts>;
  listBrokers: (serverId: string) => Promise<BrokerSummary[]>;
  getBrokerDetail: (serverId: string, brokerId: number) => Promise<BrokerDetail>;
  updateBrokerConfig: (request: BrokerConfigUpdateRequest) => Promise<BrokerDetail>;
  getTopicDetail: (serverId: string, topic: string) => Promise<TopicDetail>;
  getTopicConfigs: (serverId: string, topic: string) => Promise<TopicConfigEntry[]>;
  updateTopicConfigs: (request: TopicConfigUpdateRequest) => Promise<TopicConfigEntry[]>;
  deleteTopics: (request: TopicMutationRequest) => Promise<void>;
  purgeTopics: (request: TopicMutationRequest) => Promise<void>;
  listConsumerGroups: (serverId: string) => Promise<ConsumerGroupSummary[]>;
  deleteConsumerGroups: (request: ConsumerGroupMutationRequest) => Promise<void>;
  getConsumerGroupLag: (serverId: string, groupId: string) => Promise<ConsumerGroupLagDetail>;
  exportMessages: (request: MessageExportRequest) => Promise<string | null>;
  exportOffsetMessages: (request: OffsetMessageExportRequest) => Promise<string | null>;
  produce: (message: ProduceRequest) => Promise<ProducedMessage[]>;
  consumeFromOffset: (request: ConsumeOffsetRequest) => Promise<ConsumeOffsetResult>;
  consumeTimeRange: (request: ConsumeTimeRangeRequest) => Promise<ConsumedMessage[]>;
  startConsume: (request: StartConsumeRequest) => Promise<void>;
  stopConsume: (request?: StopConsumeRequest) => Promise<void>;
  onConsumeMessage: (callback: (message: ConsumedMessage) => void) => () => void;
  onConsumeError: (callback: (error: string) => void) => () => void;
  onSettingsImported: (callback: (result: ImportSettingsResult) => void) => () => void;
  onSettingsExported: (callback: (filePath: string) => void) => () => void;
  onSettingsError: (callback: (error: string) => void) => () => void;
  onPreferencesOpen: (callback: (section?: AppPreferenceSection) => void) => () => void;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void;
};
