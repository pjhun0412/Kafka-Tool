import { useRef, type Dispatch, type SetStateAction } from "react";
import type { WorkspacePaneId } from "../uiTypes";
import { getConsumeTaskKey, getStreamingTopicKey } from "../workspaceState";

type StreamingTopicsByServer = Record<string, string[]>;

type UseLiveConsumeRoutingOptions = {
  setStreamingTopicsByServer: Dispatch<SetStateAction<StreamingTopicsByServer>>;
};

function getLiveMessageTargetKey(serverId: string, topic: string, consumerId: string) {
  return `${serverId}:${topic}:${consumerId}`;
}

export function useLiveConsumeRouting({ setStreamingTopicsByServer }: UseLiveConsumeRoutingOptions) {
  const messageTargetByTopicRef = useRef<Record<string, WorkspacePaneId>>({});
  const consumerIdByUiKeyRef = useRef<Record<string, WorkspacePaneId>>({});

  function getMessageTarget(serverId: string, topic: string, consumerId?: WorkspacePaneId) {
    if (consumerId) {
      return messageTargetByTopicRef.current[getLiveMessageTargetKey(serverId, topic, consumerId)] ?? consumerId;
    }
    return messageTargetByTopicRef.current[`${serverId}:${topic}`] ?? "primary";
  }

  function setMessageTarget(serverId: string, topic: string, consumerId: WorkspacePaneId, pane: WorkspacePaneId) {
    messageTargetByTopicRef.current[getLiveMessageTargetKey(serverId, topic, consumerId)] = pane;
    messageTargetByTopicRef.current[`${serverId}:${topic}`] = pane;
  }

  function clearMessageTarget(serverId: string, topic: string, consumerId?: WorkspacePaneId) {
    if (consumerId) {
      delete messageTargetByTopicRef.current[getLiveMessageTargetKey(serverId, topic, consumerId)];
      return;
    }
    delete messageTargetByTopicRef.current[`${serverId}:${topic}`];
    delete messageTargetByTopicRef.current[getLiveMessageTargetKey(serverId, topic, "primary")];
    delete messageTargetByTopicRef.current[getLiveMessageTargetKey(serverId, topic, "split")];
  }

  function setStartedConsumer(serverId: string, topic: string, pane: WorkspacePaneId) {
    consumerIdByUiKeyRef.current[getConsumeTaskKey(pane, serverId, topic)] = pane;
    setMessageTarget(serverId, topic, pane, pane);
  }

  function getStopConsumerId(serverId: string, topic: string, pane?: WorkspacePaneId) {
    if (!pane) return undefined;
    return consumerIdByUiKeyRef.current[getConsumeTaskKey(pane, serverId, topic)] ?? pane;
  }

  function clearStoppedConsumer(serverId: string, topic: string, pane: WorkspacePaneId) {
    delete consumerIdByUiKeyRef.current[getConsumeTaskKey(pane, serverId, topic)];
  }

  function retargetLiveTopic(serverId: string, topic: string, fromPane: WorkspacePaneId, toPane: WorkspacePaneId) {
    const fromUiKey = getConsumeTaskKey(fromPane, serverId, topic);
    const toUiKey = getConsumeTaskKey(toPane, serverId, topic);
    const consumerId = consumerIdByUiKeyRef.current[fromUiKey] ?? fromPane;
    consumerIdByUiKeyRef.current[toUiKey] = consumerId;
    delete consumerIdByUiKeyRef.current[fromUiKey];
    setMessageTarget(serverId, topic, consumerId, toPane);
    setStreamingTopicsByServer((current) => {
      const topicKey = getStreamingTopicKey(fromPane, topic);
      const nextTopicKey = getStreamingTopicKey(toPane, topic);
      const topics = current[serverId] ?? [];
      return {
        ...current,
        [serverId]: topics.map((item) => item === topicKey ? nextTopicKey : item)
      };
    });
  }

  return {
    messageTargetByTopicRef,
    consumerIdByUiKeyRef,
    getMessageTarget,
    setStartedConsumer,
    getStopConsumerId,
    clearStoppedConsumer,
    clearMessageTarget,
    retargetLiveTopic
  };
}
