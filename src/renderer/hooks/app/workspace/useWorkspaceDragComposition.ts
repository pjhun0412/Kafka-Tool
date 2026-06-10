import { useWorkspaceDragDrop, useWorkspaceDragPayloads } from "../../workspace";

type WorkspaceDragCompositionParams = {
  payloads: Parameters<typeof useWorkspaceDragPayloads>[0];
  drop: Parameters<typeof useWorkspaceDragDrop>[0];
};

export function useWorkspaceDragComposition(params: WorkspaceDragCompositionParams) {
  const payloadActions = useWorkspaceDragPayloads(params.payloads);
  const dropActions = useWorkspaceDragDrop(params.drop);

  return {
    payloadActions,
    dropActions
  };
}
