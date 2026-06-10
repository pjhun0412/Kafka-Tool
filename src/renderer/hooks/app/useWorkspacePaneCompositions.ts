import {
  createPrimaryWorkspacePaneProps,
  createSplitWorkspacePaneProps,
  usePrimaryPaneCallbacks,
  type PrimaryPaneCallbacksParams,
  useSplitPaneCallbacks,
  type SplitPaneCallbacksParams
} from "../callbacks";

type PrimaryPanePropsParams = Omit<Parameters<typeof createPrimaryWorkspacePaneProps>[0], "callbacks">;
type SplitPanePropsParams = Omit<Parameters<typeof createSplitWorkspacePaneProps>[0], "callbacks">;

type WorkspacePaneCompositionsParams = {
  primaryCallbacks: PrimaryPaneCallbacksParams;
  primaryPane: PrimaryPanePropsParams;
  splitCallbacks: SplitPaneCallbacksParams;
  splitPane: SplitPanePropsParams | null;
};

export function useWorkspacePaneCompositions({
  primaryCallbacks: primaryCallbackParams,
  primaryPane,
  splitCallbacks: splitCallbackParams,
  splitPane
}: WorkspacePaneCompositionsParams) {
  const primaryPaneCallbacks = usePrimaryPaneCallbacks(primaryCallbackParams);
  const splitPaneCallbacks = useSplitPaneCallbacks(splitCallbackParams);

  return {
    primaryPaneProps: createPrimaryWorkspacePaneProps({
      ...primaryPane,
      callbacks: primaryPaneCallbacks
    }),
    splitPaneProps: splitPane
      ? createSplitWorkspacePaneProps({
          ...splitPane,
          callbacks: splitPaneCallbacks
        })
      : null
  };
}
