import { create } from "zustand";
import { resolveValue, type SetValue } from "./storeUtils";

type KafkaStreamingStore = {
  streamingTopicsByServer: Record<string, string[]>;
  setStreamingTopicsByServer: (value: SetValue<Record<string, string[]>>) => void;
};

export const useKafkaStreamingStore = create<KafkaStreamingStore>((set) => ({
  streamingTopicsByServer: {},
  setStreamingTopicsByServer: (streamingTopicsByServer) => set((current) => ({
    streamingTopicsByServer: resolveValue(streamingTopicsByServer, current.streamingTopicsByServer)
  }))
}));
