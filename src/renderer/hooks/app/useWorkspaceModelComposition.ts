import { emptyConsumeState } from "../../uiTypes";
import {
  usePaneToastRouting,
  useWorkspacePaneModels,
  useWorkspaceSelectors
} from "../workspace";

type WorkspaceModelCompositionParams = {
  paneModels: Parameters<typeof useWorkspacePaneModels>[0];
  paneToastRouting: Parameters<typeof usePaneToastRouting>[0];
  selectors: Parameters<typeof useWorkspaceSelectors>[0];
};

export function useWorkspaceModelComposition(params: WorkspaceModelCompositionParams) {
  const paneModels = useWorkspacePaneModels(params.paneModels);
  const splitServer = paneModels.splitModel?.server;
  const splitConsumeState = paneModels.splitModel?.consumeState ?? emptyConsumeState;
  const paneToasts = usePaneToastRouting(params.paneToastRouting);
  const selectors = useWorkspaceSelectors(params.selectors);

  return {
    ...paneModels,
    splitServer,
    splitConsumeState,
    ...paneToasts,
    ...selectors
  };
}
