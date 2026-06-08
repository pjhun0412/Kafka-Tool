import {
  emptyProduceDraft,
  type ProduceDraft,
  useProduceDraftZustandStore
} from "../stores/domain/produceDraftStore";

export { emptyProduceDraft, type ProduceDraft };

export function useProduceDraftStore() {
  const produceDraftsByServer = useProduceDraftZustandStore((state) => state.produceDraftsByServer);
  const updateProduceDraftFor = useProduceDraftZustandStore((state) => state.updateProduceDraftFor);
  const resetProduceDrafts = useProduceDraftZustandStore((state) => state.resetProduceDrafts);

  function getProduceDraft(serverId: string, topic: string): ProduceDraft {
    if (!serverId || !topic) return emptyProduceDraft;
    return produceDraftsByServer[serverId]?.[topic] ?? emptyProduceDraft;
  }

  return {
    getProduceDraft,
    updateProduceDraftFor,
    resetProduceDrafts
  };
}
