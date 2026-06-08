import type { Dispatch, SetStateAction } from "react";

type TopicFavoritesParams = {
  selectedServerId: string;
  setFavoriteTopicsByServer: Dispatch<SetStateAction<Record<string, string[]>>>;
};

export function useTopicFavorites({
  selectedServerId,
  setFavoriteTopicsByServer
}: TopicFavoritesParams) {
  function toggleFavoriteTopic(topicName: string) {
    if (!selectedServerId) return;
    setFavoriteTopicsByServer((current) => {
      const favorites = current[selectedServerId] ?? [];
      const nextFavorites = favorites.includes(topicName)
        ? favorites.filter((name) => name !== topicName)
        : [...favorites, topicName];
      return {
        ...current,
        [selectedServerId]: nextFavorites
      };
    });
  }

  function reorderFavoriteTopic(draggedTopic: string, targetTopic: string, position: "before" | "after") {
    if (!selectedServerId || draggedTopic === targetTopic) return;
    setFavoriteTopicsByServer((current) => {
      const favorites = current[selectedServerId] ?? [];
      const draggedIndex = favorites.indexOf(draggedTopic);
      const targetIndex = favorites.indexOf(targetTopic);
      if (draggedIndex === -1 || targetIndex === -1) return current;

      const nextFavorites = [...favorites];
      const [dragged] = nextFavorites.splice(draggedIndex, 1);
      const adjustedTargetIndex = nextFavorites.indexOf(targetTopic);
      const insertIndex = position === "after" ? adjustedTargetIndex + 1 : adjustedTargetIndex;
      nextFavorites.splice(insertIndex, 0, dragged);
      return {
        ...current,
        [selectedServerId]: nextFavorites
      };
    });
  }

  return {
    toggleFavoriteTopic,
    reorderFavoriteTopic
  };
}
