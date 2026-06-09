import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { ServerProfile } from "../../../shared/types";
import { useSearchStore } from "../../stores/ui/searchStore";

type ServerSearchStateParams = {
  servers: ServerProfile[];
  selectedServerId: string;
  contextServerId?: string;
};

export function useServerSearchState({ servers, selectedServerId, contextServerId }: ServerSearchStateParams) {
  const { serverQuery, setServerQuery } = useSearchStore(useShallow((state) => ({
    serverQuery: state.serverQuery,
    setServerQuery: state.setServerQuery
  })));

  const selectedServer = useMemo(
    () => servers.find((server) => server.id === selectedServerId),
    [servers, selectedServerId]
  );
  const contextServer = useMemo(
    () => servers.find((server) => server.id === contextServerId),
    [servers, contextServerId]
  );
  const filteredServers = useMemo(() => {
    const query = serverQuery.trim().toLowerCase();
    if (!query) return servers;
    return servers.filter((server) =>
      server.name.toLowerCase().includes(query) ||
      server.brokers.join(", ").toLowerCase().includes(query)
    );
  }, [serverQuery, servers]);

  return {
    serverQuery,
    setServerQuery,
    selectedServer,
    contextServer,
    filteredServers
  };
}
