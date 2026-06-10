import { WorkspaceAppLayout } from "./components/workspace/WorkspaceAppLayout";
import { useWorkspaceAppController } from "./hooks/app/useWorkspaceAppController";

export function App() {
  const workspaceLayoutProps = useWorkspaceAppController();

  return <WorkspaceAppLayout {...workspaceLayoutProps} />;
}
