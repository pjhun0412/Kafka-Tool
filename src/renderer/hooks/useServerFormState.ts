import { useServerFormStore } from "../stores/ui/serverFormStore";

export function useServerFormState() {
  const serverForm = useServerFormStore((state) => state.serverForm);
  const setServerForm = useServerFormStore((state) => state.setServerForm);
  const editingServerId = useServerFormStore((state) => state.editingServerId);
  const setEditingServerId = useServerFormStore((state) => state.setEditingServerId);
  const isServerFormOpen = useServerFormStore((state) => state.isServerFormOpen);
  const setIsServerFormOpen = useServerFormStore((state) => state.setIsServerFormOpen);
  const openNewServerForm = useServerFormStore((state) => state.openNewServerForm);
  const openEditServerForm = useServerFormStore((state) => state.openEditServerForm);
  const closeServerForm = useServerFormStore((state) => state.closeServerForm);

  return {
    serverForm,
    setServerForm,
    editingServerId,
    setEditingServerId,
    isServerFormOpen,
    setIsServerFormOpen,
    openNewServerForm,
    openEditServerForm,
    closeServerForm
  };
}
