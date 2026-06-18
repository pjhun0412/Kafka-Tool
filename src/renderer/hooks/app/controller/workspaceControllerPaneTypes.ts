import type React from "react";
import type { useWorkspacePaneCompositions } from "../workspace/useWorkspacePaneCompositions";
import type { ProduceTemplatePreference } from "../../../../shared/types";

type PaneCompositionParams = Parameters<typeof useWorkspacePaneCompositions>[0];
type PrimaryCallbacks = PaneCompositionParams["primaryCallbacks"];
type PrimaryPane = PaneCompositionParams["primaryPane"];
type SplitCallbacks = PaneCompositionParams["splitCallbacks"];
type SplitPane = NonNullable<PaneCompositionParams["splitPane"]>;
type WorkspacePane = "primary" | "split";
type PaneModel = {
  brokers: PrimaryPane["brokers"];
  groups: PrimaryPane["groups"];
  selectedGroupId: PrimaryPane["selectedGroupId"];
  selectedGroupLag: PrimaryPane["selectedGroupLag"];
};
type ProduceDraft = {
  key: PrimaryPane["produceKey"];
  headers: PrimaryPane["produceHeaders"];
  value: PrimaryPane["produceValue"];
};
type TopicSortingUpdater = Parameters<NonNullable<PrimaryPane["onTopicSortingChange"]>>[0];

export type WorkspacePaneContext = {
  activeWorkspacePane: WorkspacePane;
  activeWorkspaceView: PrimaryPane["activeWorkspaceView"];
  isSelectedServerConnected: PrimaryPane["isSelectedServerConnected"];
  language: PrimaryPane["language"];
  messagePaneHeight: number;
  openClusterIds: PrimaryPane["openClusterIds"];
  selectedServer: PrimaryPane["server"];
  selectedServerId: PrimaryPane["selectedServerId"];
  selectedTopic: PrimaryPane["selectedTopic"];
  setSelectedServerId: PrimaryPane["onSelectCluster"];
  sidebarCollapsed: PrimaryPane["sidebarCollapsed"];
  view: PrimaryPane["view"];
  visibleSplitPane: SplitPane["pane"] | null;
};

export type WorkspacePaneResources = {
  connectedServerIds: PrimaryPane["connectedServerIds"];
  failedServerIds: PrimaryPane["failedServerIds"];
  favoriteTopicNames: PrimaryPane["favoriteTopicNames"];
  groupLagByServer: Record<string, PrimaryPane["groupDetailsById"]>;
  loading: PrimaryPane["loading"];
  manualAvroSchemasByServer: Record<string, PrimaryPane["manualAvroSchemas"]>;
  manualAvroTopicNames: Set<string>;
  openedTopicTabs: PrimaryPane["topicTabs"];
  previewTopic: PrimaryPane["previewTopic"];
  selectedTopicRows: PrimaryPane["selectedTopics"];
  servers: PrimaryPane["servers"];
  sortedTopics: PrimaryPane["topics"];
  produceTemplatesByServer: Record<string, Record<string, ProduceTemplatePreference[]>>;
  setProduceTemplatesByServer: React.Dispatch<React.SetStateAction<Record<string, Record<string, ProduceTemplatePreference[]>>>>;
  topicDetail: PrimaryPane["detail"];
  topicGridSortingByServer: Record<string, PrimaryPane["topicSorting"]>;
  updateTopicGridSortingForServer: (serverId: string, updater: TopicSortingUpdater) => void;
};

export type WorkspacePaneModels = {
  primaryModel: PaneModel;
  primaryPaneToast: PrimaryPane["paneToast"];
  splitModel: PaneModel | null;
  splitPane: SplitPane["pane"] | null;
  splitPaneToast: SplitPane["paneToast"];
  splitServer: SplitPane["server"] | null | undefined;
};

export type WorkspacePaneConsume = Pick<
  PrimaryCallbacks,
  | "exportConsumedMessages"
  | "exportOffsetConditionMessages"
  | "moveOffsetPageFor"
  | "sendMessageToProduce"
  | "startConsume"
  | "stopConsume"
  | "updateConsumeDefaults"
  | "updateSelectedConsumeState"
> &
  Pick<SplitCallbacks, "startConsumeFor" | "updateConsumeStateFor"> & {
    isConsumeTaskActive: (pane: WorkspacePane, serverId: string, topic: string) => boolean;
    isTopicStreaming: (serverId: string, topic: string, pane: WorkspacePane) => boolean;
    selectedConsumeState: PrimaryCallbacks["selectedConsumeState"];
    splitConsumeState: SplitCallbacks["consumeState"];
  };

export type WorkspacePaneProduce = Pick<PrimaryCallbacks, "produce" | "updateProduceDraftFor"> &
  Pick<SplitCallbacks, "produceFor"> & {
    selectedProduceDraft: ProduceDraft;
    splitProduceDraft: ProduceDraft;
  };

export type WorkspacePaneCallbacks = Pick<
  PrimaryCallbacks,
  | "clearDragPayload"
  | "closeClusterTab"
  | "closeTopicTab"
  | "copySelectedTopicNames"
  | "deleteConsumerGroupsFor"
  | "loadConsumerGroupLag"
  | "openManualAvroSchema"
  | "openTopicCreateForm"
  | "openTopicTab"
  | "refreshActiveWorkspaceView"
  | "refreshCurrentView"
  | "refreshGroupsForServer"
  | "requestTopicAction"
  | "selectTopicInWorkspace"
  | "setActiveWorkspacePane"
  | "setSelectedGroupByServer"
  | "setSidebarCollapsed"
  | "setView"
  | "showServerViewInActivePane"
  | "startTopicDrag"
  | "toggleAllTopicRows"
  | "toggleFavoriteTopic"
  | "toggleTopicRow"
> &
  Pick<
    SplitCallbacks,
    | "activateSplitTopic"
    | "closeSplitPane"
    | "closeSplitTopicTab"
    | "loadConsumerGroupLagFor"
    | "refreshSplitPaneView"
    | "showSplitView"
    | "startSplitPaneDrag"
  >;

export type WorkspaceControllerPanesParams = {
  callbacks: WorkspacePaneCallbacks;
  consume: WorkspacePaneConsume;
  context: WorkspacePaneContext;
  models: WorkspacePaneModels;
  produce: WorkspacePaneProduce;
  resources: WorkspacePaneResources;
};
