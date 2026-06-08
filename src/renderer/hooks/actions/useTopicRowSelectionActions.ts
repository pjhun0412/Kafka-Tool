import type { Dispatch, SetStateAction } from "react";
import type { ToastState } from "../../uiTypes";

type TopicRowSelectionActionParams = {
  selectedTopicRows: string[];
  setSelectedTopicRows: Dispatch<SetStateAction<string[]>>;
  setToast: Dispatch<SetStateAction<ToastState>>;
};

export function useTopicRowSelectionActions({
  selectedTopicRows,
  setSelectedTopicRows,
  setToast
}: TopicRowSelectionActionParams) {
  function toggleTopicRow(topic: string) {
    setSelectedTopicRows((current) =>
      current.includes(topic)
        ? current.filter((item) => item !== topic)
        : [...current, topic]
    );
  }

  function toggleAllTopicRows(topicNames: string[]) {
    setSelectedTopicRows((current) => {
      const names = new Set(topicNames);
      const selectedInView = current.filter((topic) => names.has(topic));
      if (topicNames.length > 0 && selectedInView.length === topicNames.length) {
        return current.filter((topic) => !names.has(topic));
      }
      return [...new Set([...current, ...topicNames])];
    });
  }

  async function copySelectedTopicNames(topicsToCopy = selectedTopicRows) {
    if (topicsToCopy.length === 0) return;
    await navigator.clipboard.writeText(topicsToCopy.join("\n"));
    setToast({ message: `Copied ${topicsToCopy.length} topic name(s).`, kind: "success" });
  }

  return {
    toggleTopicRow,
    toggleAllTopicRows,
    copySelectedTopicNames
  };
}
