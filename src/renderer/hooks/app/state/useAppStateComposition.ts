import { useShallow } from "zustand/react/shallow";
import { usePreferenceNavigation } from "../../preferences";
import {
  useConsumeStateStore,
  useFeedbackState,
  useLayoutPreferences,
  useProduceDraftStore,
  useServerClusterState,
  useSidebarInteractionState,
  useWorkspacePaneState
} from "../../state";
import { useLiveConsumeRouting, useWorkspaceTasks } from "../../workspace";
import { useServerFormStore } from "../../../stores/ui/serverFormStore";
import { useTopicCreateStore } from "../../../stores/ui/topicCreateStore";
import { useAppResourceState } from "./useAppResourceState";

export function useAppStateComposition() {
  const serverCluster = useServerClusterState();
  const serverForms = useServerFormStore(useShallow((state) => ({
    openNewServerForm: state.openNewServerForm,
    openEditServerForm: state.openEditServerForm
  })));
  const topicCreateForms = useTopicCreateStore(useShallow((state) => ({
    openTopicCreateForm: state.openTopicCreateForm,
    closeTopicCreateForm: state.closeTopicCreateForm
  })));
  const resources = useAppResourceState();
  const consumeState = useConsumeStateStore({
    selectedServerId: serverCluster.selectedServerId,
    consumeDefaults: resources.preferences.consumeDefaults,
    viewerPreferences: resources.preferences.viewerPreferences,
    setViewerPreferences: resources.preferences.setViewerPreferences,
    consumeDefaultsByServer: resources.preferences.consumeDefaultsByServer
  });
  const produceDrafts = useProduceDraftStore();
  const liveConsumeRouting = useLiveConsumeRouting({
    setStreamingTopicsByServer: resources.streaming.setStreamingTopicsByServer
  });
  const feedback = useFeedbackState();
  const workspaceTasks = useWorkspaceTasks({
    setLoading: feedback.setLoading,
    setStatus: feedback.setStatus,
    setToast: feedback.setToast,
    setPaneToast: feedback.setPaneToast,
    setActiveConsumeTaskKeys: feedback.setActiveConsumeTaskKeys
  });
  const layout = useLayoutPreferences();
  const preferences = usePreferenceNavigation();
  const sidebarInteraction = useSidebarInteractionState();
  const workspacePane = useWorkspacePaneState(serverCluster.selectedServerId);

  return {
    serverCluster,
    serverForms,
    topicCreateForms,
    resources,
    consumeState,
    produceDrafts,
    liveConsumeRouting,
    feedback,
    workspaceTasks,
    layout,
    preferences,
    sidebarInteraction,
    workspacePane
  };
}
