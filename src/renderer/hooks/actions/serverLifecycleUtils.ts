import type { ServerProfile } from "../../../shared/types";
import { removeRecordKey } from "../../recordUtils";

export function removeId(list: string[], id: string) {
  return list.filter((item) => item !== id);
}

export function addIdOnce(list: string[], id: string) {
  return list.includes(id) ? list : [...list, id];
}

export function removeServerRecord<T>(record: Record<string, T>, serverId: string) {
  return removeRecordKey(record, serverId);
}

export function reorderServers(
  servers: ServerProfile[],
  draggedId: string,
  targetId: string,
  position: "before" | "after"
) {
  if (draggedId === targetId) return null;
  const draggedIndex = servers.findIndex((server) => server.id === draggedId);
  const targetIndex = servers.findIndex((server) => server.id === targetId);
  if (draggedIndex === -1 || targetIndex === -1) return null;

  const nextServers = [...servers];
  const [dragged] = nextServers.splice(draggedIndex, 1);
  const adjustedTargetIndex = nextServers.findIndex((server) => server.id === targetId);
  const insertIndex = position === "after" ? adjustedTargetIndex + 1 : adjustedTargetIndex;
  nextServers.splice(insertIndex, 0, dragged);
  return nextServers;
}
