import { useShallow } from "zustand/react/shallow";
import {
  emptyProduceDraft,
  type ProduceDraft,
  useProduceDraftZustandStore
} from "../../stores/domain/produceDraftStore";

export { emptyProduceDraft, type ProduceDraft };

export function useProduceDraftStore() {
  const { produceDraftsByServer, updateProduceDraftFor, resetProduceDrafts } = useProduceDraftZustandStore(useShallow((state) => ({
    produceDraftsByServer: state.produceDraftsByServer,
    updateProduceDraftFor: state.updateProduceDraftFor,
    resetProduceDrafts: state.resetProduceDrafts
  })));

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
