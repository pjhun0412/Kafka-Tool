import { useAppRuntimeEffects } from "../layout/useAppRuntimeEffects";

type AppRuntimeEffectsParams = Parameters<typeof useAppRuntimeEffects>[0];

export function useWorkspaceControllerRuntime(params: AppRuntimeEffectsParams) {
  useAppRuntimeEffects(params);
}
