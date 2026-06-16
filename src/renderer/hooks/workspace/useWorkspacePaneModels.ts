import type { BrokerSummary, ConsumerGroupLagDetail, ConsumerGroupSummary, ManualAvroSchema, ServerProfile, TopicDetail, TopicSummary } from "../../../shared/types";
import { emptyConsumeState, type SplitPaneState, type TopicConsumeState, type View, type WorkspacePaneId } from "../../uiTypes";
import type { ConsumeStatesByServer } from "../../workspaceState";

export type WorkspacePaneModel = {
  pane: WorkspacePaneId;
  serverId: string;
  topic: string;
  view: View;
  topicTabs: string[];
  detail: TopicDetail | null;
  server?: ServerProfile;
  topics: TopicSummary[];
  brokers: BrokerSummary[];
  groups: ConsumerGroupSummary[];
  selectedGroupId: string;
  selectedGroupLag: ConsumerGroupLagDetail | null;
  manualAvroSchemas: Record<string, ManualAvroSchema>;
  consumeState: TopicConsumeState;
};

type WorkspacePaneModelsParams = {
  selectedServerId: string;
  selectedTopic: string;
  view: View;
  openedTopicTabs: string[];
  topicDetail: TopicDetail | null;
  visibleSplitPane: SplitPaneState | null;
  servers: ServerProfile[];
  topicsByServer: Record<string, TopicSummary[]>;
  brokersByServer: Record<string, BrokerSummary[]>;
  groupsByServer: Record<string, ConsumerGroupSummary[]>;
  selectedGroupByServer: Record<string, string>;
  groupLagByServer: Record<string, Record<string, ConsumerGroupLagDetail>>;
  manualAvroSchemasByServer: Record<string, Record<string, ManualAvroSchema>>;
  consumeStatesByServer: ConsumeStatesByServer;
  splitConsumeStatesByServer: ConsumeStatesByServer;
  getDefaultConsumeState: (serverId?: string, topic?: string) => TopicConsumeState;
};

export function useWorkspacePaneModels({
  selectedServerId,
  selectedTopic,
  view,
  openedTopicTabs,
  topicDetail,
  visibleSplitPane,
  servers,
  topicsByServer,
  brokersByServer,
  groupsByServer,
  selectedGroupByServer,
  groupLagByServer,
  manualAvroSchemasByServer,
  consumeStatesByServer,
  splitConsumeStatesByServer,
  getDefaultConsumeState
}: WorkspacePaneModelsParams) {
  const primaryGroupId = selectedGroupByServer[selectedServerId] ?? "";
  const primaryModel: WorkspacePaneModel = {
    pane: "primary",
    serverId: selectedServerId,
    topic: selectedTopic,
    view,
    topicTabs: openedTopicTabs,
    detail: topicDetail,
    server: servers.find((server) => server.id === selectedServerId),
    topics: topicsByServer[selectedServerId] ?? [],
    brokers: brokersByServer[selectedServerId] ?? [],
    groups: groupsByServer[selectedServerId] ?? [],
    selectedGroupId: primaryGroupId,
    selectedGroupLag: groupLagByServer[selectedServerId]?.[primaryGroupId] ?? null,
    manualAvroSchemas: manualAvroSchemasByServer[selectedServerId] ?? {},
    consumeState: consumeStatesByServer[selectedServerId]?.[selectedTopic] ?? getDefaultConsumeState(selectedServerId, selectedTopic)
  };

  const splitGroupId = visibleSplitPane ? selectedGroupByServer[visibleSplitPane.serverId] ?? "" : "";
  const splitModel: WorkspacePaneModel | null = visibleSplitPane
    ? {
        pane: "split",
        serverId: visibleSplitPane.serverId,
        topic: visibleSplitPane.topic,
        view: visibleSplitPane.view,
        topicTabs: visibleSplitPane.topicTabs,
        detail: visibleSplitPane.detail,
        server: servers.find((server) => server.id === visibleSplitPane.serverId),
        topics: topicsByServer[visibleSplitPane.serverId] ?? [],
        brokers: brokersByServer[visibleSplitPane.serverId] ?? [],
        groups: groupsByServer[visibleSplitPane.serverId] ?? [],
        selectedGroupId: splitGroupId,
        selectedGroupLag: groupLagByServer[visibleSplitPane.serverId]?.[splitGroupId] ?? null,
        manualAvroSchemas: manualAvroSchemasByServer[visibleSplitPane.serverId] ?? {},
        consumeState: splitConsumeStatesByServer[visibleSplitPane.serverId]?.[visibleSplitPane.topic] ?? getDefaultConsumeState(visibleSplitPane.serverId, visibleSplitPane.topic)
      }
    : null;

  return {
    primaryModel,
    splitModel
  };
}
