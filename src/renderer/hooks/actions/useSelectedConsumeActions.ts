import type { Dispatch, SetStateAction } from "react";
import type { AppPreferences } from "../../../shared/types";
import type { ConsumeDefaultPatch, TopicConsumeState } from "../../uiTypes";

type SelectedConsumeActionsParams = {
  selectedServerId: string;
  selectedTopic: string;
  selectedDefaultConsumeState: TopicConsumeState;
  setConsumeStates: (
    action:
      | Record<string, TopicConsumeState>
      | ((current: Record<string, TopicConsumeState>) => Record<string, TopicConsumeState>)
  ) => void;
  setConsumeDefaultsByServer: Dispatch<SetStateAction<AppPreferences["consumeDefaultsByServer"]>>;
};

export function useSelectedConsumeActions({
  selectedServerId,
  selectedTopic,
  selectedDefaultConsumeState,
  setConsumeStates,
  setConsumeDefaultsByServer
}: SelectedConsumeActionsParams) {
  function updateSelectedConsumeState(patch: Partial<TopicConsumeState>) {
    if (!selectedTopic) return;
    setConsumeStates((current) => ({
      ...current,
      [selectedTopic]: {
        ...(current[selectedTopic] ?? selectedDefaultConsumeState),
        ...patch
      }
    }));
  }

  function updateConsumeDefaults(patch: ConsumeDefaultPatch) {
    if (!selectedServerId) return;
    const nextPatch = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined)
    ) as ConsumeDefaultPatch;
    if (Object.keys(nextPatch).length === 0) return;
    setConsumeDefaultsByServer((current) => ({
      ...current,
      [selectedServerId]: {
        ...(current[selectedServerId] ?? {}),
        ...nextPatch
      }
    }));
  }

  return {
    updateSelectedConsumeState,
    updateConsumeDefaults
  };
}
