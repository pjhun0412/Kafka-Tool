import { WorkspaceAppLayout } from "./components/workspace/WorkspaceAppLayout";
import { useWorkspaceAppController } from "./useWorkspaceAppController";

export function App() {
  const workspaceLayoutProps = useWorkspaceAppController();

  return <WorkspaceAppLayout {...workspaceLayoutProps} />;
}