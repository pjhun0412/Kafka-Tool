import type { ComponentProps } from "react";
import { WorkspaceAppLayout } from "../../components/workspace/WorkspaceAppLayout";

type WorkspaceLayoutCompositionParams = ComponentProps<typeof WorkspaceAppLayout>;

export function useWorkspaceLayoutComposition(params: WorkspaceLayoutCompositionParams) {
  return params;
}
