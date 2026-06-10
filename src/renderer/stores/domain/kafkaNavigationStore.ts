import { create } from "zustand";
import type { TopicWorkView, View } from "../../uiTypes";
import { resolveValue, type SetValue } from "./storeUtils";

type KafkaNavigationStore = {
  viewByServer: Record<string, View>;
  topicViewByServer: Record<string, Record<string, TopicWorkView>>;
  selectedTopicByServer: Record<string, string>;
  openedTopicTabsByServer: Record<string, string[]>;
  setViewByServer: (value: SetValue<Record<string, View>>) => void;
  setTopicViewByServer: (value: SetValue<Record<string, Record<string, TopicWorkView>>>) => void;
  setSelectedTopicByServer: (value: SetValue<Record<string, string>>) => void;
  setOpenedTopicTabsByServer: (value: SetValue<Record<string, string[]>>) => void;
};

export const useKafkaNavigationStore = create<KafkaNavigationStore>((set) => ({
  viewByServer: {},
  topicViewByServer: {},
  selectedTopicByServer: {},
  openedTopicTabsByServer: {},
  setViewByServer: (viewByServer) => set((current) => ({ viewByServer: resolveValue(viewByServer, current.viewByServer) })),
  setTopicViewByServer: (topicViewByServer) => set((current) => ({
    topicViewByServer: resolveValue(topicViewByServer, current.topicViewByServer)
  })),
  setSelectedTopicByServer: (selectedTopicByServer) => set((current) => ({
    selectedTopicByServer: resolveValue(selectedTopicByServer, current.selectedTopicByServer)
  })),
  setOpenedTopicTabsByServer: (openedTopicTabsByServer) => set((current) => ({
    openedTopicTabsByServer: resolveValue(openedTopicTabsByServer, current.openedTopicTabsByServer)
  }))
}));
