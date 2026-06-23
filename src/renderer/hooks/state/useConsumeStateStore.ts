import type { AppPreferences } from "../../../shared/types";
import { useShallow } from "zustand/react/shallow";
import { emptyConsumeState, type TopicConsumeState, type WorkspacePaneId } from "../../uiTypes";
import { useConsumeStateZustandStore } from "../../stores/domain/consumeStateStore";
import {
  getViewerPreferenceOverride,
  updateTopicViewerPreference,
  type ViewerPreferences
} from "../../viewerPreferences";
import {
  getTopicConsumeState,
  removeTopicConsumeState,
  removeTopicConsumeStates,
  setTopicConsumeState,
  type ConsumeStatesByServer
} from "../../workspaceState";

type ConsumeStateStoreParams = {
  selectedServerId: string;
  consumeDefaults: NonNullable<AppPreferences["consumeDefaults"]>;
  viewerPreferences: Required<ViewerPreferences>;
  setViewerPreferences: (value: Required<ViewerPreferences> | ((current: Required<ViewerPreferences>) => Required<ViewerPreferences>)) => void;
  consumeDefaultsByServer: AppPreferences["consumeDefaultsByServer"];
};

const viewerPreferencePatchKeys = ["inspectorMode", "keyFormat", "valueFormat", "payloadEncoding", "valueColumnPaths", "mapFieldMapping"] as const;

function hasViewerPreferencePatch(patch: Partial<TopicConsumeState>) {
  return viewerPreferencePatchKeys.some((key) => patch[key] !== undefined);
}

export function useConsumeStateStore({
  selectedServerId,
  consumeDefaults,
  viewerPreferences,
  setViewerPreferences,
  consumeDefaultsByServer
}: ConsumeStateStoreParams) {
  const {
    consumeStatesByServer,
    setConsumeStatesByServer,
    splitConsumeStatesByServer,
    setSplitConsumeStatesByServer
  } = useConsumeStateZustandStore(useShallow((state) => ({
    consumeStatesByServer: state.consumeStatesByServer,
    setConsumeStatesByServer: state.setConsumeStatesByServer,
    splitConsumeStatesByServer: state.splitConsumeStatesByServer,
    setSplitConsumeStatesByServer: state.setSplitConsumeStatesByServer
  })));

  function getConsumeBaseline(serverId = selectedServerId): TopicConsumeState {
    return {
      ...emptyConsumeState,
      ...consumeDefaults,
      ...(consumeDefaultsByServer[serverId] ?? {}),
      mode: "offset"
    };
  }

  function getDefaultConsumeState(serverId = selectedServerId, topic = ""): TopicConsumeState {
    return {
      ...getConsumeBaseline(serverId),
      ...getViewerPreferenceOverride(viewerPreferences, serverId, topic)
    };
  }

  function rememberViewerPreference(serverId: string, topic: string, patch: Partial<TopicConsumeState>) {
    setViewerPreferences((current) => updateTopicViewerPreference({
      current,
      serverId,
      topic,
      baseline: getConsumeBaseline(serverId),
      patch
    }));
  }

  function setConsumeStates(action: Record<string, TopicConsumeState> | ((current: Record<string, TopicConsumeState>) => Record<string, TopicConsumeState>)) {
    if (!selectedServerId) return;
    setConsumeStatesByServer((current) => {
      const previous = current[selectedServerId] ?? {};
      const next = typeof action === "function" ? action(previous) : action;
      return { ...current, [selectedServerId]: next };
    });
  }

  function mergeConsumeState(
    current: ConsumeStatesByServer,
    serverId: string,
    topic: string,
    patch: Partial<TopicConsumeState>
  ) {
    const serverStates = current[serverId] ?? {};
    const previous = serverStates[topic] ?? getDefaultConsumeState(serverId, topic);
    return setTopicConsumeState(current, serverId, topic, {
      ...previous,
      ...patch
    });
  }

  function updateConsumeStateFor(serverId: string, topic: string, patch: Partial<TopicConsumeState>, pane: WorkspacePaneId = "primary") {
    if (hasViewerPreferencePatch(patch)) {
      rememberViewerPreference(serverId, topic, patch);
    }
    if (pane === "split") {
      setSplitConsumeStatesByServer((current) => mergeConsumeState(current, serverId, topic, patch));
      return;
    }
    setConsumeStatesByServer((current) => mergeConsumeState(current, serverId, topic, patch));
  }

  function moveConsumeStateBetweenPanes(serverId: string, topic: string, from: WorkspacePaneId, to: WorkspacePaneId) {
    const sourceStates = from === "split" ? splitConsumeStatesByServer : consumeStatesByServer;
    const targetStates = to === "split" ? splitConsumeStatesByServer : consumeStatesByServer;
    const sourceState = getTopicConsumeState(sourceStates, serverId, topic);
    const targetState = getTopicConsumeState(targetStates, serverId, topic);
    const setTargetStates = to === "split" ? setSplitConsumeStatesByServer : setConsumeStatesByServer;
    const setSourceStates = from === "split" ? setSplitConsumeStatesByServer : setConsumeStatesByServer;

    if (sourceState && !targetState) {
      setTargetStates((current) => setTopicConsumeState(current, serverId, topic, sourceState));
    } else if (!sourceState && !targetState) {
      clearConsumeStateForPane(serverId, topic, to);
    }
    setSourceStates((current) => removeTopicConsumeState(current, serverId, topic));
  }

  function clearConsumeStateForPane(serverId: string, topic: string, pane: WorkspacePaneId) {
    const setStates = pane === "split" ? setSplitConsumeStatesByServer : setConsumeStatesByServer;
    setStates((current) => removeTopicConsumeState(current, serverId, topic));
  }

  function clearConsumeStatesForPane(serverId: string, topicsToClear: Iterable<string>, pane: WorkspacePaneId) {
    const setStates = pane === "split" ? setSplitConsumeStatesByServer : setConsumeStatesByServer;
    setStates((current) => removeTopicConsumeStates(current, serverId, topicsToClear));
  }

  return {
    consumeStatesByServer,
    setConsumeStatesByServer,
    splitConsumeStatesByServer,
    setSplitConsumeStatesByServer,
    getDefaultConsumeState,
    setConsumeStates,
    mergeConsumeState,
    rememberViewerPreference,
    updateConsumeStateFor,
    moveConsumeStateBetweenPanes,
    clearConsumeStateForPane,
    clearConsumeStatesForPane
  };
}
