import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle, ArrowUpDown, Calendar, CheckCircle2, ChevronDown, ChevronRight, Copy, Database, Download, Filter, HardDrive, Layers, ListTree, Pencil, Play, Plug, Plus, Power, RefreshCw, Send, Square, Star, Trash2, Unplug, Users, X } from "lucide-react";
import type { AppPreferences, BrokerSummary, ConsumedMessage, ConsumerGroupLagDetail, ConsumerGroupSummary, ImportSettingsResult, MessageExportFormat, ServerProfile, TopicDetail, TopicSummary, UpdateStatus } from "../shared/types";
import "./styles.css";

type View = "brokers" | "topics" | "consumers" | "info" | "consume" | "produce";
type TopicWorkView = "info" | "consume" | "produce";
type ConsumeMode = "offset" | "timeRange" | "live";
type ConsumeFilterField = "all" | "key" | "value" | "headers" | "headersEmpty" | "offset" | "partition" | "timestamp";
type OffsetOrder = "asc" | "desc";
type JsonInspectorMode = "raw" | "tree";
type TopicListFilter = "all" | "favorites" | "nonEmpty";
type TopicSortMode = "nameAsc" | "messagesDesc" | "partitionsDesc" | "favoritesFirst";
type ToastState = { message: string; kind: "loading" | "success" | "error" } | null;
type ConsumeDefaultPatch = AppPreferences["consumeDefaultsByServer"][string];
type TopicAction = { kind: "delete" | "purge"; topics: string[] } | null;

type TopicConsumeState = {
  messages: ConsumedMessage[];
  selectedMessage: ConsumedMessage | null;
  mode: ConsumeMode;
  offsetOrder: OffsetOrder;
  offset: string;
  limit: number;
  partition: string;
  timeStart: string;
  timeEnd: string;
  filterText: string;
  filterField: ConsumeFilterField;
  autoScroll: boolean;
  maxMessages: number;
};

const emptyServer = {
  name: "",
  brokers: "localhost:9092",
  ssl: false,
  oauthEnabled: false,
  oauthTokenEndpoint: "",
  oauthClientId: "",
  oauthClientSecret: "",
  oauthScope: "",
  oauthAudience: ""
};
const emptyConsumeState: TopicConsumeState = {
  messages: [],
  selectedMessage: null,
  mode: "offset",
  offsetOrder: "asc",
  offset: "0",
  limit: 10,
  partition: "",
  timeStart: "",
  timeEnd: "",
  filterText: "",
  filterField: "all",
  autoScroll: true,
  maxMessages: 1000
};

const topicSortOptions: Array<{ value: TopicSortMode; label: string }> = [
  { value: "nameAsc", label: "Name A-Z" },
  { value: "messagesDesc", label: "Messages High-Low" },
  { value: "partitionsDesc", label: "Partitions High-Low" },
  { value: "favoritesFirst", label: "Favorites first" }
];

const fontOptions = [
  { value: "D2Coding, Consolas, 'Courier New', monospace", label: "D2Coding stack" },
  { value: "Consolas, 'Courier New', monospace", label: "Consolas stack" },
  { value: "'JetBrains Mono', Consolas, monospace", label: "JetBrains Mono stack" },
  { value: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", label: "System UI stack" }
];

function App() {
  const kafkaApi = window.kafkaApi;
  const [servers, setServers] = useState<ServerProfile[]>([]);
  const [connectedServerIds, setConnectedServerIds] = useState<string[]>([]);
  const [failedServerIds, setFailedServerIds] = useState<string[]>([]);
  const [openClusterIds, setOpenClusterIds] = useState<string[]>([]);
  const [selectedServerId, setSelectedServerId] = useState("");
  const [serverQuery, setServerQuery] = useState("");
  const [serverForm, setServerForm] = useState(emptyServer);
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [isServerFormOpen, setIsServerFormOpen] = useState(false);
  const [viewByServer, setViewByServer] = useState<Record<string, View>>({});
  const [topicViewByServer, setTopicViewByServer] = useState<Record<string, Record<string, TopicWorkView>>>({});
  const [topicsByServer, setTopicsByServer] = useState<Record<string, TopicSummary[]>>({});
  const [topicQueryByServer, setTopicQueryByServer] = useState<Record<string, string>>({});
  const [topicFilterByServer, setTopicFilterByServer] = useState<Record<string, TopicListFilter>>({});
  const [topicSortByServer, setTopicSortByServer] = useState<Record<string, TopicSortMode>>({});
  const [selectedTopicRowsByServer, setSelectedTopicRowsByServer] = useState<Record<string, string[]>>({});
  const [favoriteTopicsByServer, setFavoriteTopicsByServer] = useState<Record<string, string[]>>({});
  const [consumeDefaultsByServer, setConsumeDefaultsByServer] = useState<AppPreferences["consumeDefaultsByServer"]>({});
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [selectedTopicByServer, setSelectedTopicByServer] = useState<Record<string, string>>({});
  const [openedTopicTabsByServer, setOpenedTopicTabsByServer] = useState<Record<string, string[]>>({});
  const [topicDetailByServer, setTopicDetailByServer] = useState<Record<string, TopicDetail | null>>({});
  const [brokersByServer, setBrokersByServer] = useState<Record<string, BrokerSummary[]>>({});
  const [groupsByServer, setGroupsByServer] = useState<Record<string, ConsumerGroupSummary[]>>({});
  const [selectedGroupByServer, setSelectedGroupByServer] = useState<Record<string, string>>({});
  const [groupLagByServer, setGroupLagByServer] = useState<Record<string, Record<string, ConsumerGroupLagDetail>>>({});
  const [consumeStatesByServer, setConsumeStatesByServer] = useState<Record<string, Record<string, TopicConsumeState>>>({});
  const [produceValue, setProduceValue] = useState("{\n  \"hello\": \"kafka\"\n}");
  const [produceKey, setProduceKey] = useState("");
  const [produceHeaders, setProduceHeaders] = useState("{}");
  const [streamingTopicsByServer, setStreamingTopicsByServer] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState("서버를 등록하거나 선택하세요.");
  const [toast, setToast] = useState<ToastState>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const [serverPanelHeight, setServerPanelHeight] = useState(230);
  const [messagePaneHeight, setMessagePaneHeight] = useState(230);
  const [fontFamily, setFontFamily] = useState("D2Coding, Consolas, 'Courier New', monospace");
  const [fontSize, setFontSize] = useState(13);
  const [exportFormatTemplate, setExportFormatTemplate] = useState("[{timestamp}] {topic}[{partition}]@{offset} key={key} headers={headers} value={value}");
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [serverContextMenu, setServerContextMenu] = useState<{ serverId: string; x: number; y: number } | null>(null);
  const [topicContextMenu, setTopicContextMenu] = useState<{ topic: string; x: number; y: number } | null>(null);
  const [isTopicSortMenuOpen, setIsTopicSortMenuOpen] = useState(false);
  const [pendingTopicAction, setPendingTopicAction] = useState<TopicAction>(null);
  const [topicActionConfirmText, setTopicActionConfirmText] = useState("");
  const [connectionError, setConnectionError] = useState<{ serverName: string; brokers: string; message: string } | null>(null);
  const [draggingServerId, setDraggingServerId] = useState("");
  const [serverDropTarget, setServerDropTarget] = useState<{ id: string; position: "before" | "after" } | null>(null);

  const selectedServer = useMemo(
    () => servers.find((server) => server.id === selectedServerId),
    [servers, selectedServerId]
  );
  const contextServer = useMemo(
    () => servers.find((server) => server.id === serverContextMenu?.serverId),
    [servers, serverContextMenu?.serverId]
  );
  const filteredServers = useMemo(() => {
    const query = serverQuery.trim().toLowerCase();
    if (!query) return servers;
    return servers.filter((server) =>
      server.name.toLowerCase().includes(query) ||
      server.brokers.join(", ").toLowerCase().includes(query)
    );
  }, [serverQuery, servers]);
  const isSelectedServerConnected = connectedServerIds.includes(selectedServerId);
  const topics = topicsByServer[selectedServerId] ?? [];
  const topicQuery = topicQueryByServer[selectedServerId] ?? "";
  const topicFilter = topicFilterByServer[selectedServerId] ?? "all";
  const topicSort = topicSortByServer[selectedServerId] ?? "nameAsc";
  const selectedTopic = selectedTopicByServer[selectedServerId] ?? "";
  const selectedTopicRows = selectedTopicRowsByServer[selectedServerId] ?? [];
  const view = viewByServer[selectedServerId] ?? (selectedTopic ? "info" : "topics");
  const openedTopicTabs = openedTopicTabsByServer[selectedServerId] ?? [];
  const topicDetail = topicDetailByServer[selectedServerId] ?? null;
  const brokers = brokersByServer[selectedServerId] ?? [];
  const groups = groupsByServer[selectedServerId] ?? [];
  const selectedGroupId = selectedGroupByServer[selectedServerId] ?? "";
  const selectedGroupLag = groupLagByServer[selectedServerId]?.[selectedGroupId] ?? null;
  const consumeStates = consumeStatesByServer[selectedServerId] ?? {};
  const contextTopic = topicContextMenu?.topic ?? "";

  function getDefaultConsumeState(serverId = selectedServerId): TopicConsumeState {
    return {
      ...emptyConsumeState,
      ...(consumeDefaultsByServer[serverId] ?? {}),
      mode: "offset"
    };
  }

  function setView(view: View) {
    if (!selectedServerId) return;
    setViewByServer((current) => ({ ...current, [selectedServerId]: view }));
    if (isTopicWorkView(view) && selectedTopic) {
      setTopicViewByServer((current) => ({
        ...current,
        [selectedServerId]: {
          ...(current[selectedServerId] ?? {}),
          [selectedTopic]: view
        }
      }));
    }
  }

  function getTopicView(topic: string) {
    return topicViewByServer[selectedServerId]?.[topic] ?? "info";
  }

  function activateTopicView(topic: string) {
    if (!selectedServerId) return;
    setViewByServer((current) => ({ ...current, [selectedServerId]: getTopicView(topic) }));
  }

  function activateSelectedTopicView() {
    if (!selectedTopic) return;
    activateTopicView(selectedTopic);
  }

  function setTopics(topics: TopicSummary[]) {
    if (!selectedServerId) return;
    setTopicsByServer((current) => ({ ...current, [selectedServerId]: topics }));
  }

  function setTopicQuery(topicQuery: string) {
    if (!selectedServerId) return;
    setTopicQueryByServer((current) => ({ ...current, [selectedServerId]: topicQuery }));
  }

  function setTopicFilter(topicFilter: TopicListFilter) {
    if (!selectedServerId) return;
    setTopicFilterByServer((current) => ({ ...current, [selectedServerId]: topicFilter }));
  }

  function setTopicSort(topicSort: TopicSortMode) {
    if (!selectedServerId) return;
    setTopicSortByServer((current) => ({ ...current, [selectedServerId]: topicSort }));
  }

  function setSelectedTopicRows(action: string[] | ((current: string[]) => string[])) {
    if (!selectedServerId) return;
    setSelectedTopicRowsByServer((current) => {
      const previous = current[selectedServerId] ?? [];
      const next = typeof action === "function" ? action(previous) : action;
      return { ...current, [selectedServerId]: next };
    });
  }

  function setSelectedTopic(topic: string) {
    if (!selectedServerId) return;
    setSelectedTopicByServer((current) => ({ ...current, [selectedServerId]: topic }));
  }

  function setOpenedTopicTabs(action: string[] | ((current: string[]) => string[])) {
    if (!selectedServerId) return;
    setOpenedTopicTabsByServer((current) => {
      const previous = current[selectedServerId] ?? [];
      const next = typeof action === "function" ? action(previous) : action;
      return { ...current, [selectedServerId]: next };
    });
  }

  function setTopicDetail(detail: TopicDetail | null) {
    if (!selectedServerId) return;
    setTopicDetailByServer((current) => ({ ...current, [selectedServerId]: detail }));
  }

  function setGroups(groups: ConsumerGroupSummary[]) {
    if (!selectedServerId) return;
    setGroupsByServer((current) => ({ ...current, [selectedServerId]: groups }));
  }

  function setConsumeStates(action: Record<string, TopicConsumeState> | ((current: Record<string, TopicConsumeState>) => Record<string, TopicConsumeState>)) {
    if (!selectedServerId) return;
    setConsumeStatesByServer((current) => {
      const previous = current[selectedServerId] ?? {};
      const next = typeof action === "function" ? action(previous) : action;
      return { ...current, [selectedServerId]: next };
    });
  }

  const filteredTopics = useMemo(() => {
    const query = topicQuery.trim().toLowerCase();
    const favoriteTopicNames = favoriteTopicsByServer[selectedServerId] ?? [];
    return topics.filter((topic) => {
      const matchesSearch = !query || topic.name.toLowerCase().includes(query);
      const count = parseTopicCount(topic.messageCount);
      const matchesFilter =
        topicFilter === "all" ||
        (topicFilter === "favorites" && favoriteTopicNames.includes(topic.name)) ||
        (topicFilter === "nonEmpty" && count > 0n);
      return matchesSearch && matchesFilter;
    });
  }, [favoriteTopicsByServer, selectedServerId, topicFilter, topicQuery, topics]);

  const favoriteTopicNames = favoriteTopicsByServer[selectedServerId] ?? [];
  const sortedTopics = useMemo(
    () => sortTopics(filteredTopics, topicSort, favoriteTopicNames),
    [favoriteTopicNames, filteredTopics, topicSort]
  );
  const favoriteTopics = useMemo(
    () => favoriteTopicNames
      .map((name) => sortedTopics.find((topic) => topic.name === name))
      .filter((topic): topic is TopicSummary => Boolean(topic)),
    [favoriteTopicNames, sortedTopics]
  );
  const nonFavoriteFilteredTopics = useMemo(
    () => sortedTopics.filter((topic) => !favoriteTopicNames.includes(topic.name)),
    [favoriteTopicNames, sortedTopics]
  );

  const selectedDefaultConsumeState = getDefaultConsumeState();
  const selectedConsumeState = consumeStates[selectedTopic] ?? selectedDefaultConsumeState;

  function updateSelectedConsumeState(patch: Partial<TopicConsumeState>) {
    if (!selectedTopic) return;
    setConsumeStates((current) => ({
      ...current,
      [selectedTopic]: {
        ...(current[selectedTopic] ?? selectedDefaultConsumeState),
        ...patch
      }
    }));
  }

  function updateConsumeDefaults(patch: ConsumeDefaultPatch) {
    if (!selectedServerId) return;
    setConsumeDefaultsByServer((current) => ({
      ...current,
      [selectedServerId]: {
        ...(current[selectedServerId] ?? {}),
        ...patch
      }
    }));
  }

  function startSidebarResize(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;
    const onPointerMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.min(420, Math.max(230, startWidth + moveEvent.clientX - startX));
      setSidebarWidth(nextWidth);
    };
    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function startServerPanelResize(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = serverPanelHeight;
    const onPointerMove = (moveEvent: PointerEvent) => {
      const maxHeight = Math.max(190, window.innerHeight - 330);
      const nextHeight = Math.min(maxHeight, Math.max(170, startHeight + moveEvent.clientY - startY));
      setServerPanelHeight(nextHeight);
    };
    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function openServerContextMenu(event: React.MouseEvent, server: ServerProfile) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedServerId(server.id);
    setServerContextMenu({
      serverId: server.id,
      x: Math.min(event.clientX, window.innerWidth - 170),
      y: Math.min(event.clientY, window.innerHeight - 140)
    });
  }

  function closeServerContextMenu() {
    setServerContextMenu(null);
  }

  function openTopicContextMenu(event: React.MouseEvent, topic: string) {
    event.preventDefault();
    event.stopPropagation();
    activateTopicView(topic);
    setSelectedTopic(topic);
    setTopicContextMenu({
      topic,
      x: Math.min(event.clientX, window.innerWidth - 190),
      y: Math.min(event.clientY, window.innerHeight - 190)
    });
  }

  function closeTopicContextMenu() {
    setTopicContextMenu(null);
  }

  function getServerConnectionClass(serverId: string) {
    if (connectedServerIds.includes(serverId)) return "connection-dot connected";
    if (failedServerIds.includes(serverId)) return "connection-dot failed";
    return "connection-dot";
  }

  async function reorderServer(draggedId: string, targetId: string, position: "before" | "after") {
    if (!kafkaApi || draggedId === targetId) return;
    const draggedIndex = servers.findIndex((server) => server.id === draggedId);
    const targetIndex = servers.findIndex((server) => server.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const nextServers = [...servers];
    const [dragged] = nextServers.splice(draggedIndex, 1);
    const adjustedTargetIndex = nextServers.findIndex((server) => server.id === targetId);
    const insertIndex = position === "after" ? adjustedTargetIndex + 1 : adjustedTargetIndex;
    nextServers.splice(insertIndex, 0, dragged);
    setServers(nextServers);
    try {
      const savedServers = await kafkaApi.reorderServers(nextServers.map((server) => server.id));
      setServers(savedServers);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
      setToast({ message, kind: "error" });
      const originalServers = await kafkaApi.listServers();
      setServers(originalServers);
    }
  }

  function toggleFavoriteTopic(topicName: string) {
    if (!selectedServerId) return;
    setFavoriteTopicsByServer((current) => {
      const favorites = current[selectedServerId] ?? [];
      const nextFavorites = favorites.includes(topicName)
        ? favorites.filter((name) => name !== topicName)
        : [...favorites, topicName];
      return {
        ...current,
        [selectedServerId]: nextFavorites
      };
    });
  }

  useEffect(() => {
    if (!kafkaApi) {
      setStatus("Electron preload API is not available. Restart npm run dev.");
      return;
    }
    void kafkaApi.listServers().then((items) => {
      setServers(items);
      if (items[0]) {
        setSelectedServerId(items[0].id);
      }
    }).catch((error) => setStatus(error instanceof Error ? error.message : String(error)));
  }, [kafkaApi]);

  useEffect(() => {
    if (!kafkaApi) {
      return;
    }
    void kafkaApi.loadPreferences().then((preferences) => {
      setFavoriteTopicsByServer(preferences.favoriteTopicsByServer ?? {});
      setConsumeDefaultsByServer(preferences.consumeDefaultsByServer ?? {});
      if (typeof preferences.layout?.sidebarWidth === "number") {
        setSidebarWidth(preferences.layout.sidebarWidth);
      }
      if (typeof preferences.layout?.serverPanelHeight === "number") {
        setServerPanelHeight(preferences.layout.serverPanelHeight);
      }
      if (typeof preferences.layout?.messagePaneHeight === "number") {
        setMessagePaneHeight(preferences.layout.messagePaneHeight);
      }
      if (typeof preferences.appearance?.fontFamily === "string") {
        setFontFamily(preferences.appearance.fontFamily);
      }
      if (typeof preferences.appearance?.fontSize === "number") {
        setFontSize(preferences.appearance.fontSize);
      }
      if (typeof preferences.exportFormatTemplate === "string") {
        setExportFormatTemplate(preferences.exportFormatTemplate);
      }
      setPreferencesLoaded(true);
    }).catch((error) => {
      setStatus(error instanceof Error ? error.message : String(error));
      setPreferencesLoaded(true);
    });
  }, [kafkaApi]);

  useEffect(() => {
    if (!kafkaApi || !preferencesLoaded) {
      return;
    }
    void kafkaApi.savePreferences({
      favoriteTopicsByServer,
      consumeDefaultsByServer,
      layout: {
        sidebarWidth,
        serverPanelHeight,
        messagePaneHeight
      },
      appearance: {
        fontFamily,
        fontSize
      },
      exportFormatTemplate
    }).catch((error) => setStatus(error instanceof Error ? error.message : String(error)));
  }, [kafkaApi, preferencesLoaded, favoriteTopicsByServer, consumeDefaultsByServer, sidebarWidth, serverPanelHeight, messagePaneHeight, fontFamily, fontSize, exportFormatTemplate]);

  useEffect(() => {
    if (!kafkaApi) {
      return;
    }
    const offMessage = kafkaApi.onConsumeMessage((message) => {
      setConsumeStatesByServer((current) => {
        const serverId = message.serverId ?? selectedServerId;
        if (!serverId) return current;
        const serverStates = current[serverId] ?? {};
        const previous = serverStates[message.topic] ?? getDefaultConsumeState(serverId);
        const maxMessages = previous.maxMessages || emptyConsumeState.maxMessages;
        return {
          ...current,
          [serverId]: {
            ...serverStates,
            [message.topic]: {
              ...previous,
              messages: [message, ...previous.messages].slice(0, maxMessages),
              selectedMessage: previous.selectedMessage ?? message
            }
          }
        };
      });
    });
    const offError = kafkaApi.onConsumeError((error) => {
      setStatus(error);
    });
    return () => {
      offMessage();
      offError();
    };
  }, [kafkaApi, selectedServerId, consumeDefaultsByServer]);

  useEffect(() => {
    if (!kafkaApi) {
      return;
    }
    const offPreferencesOpen = kafkaApi.onPreferencesOpen(() => setIsPreferencesOpen(true));
    return () => {
      offPreferencesOpen();
    };
  }, [kafkaApi]);

  useEffect(() => {
    const safeFontFamily = sanitizeFontFamily(fontFamily) || "D2Coding, Consolas, 'Courier New', monospace";
    document.documentElement.style.setProperty("--app-font-family", safeFontFamily);
    document.documentElement.style.setProperty("--app-mono-font-family", safeFontFamily);
    document.documentElement.style.setProperty("--app-font-size", `${Math.min(16, Math.max(11, fontSize))}px`);
  }, [fontFamily, fontSize]);

  useEffect(() => {
    if (!kafkaApi) {
      return;
    }
    const offImported = kafkaApi.onSettingsImported((result) => {
      applyImportedSettings(result);
      setStatus("설정 가져오기 완료");
      setToast({ message: "설정 가져오기 완료", kind: "success" });
    });
    const offExported = kafkaApi.onSettingsExported((filePath) => {
      setStatus(`설정 내보내기 완료: ${filePath}`);
      setToast({ message: "설정 내보내기 완료", kind: "success" });
    });
    const offSettingsError = kafkaApi.onSettingsError((error) => {
      setStatus(error);
      setToast({ message: error, kind: "error" });
    });
    return () => {
      offImported();
      offExported();
      offSettingsError();
    };
  }, [kafkaApi]);

  useEffect(() => {
    if (!kafkaApi) {
      return;
    }
    const offUpdateStatus = kafkaApi.onUpdateStatus((updateStatus: UpdateStatus) => {
      const kind = updateStatus.status === "error"
        ? "error"
        : updateStatus.status === "checking" || updateStatus.status === "available" || updateStatus.status === "download-progress"
          ? "loading"
          : "success";
      setStatus(updateStatus.message);
      setToast({ message: updateStatus.message, kind });
    });
    return () => {
      offUpdateStatus();
    };
  }, [kafkaApi]);

  useEffect(() => {
    if (selectedServerId) {
      if (connectedServerIds.includes(selectedServerId)) {
        if (!topicsByServer[selectedServerId]) {
          void refreshTopics();
        }
        if (!brokersByServer[selectedServerId]) {
          void refreshBrokers();
        }
        if (!groupsByServer[selectedServerId]) {
          void refreshGroups();
        }
      } else {
        setTopics([]);
        setBrokersByServer((current) => ({ ...current, [selectedServerId]: [] }));
        setGroups([]);
        setSelectedTopic("");
        setTopicDetail(null);
      }
    }
  }, [selectedServerId]);

  async function runTask<T>(label: string, task: () => Promise<T>) {
    setLoading(true);
    setStatus(label);
    setToast({ message: label, kind: "loading" });
    try {
      const result = await task();
      setStatus("완료");
      setToast({ message: "완료", kind: "success" });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
      setToast({ message, kind: "error" });
      throw error;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!toast) return;
    if (toast.kind === "loading") return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!serverContextMenu) return;
    const close = () => closeServerContextMenu();
    window.addEventListener("click", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", close);
    };
  }, [serverContextMenu]);

  useEffect(() => {
    if (!topicContextMenu) return;
    const close = () => closeTopicContextMenu();
    window.addEventListener("click", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", close);
    };
  }, [topicContextMenu]);

  useEffect(() => {
    if (!isTopicSortMenuOpen) return;
    const close = () => setIsTopicSortMenuOpen(false);
    window.addEventListener("click", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", close);
    };
  }, [isTopicSortMenuOpen]);

  function buildServerSecurity(): ServerProfile["security"] | undefined {
    if (!serverForm.ssl && !serverForm.oauthEnabled) {
      return undefined;
    }
    return {
      ssl: serverForm.ssl,
      sasl: serverForm.oauthEnabled
        ? {
          mechanism: "oauthbearer",
          tokenEndpoint: serverForm.oauthTokenEndpoint.trim(),
          clientId: serverForm.oauthClientId.trim(),
          clientSecret: serverForm.oauthClientSecret,
          scope: serverForm.oauthScope.trim() || undefined,
          audience: serverForm.oauthAudience.trim() || undefined
        }
        : undefined
    };
  }

  async function saveServer() {
    if (!kafkaApi) return;
    const nextServers = await runTask("서버 저장 중", () =>
      kafkaApi.saveServer({
        id: editingServerId ?? undefined,
        name: serverForm.name,
        brokers: serverForm.brokers.split(",").map((broker) => broker.trim()),
        security: buildServerSecurity()
      })
    );
    setServers(nextServers);
    setSelectedServerId(editingServerId ?? nextServers[nextServers.length - 1]?.id ?? "");
    setServerForm(emptyServer);
    setEditingServerId(null);
    setIsServerFormOpen(false);
  }

  async function deleteServer(id: string) {
    if (!kafkaApi) return;
    const nextServers = await runTask("서버 삭제 중", () => kafkaApi.deleteServer(id));
    setServers(nextServers);
    setConnectedServerIds((current) => current.filter((serverId) => serverId !== id));
    setFailedServerIds((current) => current.filter((serverId) => serverId !== id));
    setOpenClusterIds((current) => current.filter((serverId) => serverId !== id));
    setSelectedServerId(nextServers[0]?.id ?? "");
    setOpenedTopicTabs([]);
    setSelectedTopic("");
    setTopicDetail(null);
    setConsumeStates({});
    setViewByServer((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setTopicViewByServer((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setStreamingTopicsByServer((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function openNewServerForm() {
    setEditingServerId(null);
    setServerForm(emptyServer);
    setIsServerFormOpen(true);
  }

  function openEditServerForm(server: ServerProfile) {
    setEditingServerId(server.id);
    setServerForm({
      name: server.name,
      brokers: server.brokers.join(", "),
      ssl: Boolean(server.security?.ssl),
      oauthEnabled: server.security?.sasl?.mechanism === "oauthbearer",
      oauthTokenEndpoint: server.security?.sasl?.tokenEndpoint ?? "",
      oauthClientId: server.security?.sasl?.clientId ?? "",
      oauthClientSecret: server.security?.sasl?.clientSecret ?? "",
      oauthScope: server.security?.sasl?.scope ?? "",
      oauthAudience: server.security?.sasl?.audience ?? ""
    });
    setIsServerFormOpen(true);
  }

  function closeServerForm() {
    setEditingServerId(null);
    setServerForm(emptyServer);
    setIsServerFormOpen(false);
  }

  async function connectServer(server: ServerProfile) {
    if (!kafkaApi) return;
    setSelectedServerId(server.id);
    try {
      await runTask("서버 연결 확인 중", async () => {
        await kafkaApi.listTopics(server.id);
        return true;
      });
      setFailedServerIds((current) => current.filter((serverId) => serverId !== server.id));
      setConnectedServerIds((current) => (current.includes(server.id) ? current : [...current, server.id]));
      setOpenClusterIds((current) => (current.includes(server.id) ? current : [...current, server.id]));
      await refreshBrokersForServer(server.id);
      await refreshTopicsForServer(server.id);
      setViewByServer((current) => ({ ...current, [server.id]: current[server.id] ?? "info" }));
      await refreshGroupsForServer(server.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setConnectedServerIds((current) => current.filter((serverId) => serverId !== server.id));
      setFailedServerIds((current) => (current.includes(server.id) ? current : [...current, server.id]));
      setConnectionError({
        serverName: server.name,
        brokers: server.brokers.join(", "),
        message
      });
    }
  }

  async function openCluster(server: ServerProfile) {
    setSelectedServerId(server.id);
    if (connectedServerIds.includes(server.id)) {
      setOpenClusterIds((current) => (current.includes(server.id) ? current : [...current, server.id]));
      return;
    }
    await connectServer(server);
  }

  async function disconnectServer(serverId: string) {
    for (const topic of streamingTopicsByServer[serverId] ?? []) {
      await stopConsume(serverId, topic);
    }
    setConnectedServerIds((current) => current.filter((id) => id !== serverId));
    setFailedServerIds((current) => current.filter((id) => id !== serverId));
    setOpenClusterIds((current) => current.filter((id) => id !== serverId));
    if (selectedServerId === serverId) {
      setTopics([]);
      setBrokersByServer((current) => ({ ...current, [serverId]: [] }));
      setGroups([]);
      setOpenedTopicTabs([]);
      setSelectedTopic("");
      setTopicDetail(null);
      setConsumeStates({});
      setStatus("Disconnected.");
      const nextCluster = openClusterIds.find((id) => id !== serverId) ?? "";
      setSelectedServerId(nextCluster);
    }
  }

  async function closeClusterTab(serverId: string) {
    for (const topic of streamingTopicsByServer[serverId] ?? []) {
      await stopConsume(serverId, topic);
    }
    setOpenClusterIds((current) => current.filter((id) => id !== serverId));
    if (selectedServerId === serverId) {
      const nextCluster = openClusterIds.find((id) => id !== serverId) ?? "";
      setSelectedServerId(nextCluster);
    }
  }

  async function refreshBrokers() {
    if (!selectedServerId) return;
    await refreshBrokersForServer(selectedServerId);
  }

  async function refreshBrokersForServer(serverId: string) {
    if (!kafkaApi) return;
    const items = await runTask("브로커 조회 중", () => kafkaApi.listBrokers(serverId));
    setBrokersByServer((current) => ({ ...current, [serverId]: items }));
  }

  async function refreshTopicsForServer(serverId: string) {
    if (!kafkaApi) return;
    setTopicQueryByServer((current) => ({ ...current, [serverId]: "" }));
    const items = await runTask("토픽 조회 중", () => kafkaApi.listTopics(serverId));
    setTopicsByServer((current) => ({ ...current, [serverId]: items }));
    const topicNames = new Set(items.map((topic) => topic.name));
    setSelectedTopicRowsByServer((current) => ({
      ...current,
      [serverId]: (current[serverId] ?? []).filter((topic) => topicNames.has(topic))
    }));
    const previousSelectedTopic = selectedTopicByServer[serverId] ?? "";
    const nextTopic = previousSelectedTopic && items.some((topic) => topic.name === previousSelectedTopic) ? previousSelectedTopic : items[0]?.name ?? "";
    setSelectedTopicByServer((current) => ({ ...current, [serverId]: nextTopic }));
    if (nextTopic) {
      const detail = await runTask("토픽 상세 조회 중", () => kafkaApi.getTopicDetail(serverId, nextTopic));
      setTopicDetailByServer((current) => ({ ...current, [serverId]: detail }));
    } else {
      setTopicDetailByServer((current) => ({ ...current, [serverId]: null }));
      setOpenedTopicTabsByServer((current) => ({ ...current, [serverId]: [] }));
      setConsumeStatesByServer((current) => ({ ...current, [serverId]: {} }));
    }
  }

  async function refreshTopics() {
    if (!kafkaApi || !selectedServerId) return;
    await refreshTopicsForServer(selectedServerId);
  }

  async function loadTopicDetail(topic: string) {
    if (!kafkaApi || !selectedServerId || !topic) return;
    setSelectedTopic(topic);
    const detail = await runTask("토픽 상세 조회 중", () => kafkaApi.getTopicDetail(selectedServerId, topic));
    setTopicDetail(detail);
  }

  async function openTopicTab(topic: string) {
    setOpenedTopicTabs((current) => (current.includes(topic) ? current : [...current, topic]));
    activateTopicView(topic);
    await loadTopicDetail(topic);
  }

  function toggleTopicRow(topic: string) {
    setSelectedTopicRows((current) =>
      current.includes(topic)
        ? current.filter((item) => item !== topic)
        : [...current, topic]
    );
  }

  function toggleAllTopicRows(topicNames: string[]) {
    setSelectedTopicRows((current) => {
      const names = new Set(topicNames);
      const selectedInView = current.filter((topic) => names.has(topic));
      if (topicNames.length > 0 && selectedInView.length === topicNames.length) {
        return current.filter((topic) => !names.has(topic));
      }
      return [...new Set([...current, ...topicNames])];
    });
  }

  async function copySelectedTopicNames(topicsToCopy = selectedTopicRows) {
    if (topicsToCopy.length === 0) return;
    await navigator.clipboard.writeText(topicsToCopy.join("\n"));
    setToast({ message: `Copied ${topicsToCopy.length} topic name(s).`, kind: "success" });
  }

  function requestTopicAction(kind: "delete" | "purge", topicsToMutate = selectedTopicRows) {
    if (topicsToMutate.length === 0) return;
    setTopicActionConfirmText("");
    setPendingTopicAction({ kind, topics: [...topicsToMutate] });
  }

  function cleanupDeletedTopics(deletedTopics: string[]) {
    const deleted = new Set(deletedTopics);
    setSelectedTopicRows((current) => current.filter((topic) => !deleted.has(topic)));
    setOpenedTopicTabs((current) => current.filter((topic) => !deleted.has(topic)));
    setFavoriteTopicsByServer((current) => ({
      ...current,
      [selectedServerId]: (current[selectedServerId] ?? []).filter((topic) => !deleted.has(topic))
    }));
    setConsumeStates((current) => {
      const next = { ...current };
      for (const topic of deleted) {
        delete next[topic];
      }
      return next;
    });
    setTopicViewByServer((current) => {
      const serverViews = { ...(current[selectedServerId] ?? {}) };
      for (const topic of deleted) {
        delete serverViews[topic];
      }
      return { ...current, [selectedServerId]: serverViews };
    });
    if (deleted.has(selectedTopic)) {
      const nextTopic = topics.find((topic) => !deleted.has(topic.name))?.name ?? "";
      setSelectedTopic(nextTopic);
      if (nextTopic) {
        void loadTopicDetail(nextTopic);
      } else {
        setTopicDetail(null);
      }
    }
  }

  async function confirmTopicAction() {
    if (!kafkaApi || !selectedServerId || !pendingTopicAction) return;
    const action = pendingTopicAction;
    if (topicActionConfirmText.trim().toUpperCase() !== action.kind.toUpperCase()) return;
    setPendingTopicAction(null);
    setTopicActionConfirmText("");
    if (action.kind === "delete") {
      await runTask(`Deleting ${action.topics.length} topic(s)`, () => kafkaApi.deleteTopics({ serverId: selectedServerId, topics: action.topics }));
      cleanupDeletedTopics(action.topics);
      await refreshTopics();
      setToast({ message: `Deleted ${action.topics.length} topic(s).`, kind: "success" });
      return;
    }
    await runTask(`Purging ${action.topics.length} topic(s)`, () => kafkaApi.purgeTopics({ serverId: selectedServerId, topics: action.topics }));
    await refreshTopics();
    if (selectedTopic && action.topics.includes(selectedTopic)) {
      await loadTopicDetail(selectedTopic);
    }
    setToast({ message: `Purged ${action.topics.length} topic(s).`, kind: "success" });
  }

  async function closeTopicTab(topic: string) {
    if ((streamingTopicsByServer[selectedServerId] ?? []).includes(topic)) {
      await stopConsume(selectedServerId, topic);
    }
    const nextTabs = openedTopicTabs.filter((item) => item !== topic);
    setOpenedTopicTabs(nextTabs);
    setConsumeStates((current) => {
      const next = { ...current };
      delete next[topic];
      return next;
    });
    setTopicViewByServer((current) => {
      const serverViews = { ...(current[selectedServerId] ?? {}) };
      delete serverViews[topic];
      return { ...current, [selectedServerId]: serverViews };
    });
    if (selectedTopic !== topic) {
      return;
    }
    const nextTopic = nextTabs[nextTabs.length - 1] ?? "";
    setSelectedTopic(nextTopic);
    if (nextTopic) {
      await loadTopicDetail(nextTopic);
    } else {
      setTopicDetail(null);
    }
  }

  async function refreshGroups() {
    if (!kafkaApi || !selectedServerId) return;
    await refreshGroupsForServer(selectedServerId);
  }

  async function refreshGroupsForServer(serverId: string) {
    if (!kafkaApi) return;
    const items = await runTask("컨슈머 그룹 조회 중", () => kafkaApi.listConsumerGroups(serverId));
    setGroupsByServer((current) => ({ ...current, [serverId]: items }));
    setSelectedGroupByServer((current) => {
      const previous = current[serverId];
      return previous && items.some((group) => group.groupId === previous) ? current : { ...current, [serverId]: "" };
    });
  }

  async function loadConsumerGroupLag(groupId: string) {
    if (!kafkaApi || !selectedServerId) return;
    setSelectedGroupByServer((current) => ({ ...current, [selectedServerId]: groupId }));
    const detail = await runTask("컨슈머 그룹 lag 조회 중", () => kafkaApi.getConsumerGroupLag(selectedServerId, groupId));
    setGroupLagByServer((current) => ({
      ...current,
      [selectedServerId]: {
        ...(current[selectedServerId] ?? {}),
        [groupId]: detail
      }
    }));
  }

  async function produce() {
    if (!kafkaApi || !selectedServerId || !selectedTopic) return;
    const validationError = validateJsonLikeValue(produceValue);
    if (validationError) {
      setStatus(validationError);
      setToast({ message: validationError, kind: "error" });
      return;
    }
    const headers = parseProduceHeaders(produceHeaders);
    if (typeof headers === "string") {
      setStatus(headers);
      setToast({ message: headers, kind: "error" });
      return;
    }
    const result = await runTask("메시지 전송 중", () =>
      kafkaApi.produce({
        serverId: selectedServerId,
        topic: selectedTopic,
        key: produceKey,
        value: produceValue,
        headers
      })
    );
    setStatus(`전송 완료: ${result.map((item) => `p${item.partition}@${item.offset}`).join(", ")}`);
  }

  function sendMessageToProduce(message: ConsumedMessage) {
    setProduceKey(message.key);
    setProduceValue(formatProduceValue(message.value));
    setProduceHeaders(JSON.stringify(message.headers ?? {}, null, 2));
    setView("produce");
    setToast({ message: "메시지를 Produce 탭으로 복사했습니다.", kind: "success" });
  }

  function applyImportedSettings(result: ImportSettingsResult) {
    setServers(result.servers);
    setFavoriteTopicsByServer(result.preferences.favoriteTopicsByServer ?? {});
    setConsumeDefaultsByServer(result.preferences.consumeDefaultsByServer ?? {});
    if (typeof result.preferences.layout?.sidebarWidth === "number") {
      setSidebarWidth(result.preferences.layout.sidebarWidth);
    }
    if (typeof result.preferences.layout?.serverPanelHeight === "number") {
      setServerPanelHeight(result.preferences.layout.serverPanelHeight);
    }
    if (typeof result.preferences.layout?.messagePaneHeight === "number") {
      setMessagePaneHeight(result.preferences.layout.messagePaneHeight);
    }
    if (typeof result.preferences.appearance?.fontFamily === "string") {
      setFontFamily(result.preferences.appearance.fontFamily);
    }
    if (typeof result.preferences.appearance?.fontSize === "number") {
      setFontSize(result.preferences.appearance.fontSize);
    }
    if (typeof result.preferences.exportFormatTemplate === "string") {
      setExportFormatTemplate(result.preferences.exportFormatTemplate);
    }
    setConnectedServerIds([]);
    setFailedServerIds([]);
    setOpenClusterIds([]);
    setSelectedServerId(result.servers[0]?.id ?? "");
    setTopicsByServer({});
    setTopicQueryByServer({});
    setSelectedTopicByServer({});
    setOpenedTopicTabsByServer({});
    setTopicDetailByServer({});
    setBrokersByServer({});
    setGroupsByServer({});
    setViewByServer({});
    setTopicViewByServer({});
    setSelectedGroupByServer({});
    setGroupLagByServer({});
    setConsumeStatesByServer({});
    setStreamingTopicsByServer({});
  }

  async function exportSettings() {
    if (!kafkaApi) return;
    setLoading(true);
    setToast({ message: "설정 내보내기 중", kind: "loading" });
    try {
      const filePath = await kafkaApi.exportSettings();
      if (filePath) {
        setStatus(`설정 내보내기 완료: ${filePath}`);
        setToast({ message: "설정 내보내기 완료", kind: "success" });
      } else {
        setToast(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
      setToast({ message, kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function importSettings() {
    if (!kafkaApi) return;
    if (!window.confirm("현재 서버 목록과 개인 설정을 가져온 파일로 교체할까요?")) {
      return;
    }
    setLoading(true);
    setToast({ message: "설정 가져오기 중", kind: "loading" });
    try {
      const result = await kafkaApi.importSettings();
      if (!result) {
        setToast(null);
        return;
      }
      applyImportedSettings(result);
      setStatus("설정 가져오기 완료");
      setToast({ message: "설정 가져오기 완료", kind: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
      setToast({ message, kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function exportConsumedMessages(format: MessageExportFormat, messages: ConsumedMessage[]) {
    if (!kafkaApi || !selectedTopic) return;
    if (messages.length === 0) {
      setToast({ message: "내보낼 메시지가 없습니다.", kind: "error" });
      return;
    }
    setLoading(true);
    setToast({ message: "메시지 내보내기 중", kind: "loading" });
    try {
      const filePath = await kafkaApi.exportMessages({
        topic: selectedTopic,
        format,
        messages,
        template: exportFormatTemplate
      });
      if (filePath) {
        setStatus(`메시지 내보내기 완료: ${filePath}`);
        setToast({ message: "메시지 내보내기 완료", kind: "success" });
      } else {
        setToast(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
      setToast({ message, kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function startConsume() {
    if (!kafkaApi || !selectedServerId || !selectedTopic) return;
    const state = consumeStates[selectedTopic] ?? selectedDefaultConsumeState;
    const partition = state.partition === "" ? 0 : Number(state.partition);
    if (state.mode === "offset") {
      updateSelectedConsumeState({ messages: [], selectedMessage: null });
      const items = await runTask("offset consume 조회 중", () =>
        kafkaApi.consumeFromOffset({
          serverId: selectedServerId,
          topic: selectedTopic,
          partition,
          offset: state.offset,
          limit: state.limit
        })
      );
      const orderedItems = state.offsetOrder === "desc" ? [...items].reverse() : items;
      updateSelectedConsumeState({ messages: orderedItems, selectedMessage: orderedItems[0] ?? null });
      return;
    }
    if (state.mode === "timeRange") {
      const startTimestamp = state.timeStart ? new Date(state.timeStart).getTime() : NaN;
      const endTimestamp = state.timeEnd ? new Date(state.timeEnd).getTime() : NaN;
      if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp)) {
        setStatus("Start and end datetime are required.");
        return;
      }
      const items = await runTask("time range consume 조회 중", () =>
        kafkaApi.consumeTimeRange({
          serverId: selectedServerId,
          topic: selectedTopic,
          partition: state.partition === "" ? undefined : partition,
          startTimestamp,
          endTimestamp,
          limit: state.limit
        })
      );
      const orderedItems = state.offsetOrder === "desc" ? [...items].reverse() : items;
      updateSelectedConsumeState({ messages: orderedItems, selectedMessage: orderedItems[0] ?? null });
      return;
    }
    await runTask("실시간 consume 시작 중", () =>
      kafkaApi.startConsume({
        serverId: selectedServerId,
        topic: selectedTopic,
        fromBeginning: false,
        partition: state.partition === "" ? undefined : Number(state.partition)
      })
    );
    setStreamingTopicsByServer((current) => {
      const topics = current[selectedServerId] ?? [];
      return {
        ...current,
        [selectedServerId]: topics.includes(selectedTopic) ? topics : [...topics, selectedTopic]
      };
    });
    setStatus("실시간 consume 중");
  }

  async function stopConsume(serverId = selectedServerId, topic = selectedTopic) {
    if (!kafkaApi) return;
    await runTask("live consume 일시정지 중", () => kafkaApi.stopConsume({ serverId, topic }));
    setStreamingTopicsByServer((current) => {
      const nextTopics = (current[serverId] ?? []).filter((item) => item !== topic);
      return {
        ...current,
        [serverId]: nextTopics
      };
    });
  }

  async function refreshCurrentView() {
    if (view === "brokers") {
      await refreshBrokers();
      return;
    }
    if (view === "topics") {
      await refreshTopics();
      return;
    }
    if (view === "consumers") {
      setGroups([]);
      setSelectedGroupByServer((current) => ({ ...current, [selectedServerId]: "" }));
      setGroupLagByServer((current) => ({ ...current, [selectedServerId]: {} }));
      await refreshGroups();
      return;
    }
    if (view === "info") {
      if (selectedTopic) {
        await loadTopicDetail(selectedTopic);
      }
      return;
    }
    if (view === "consume") {
      if (!selectedTopic) return;
      if ((streamingTopicsByServer[selectedServerId] ?? []).includes(selectedTopic)) {
        await stopConsume();
      }
      updateSelectedConsumeState(selectedDefaultConsumeState);
      setStatus("Consume tab reset.");
      return;
    }
    setProduceKey("");
    setProduceHeaders("{}");
    setProduceValue("{\n  \"hello\": \"kafka\"\n}");
    setStatus("Produce tab reset.");
  }

  const isTopicView = view === "info" || view === "consume" || view === "produce";

  return (
    <div className="app-shell" style={{ gridTemplateColumns: `${sidebarWidth}px 6px minmax(0, 1fr)` }}>
      <aside className="sidebar">
        <div className="brand">
          <Database size={24} />
          <div>
            <strong>Kafka Tool</strong>
            <span>Desktop client</span>
          </div>
          <button className="icon-button add-server" onClick={openNewServerForm} title="Add server">
            <Plus size={17} />
          </button>
        </div>

        <section className="sidebar-panel server-panel" style={{ height: serverPanelHeight }}>
          <div className="sidebar-panel-title">
            <span>Name</span>
            <span>Server · {filteredServers.length}/{servers.length}</span>
          </div>
          <div className="search-box server-search">
            <input
              value={serverQuery}
              onChange={(event) => setServerQuery(event.target.value)}
              placeholder="Search server"
            />
            {serverQuery && (
              <button onClick={() => setServerQuery("")} title="Clear server search">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="server-list">
            {filteredServers.map((server) => (
              <button
                key={server.id}
                className={`${server.id === selectedServerId ? "server active" : "server"} ${server.id === draggingServerId ? "dragging" : ""} ${serverDropTarget?.id === server.id ? `drop-${serverDropTarget.position}` : ""}`}
                draggable
                onDragStart={(event) => {
                  setDraggingServerId(server.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", server.id);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  const rect = event.currentTarget.getBoundingClientRect();
                  const position = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
                  if (draggingServerId && draggingServerId !== server.id) {
                    setServerDropTarget({ id: server.id, position });
                  }
                }}
                onDragLeave={() => {
                  if (serverDropTarget?.id === server.id) {
                    setServerDropTarget(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const draggedId = event.dataTransfer.getData("text/plain") || draggingServerId;
                  const position = serverDropTarget?.id === server.id ? serverDropTarget.position : "before";
                  setDraggingServerId("");
                  setServerDropTarget(null);
                  void reorderServer(draggedId, server.id, position);
                }}
                onDragEnd={() => {
                  setDraggingServerId("");
                  setServerDropTarget(null);
                }}
                onClick={() => setSelectedServerId(server.id)}
                onContextMenu={(event) => openServerContextMenu(event, server)}
                onDoubleClick={() => {
                  void openCluster(server);
                }}
              >
                <span className="server-name">
                  <span className={getServerConnectionClass(server.id)} />
                  <strong title={server.name}>{server.name}</strong>
                </span>
                <span className="server-host">
                  <small title={server.brokers.join(", ")}>{server.brokers.join(", ")}</small>
                </span>
              </button>
            ))}
            {servers.length === 0 && <div className="empty-list">No servers</div>}
            {servers.length > 0 && filteredServers.length === 0 && <div className="empty-list">No servers found</div>}
          </div>
        </section>

        <div className="sidebar-stack-resizer" onPointerDown={startServerPanelResize} title="Resize server/topic panels" />

        <section className="sidebar-panel topic-list">
          <div className="section-title">
            <h2>Topics</h2>
            <div className="topic-title-actions">
              <span>{filteredTopics.length}/{topics.length}</span>
              <div className="topic-sort-wrap" onClick={(event) => event.stopPropagation()}>
                <button
                  className="topic-refresh"
                  onClick={() => setIsTopicSortMenuOpen((current) => !current)}
                  title={`Sort: ${getTopicSortLabel(topicSort)}`}
                >
                  <ArrowUpDown size={14} />
                </button>
                {isTopicSortMenuOpen && (
                  <div className="topic-sort-menu">
                    {topicSortOptions.map((option) => (
                      <button
                        key={option.value}
                        className={topicSort === option.value ? "active" : ""}
                        onClick={() => {
                          setTopicSort(option.value);
                          setIsTopicSortMenuOpen(false);
                        }}
                      >
                        <span>{topicSort === option.value ? "✓" : ""}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="topic-refresh" onClick={() => void refreshTopics()} disabled={!isSelectedServerConnected || loading} title="Refresh topics">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
          <div className="search-box topic-search">
            <input value={topicQuery} onChange={(event) => setTopicQuery(event.target.value)} placeholder="Search topic" />
            {topicQuery && (
              <button onClick={() => setTopicQuery("")} title="Clear topic search">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="topic-filter-row">
            <select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value as TopicListFilter)} title="Filter topics">
              <option value="all">All topics</option>
              <option value="favorites">Favorites</option>
              <option value="nonEmpty">Has messages</option>
            </select>
          </div>
          <div className="topic-scroll">
            {favoriteTopics.length > 0 && (
              <div className="favorite-topic-section">
                <div className="favorite-topic-title">Favorites</div>
                {favoriteTopics.map((topic) => (
                  <TopicListItem
                    key={topic.name}
                    topic={topic}
                    active={topic.name === selectedTopic}
                    favorite
                    onSelect={() => {
                      activateTopicView(topic.name);
                      void loadTopicDetail(topic.name);
                    }}
                    onOpen={() => void openTopicTab(topic.name)}
                    onToggleFavorite={() => toggleFavoriteTopic(topic.name)}
                    onContextMenu={(event) => openTopicContextMenu(event, topic.name)}
                  />
                ))}
              </div>
            )}
            {nonFavoriteFilteredTopics.map((topic) => (
              <TopicListItem
                key={topic.name}
                topic={topic}
                active={topic.name === selectedTopic}
                favorite={favoriteTopicNames.includes(topic.name)}
                onSelect={() => {
                  activateTopicView(topic.name);
                  void loadTopicDetail(topic.name);
                }}
                onOpen={() => void openTopicTab(topic.name)}
                onToggleFavorite={() => toggleFavoriteTopic(topic.name)}
                onContextMenu={(event) => openTopicContextMenu(event, topic.name)}
              />
            ))}
            {filteredTopics.length === 0 && <div className="empty-list">No topics found</div>}
          </div>
        </section>
      </aside>

      <div className="sidebar-resizer" onPointerDown={startSidebarResize} title="Resize sidebar" />

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow" title={selectedServer ? selectedServer.brokers.join(", ") : "no server"}>{selectedServer ? selectedServer.brokers.join(", ") : "no server"}</span>
            <h1>{selectedServer?.name ?? "Kafka 서버를 등록하세요"}</h1>
          </div>
        </header>

        <div className="cluster-tabs" aria-label="Opened clusters">
          {openClusterIds.length === 0 ? (
            <div className="cluster-tabs-empty">좌측 서버를 connect 하거나 더블 클릭하면 클러스터 탭으로 열립니다.</div>
          ) : (
            openClusterIds.map((serverId) => {
              const server = servers.find((item) => item.id === serverId);
              if (!server) return null;
              return (
                <button key={serverId} className={serverId === selectedServerId ? "cluster-tab active" : "cluster-tab"} onClick={() => setSelectedServerId(serverId)} title={`${server.name} (${server.brokers.join(", ")})`}>
                  <span className={getServerConnectionClass(serverId)} />
                  <span className="cluster-tab-name">{server.name}</span>
                  <X size={14} onClick={(event) => { event.stopPropagation(); void closeClusterTab(serverId); }} />
                </button>
              );
            })
          )}
        </div>

        <nav className="tabs server-work-tabs">
          <button
            className={view === "brokers" ? "active" : ""}
            onClick={() => {
              if (view === "brokers") {
                activateSelectedTopicView();
                return;
              }
              setView("brokers");
              if (!brokersByServer[selectedServerId]) void refreshBrokers();
            }}
            disabled={!isSelectedServerConnected}
          >
            <HardDrive size={16} /> Brokers
          </button>
          <button
            className={view === "topics" ? "active" : ""}
            onClick={() => {
              if (view === "topics") {
                activateSelectedTopicView();
                return;
              }
              setView("topics");
              if (!topicsByServer[selectedServerId]) void refreshTopics();
            }}
            disabled={!isSelectedServerConnected}
          >
            <ListTree size={16} /> Topics
          </button>
          <button
            className={view === "consumers" ? "active" : ""}
            onClick={() => {
              if (view === "consumers") {
                activateSelectedTopicView();
                return;
              }
              setView("consumers");
              if (!groupsByServer[selectedServerId]) {
                void refreshGroups();
              }
            }}
            disabled={!isSelectedServerConnected}
          >
            <Users size={16} /> Consumers
          </button>
          <button className="ghost" onClick={() => void refreshCurrentView()} disabled={!isSelectedServerConnected || loading}><RefreshCw size={16} /> 새로고침</button>
        </nav>

        {isTopicView && (
          <>
        <div className="topic-tabs" aria-label="Opened topics">
          {openedTopicTabs.length === 0 ? (
            <div className="topic-tabs-empty">토픽을 더블 클릭하면 탭으로 열립니다.</div>
          ) : (
            openedTopicTabs.map((topic) => (
              <button
                key={topic}
                className={topic === selectedTopic ? "topic-tab active" : "topic-tab"}
                title={topic}
                onClick={() => {
                  activateTopicView(topic);
                  void loadTopicDetail(topic);
                }}
                onAuxClick={(event) => {
                  if (event.button === 1) {
                    event.preventDefault();
                    void closeTopicTab(topic);
                  }
                }}
              >
                <span>{topic}</span>
                <X size={14} onClick={(event) => { event.stopPropagation(); void closeTopicTab(topic); }} />
              </button>
            ))
          )}
        </div>

        <nav className="tabs topic-work-tabs">
          <button className={view === "info" ? "active" : ""} onClick={() => setView("info")} disabled={!selectedTopic}><Layers size={16} /> Info</button>
          <button className={view === "consume" ? "active" : ""} onClick={() => setView("consume")} disabled={!selectedTopic}><Play size={16} /> Consume</button>
          <button className={view === "produce" ? "active" : ""} onClick={() => setView("produce")} disabled={!selectedTopic}><Send size={16} /> Produce</button>
          <button className="ghost" onClick={() => void refreshCurrentView()} disabled={!isSelectedServerConnected || loading}><RefreshCw size={16} /> 새로고침</button>
        </nav>

          </>
        )}

        <div className="content-grid">
          {view === "brokers" && <BrokersPanel brokers={brokers} />}
          {view === "topics" && (
            <ServerTopicsPanel
              topics={sortedTopics}
              favoriteTopicNames={favoriteTopicNames}
              selectedTopics={selectedTopicRows}
              onOpen={(topic) => void openTopicTab(topic)}
              onSelect={(topic) => {
                activateTopicView(topic);
                void loadTopicDetail(topic);
              }}
              onToggleSelected={toggleTopicRow}
              onToggleAllSelected={toggleAllTopicRows}
              onCopySelected={() => void copySelectedTopicNames()}
              onPurgeSelected={() => requestTopicAction("purge")}
              onDeleteSelected={() => requestTopicAction("delete")}
            />
          )}
          {view === "info" && <TopicPanel detail={topicDetail} />}
          {view === "consume" && (
            <ConsumePanel
              messages={selectedConsumeState.messages}
              selectedMessage={selectedConsumeState.selectedMessage}
              mode={selectedConsumeState.mode}
              offsetOrder={selectedConsumeState.offsetOrder}
              isConsuming={(streamingTopicsByServer[selectedServerId] ?? []).includes(selectedTopic)}
              offset={selectedConsumeState.offset}
              limit={selectedConsumeState.limit}
              partition={selectedConsumeState.partition}
              timeStart={selectedConsumeState.timeStart}
              timeEnd={selectedConsumeState.timeEnd}
              filterText={selectedConsumeState.filterText}
              filterField={selectedConsumeState.filterField}
              autoScroll={selectedConsumeState.autoScroll}
              maxMessages={selectedConsumeState.maxMessages}
              messagePaneHeight={messagePaneHeight}
              onMode={(mode) => {
                updateSelectedConsumeState({ mode });
                updateConsumeDefaults({ mode });
              }}
              onOffset={(offset) => updateSelectedConsumeState({ offset })}
              onOffsetOrder={(offsetOrder) => {
                const orderedMessages = offsetOrder === "desc"
                  ? [...selectedConsumeState.messages].sort((left, right) => Number(right.offset) - Number(left.offset))
                  : [...selectedConsumeState.messages].sort((left, right) => Number(left.offset) - Number(right.offset));
                updateSelectedConsumeState({ offsetOrder, messages: orderedMessages, selectedMessage: orderedMessages[0] ?? null });
                updateConsumeDefaults({ offsetOrder });
              }}
              onLimit={(limit) => {
                updateSelectedConsumeState({ limit });
                updateConsumeDefaults({ limit });
              }}
              onPartition={(partition) => {
                updateSelectedConsumeState({ partition });
                updateConsumeDefaults({ partition });
              }}
              onTimeStart={(timeStart) => updateSelectedConsumeState({ timeStart })}
              onTimeEnd={(timeEnd) => updateSelectedConsumeState({ timeEnd })}
              onFilterText={(filterText) => updateSelectedConsumeState({ filterText })}
              onFilterField={(filterField) => {
                updateSelectedConsumeState({ filterField });
                updateConsumeDefaults({ filterField });
              }}
              onClearFilter={() => updateSelectedConsumeState({ filterText: "", filterField: "all" })}
              onApplyFilter={(filterText) => updateSelectedConsumeState({ filterText, filterField: "all" })}
              onAutoScroll={(autoScroll) => {
                updateSelectedConsumeState({ autoScroll });
                updateConsumeDefaults({ autoScroll });
              }}
              onMaxMessages={(maxMessages) => {
                updateSelectedConsumeState({ maxMessages });
                updateConsumeDefaults({ maxMessages });
              }}
              onSelectMessage={(selectedMessage) => updateSelectedConsumeState({ selectedMessage })}
              onMessagePaneHeight={setMessagePaneHeight}
              onSendToProduce={sendMessageToProduce}
              onExport={(format, messages) => void exportConsumedMessages(format, messages)}
              onStart={() => void startConsume()}
              onStop={() => void stopConsume()}
            />
          )}
          {view === "produce" && (
            <ProducePanel
              topic={selectedTopic}
              keyText={produceKey}
              headers={produceHeaders}
              value={produceValue}
              onKey={setProduceKey}
              onHeaders={setProduceHeaders}
              onValue={setProduceValue}
              onProduce={() => void produce()}
            />
          )}
          {view === "consumers" && (
            <GroupsPanel
              groups={groups}
              selectedGroupId={selectedGroupId}
              detail={selectedGroupLag}
              onSelectGroup={(groupId) => void loadConsumerGroupLag(groupId)}
              onRefresh={() => void refreshGroups()}
              onRefreshDetail={() => {
                if (selectedGroupId) void loadConsumerGroupLag(selectedGroupId);
              }}
            />
          )}
        </div>
      </main>

      {isServerFormOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeServerForm}>
          <section className="server-modal" role="dialog" aria-modal="true" aria-labelledby="server-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-title">
              <div>
                <span className="eyebrow">Kafka connection</span>
                <h2 id="server-modal-title">{editingServerId ? "Edit server" : "Add server"}</h2>
              </div>
              <button className="modal-close" onClick={closeServerForm} title="Close">
                <X size={18} />
              </button>
            </div>
            <label>
              서버 이름
              <input value={serverForm.name} onChange={(event) => setServerForm({ ...serverForm, name: event.target.value })} placeholder="local" autoFocus />
            </label>
            <label>
              브로커
              <input value={serverForm.brokers} onChange={(event) => setServerForm({ ...serverForm, brokers: event.target.value })} placeholder="localhost:9092, localhost:9093" />
            </label>
            <section className="auth-settings">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={serverForm.ssl}
                  onChange={(event) => setServerForm({ ...serverForm, ssl: event.target.checked })}
                />
                Use SSL/TLS
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={serverForm.oauthEnabled}
                  onChange={(event) => setServerForm({ ...serverForm, oauthEnabled: event.target.checked })}
                />
                SASL/OAUTHBEARER
              </label>
              {serverForm.oauthEnabled && (
                <div className="auth-grid">
                  <label>
                    Token endpoint
                    <input value={serverForm.oauthTokenEndpoint} onChange={(event) => setServerForm({ ...serverForm, oauthTokenEndpoint: event.target.value })} placeholder="https://auth.example.com/oauth2/token" />
                  </label>
                  <label>
                    Client ID
                    <input value={serverForm.oauthClientId} onChange={(event) => setServerForm({ ...serverForm, oauthClientId: event.target.value })} placeholder="kafka-client" />
                  </label>
                  <label>
                    Client secret
                    <input type="password" value={serverForm.oauthClientSecret} onChange={(event) => setServerForm({ ...serverForm, oauthClientSecret: event.target.value })} placeholder="client secret" />
                  </label>
                  <label>
                    Scope
                    <input value={serverForm.oauthScope} onChange={(event) => setServerForm({ ...serverForm, oauthScope: event.target.value })} placeholder="optional" />
                  </label>
                  <label>
                    Audience
                    <input value={serverForm.oauthAudience} onChange={(event) => setServerForm({ ...serverForm, oauthAudience: event.target.value })} placeholder="optional" />
                  </label>
                </div>
              )}
            </section>
            <div className="modal-actions">
              <button className="ghost" onClick={closeServerForm}>취소</button>
              <button className="primary" onClick={saveServer} disabled={loading}>
                <Plug size={16} /> {editingServerId ? "수정" : "등록"}
              </button>
            </div>
          </section>
        </div>
      )}
      {toast && (
        <div className={`toast ${toast.kind}`}>
          <span className="toast-icon">
            {toast.kind === "loading" && <RefreshCw className="spin" size={16} />}
            {toast.kind === "success" && <CheckCircle2 size={16} />}
            {toast.kind === "error" && <AlertTriangle size={16} />}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
      {isPreferencesOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsPreferencesOpen(false)}>
          <section className="server-modal preferences-modal" role="dialog" aria-modal="true" aria-labelledby="preferences-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-title">
              <div>
                <span className="eyebrow">Application</span>
                <h2 id="preferences-title">Preferences</h2>
              </div>
              <button className="modal-close" onClick={() => setIsPreferencesOpen(false)} title="Close">
                <X size={18} />
              </button>
            </div>
            <section className="preferences-grid">
              <label>
                Editor: Font Family
                <input list="font-family-options" value={fontFamily} onChange={(event) => setFontFamily(event.target.value)} placeholder="D2Coding, Consolas, 'Courier New', monospace" />
                <datalist id="font-family-options">
                  {fontOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </datalist>
              </label>
              <label>
                Editor: Font Size
                <input type="number" min={11} max={16} value={fontSize} onChange={(event) => setFontSize(Number(event.target.value) || 13)} />
              </label>
              <label className="font-size-slider">
                Size preview
                <input type="range" min={11} max={16} value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} />
              </label>
              <div className="font-preview">
                <strong>proc-status-t</strong>
                <span>{"{\"system_time\":1780388670010,\"proc_id\":\"PR1001\"}"}</span>
              </div>
              <label>
                User Format: Log Export
                <textarea
                  className="format-template-editor"
                  value={exportFormatTemplate}
                  onChange={(event) => setExportFormatTemplate(event.target.value)}
                  placeholder="[{timestamp}] {topic}[{partition}]@{offset} key={key} value={value}"
                />
              </label>
              <div className="format-help">
                Placeholders: {"{timestamp}"}, {"{topic}"}, {"{partition}"}, {"{offset}"}, {"{key}"}, {"{headers}"}, {"{value}"}
              </div>
            </section>
            <div className="modal-actions">
              <button className="ghost" onClick={() => { setFontFamily("D2Coding, Consolas, 'Courier New', monospace"); setFontSize(13); setExportFormatTemplate("[{timestamp}] {topic}[{partition}]@{offset} key={key} headers={headers} value={value}"); }}>Reset</button>
              <button className="primary" onClick={() => setIsPreferencesOpen(false)}>Done</button>
            </div>
          </section>
        </div>
      )}
      {connectionError && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setConnectionError(null)}>
          <section className="server-modal error-modal" role="dialog" aria-modal="true" aria-labelledby="connection-error-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-title">
              <div>
                <span className="eyebrow">Kafka connection failed</span>
                <h2 id="connection-error-title">Connect to '{connectionError.serverName}'</h2>
              </div>
              <button className="modal-close" onClick={() => setConnectionError(null)} title="Close">
                <X size={18} />
              </button>
            </div>
            <div className="error-summary">
              <span className="error-mark">×</span>
              <div>
                <strong>{connectionError.brokers}</strong>
                <pre>{connectionError.message}</pre>
              </div>
            </div>
            <div className="modal-actions">
              <button className="primary" onClick={() => setConnectionError(null)}>확인</button>
            </div>
          </section>
        </div>
      )}
      {pendingTopicAction && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setPendingTopicAction(null)}>
          <section className="server-modal topic-action-modal" role="dialog" aria-modal="true" aria-labelledby="topic-action-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-title">
              <div>
                <span className="eyebrow">Topic {pendingTopicAction.kind}</span>
                <h2 id="topic-action-title">{pendingTopicAction.kind === "delete" ? "Delete selected topics" : "Purge selected topics"}</h2>
              </div>
              <button className="modal-close" onClick={() => setPendingTopicAction(null)} title="Close">
                <X size={18} />
              </button>
            </div>
            <div className="topic-action-warning">
              <strong>{pendingTopicAction.topics.length} topic(s) selected</strong>
              <p>
                {pendingTopicAction.kind === "delete"
                  ? "Delete removes the selected topics from the cluster."
                  : "Purge keeps the topics, but removes records up to the current high offsets."}
              </p>
              <div className="topic-action-list">
                {pendingTopicAction.topics.map((topic) => <span key={topic}>{topic}</span>)}
              </div>
            </div>
            <label>
              Type {pendingTopicAction.kind.toUpperCase()} to confirm
              <input value={topicActionConfirmText} onChange={(event) => setTopicActionConfirmText(event.target.value)} autoFocus />
            </label>
            <div className="modal-actions">
              <button className="ghost" onClick={() => setPendingTopicAction(null)}>Cancel</button>
              <button
                className={pendingTopicAction.kind === "delete" ? "danger" : "primary"}
                onClick={() => void confirmTopicAction()}
                disabled={topicActionConfirmText.trim().toUpperCase() !== pendingTopicAction.kind.toUpperCase() || loading}
              >
                {pendingTopicAction.kind === "delete" ? <Trash2 size={16} /> : <Trash2 size={16} />}
                {pendingTopicAction.kind === "delete" ? "Delete" : "Purge"}
              </button>
            </div>
          </section>
        </div>
      )}
      {topicContextMenu && (
        <div
          className="context-menu topic-context-menu"
          style={{ left: topicContextMenu.x, top: topicContextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button onClick={() => { closeTopicContextMenu(); void openTopicTab(contextTopic); }}>
            <Layers size={14} /> Open
          </button>
          <button onClick={() => { closeTopicContextMenu(); void copySelectedTopicNames([contextTopic]); }}>
            <Copy size={14} /> Copy name
          </button>
          <button className="danger-item" onClick={() => { closeTopicContextMenu(); requestTopicAction("purge", [contextTopic]); }}>
            <Trash2 size={14} /> Purge
          </button>
          <button className="danger-item" onClick={() => { closeTopicContextMenu(); requestTopicAction("delete", [contextTopic]); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
      {serverContextMenu && contextServer && (
        <div
          className="context-menu"
          style={{ left: serverContextMenu.x, top: serverContextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {connectedServerIds.includes(contextServer.id) ? (
            <button onClick={() => { closeServerContextMenu(); void disconnectServer(contextServer.id); }}>
              <Unplug size={14} /> Disconnect
            </button>
          ) : (
            <button onClick={() => { closeServerContextMenu(); void connectServer(contextServer); }}>
              <Power size={14} /> Connect
            </button>
          )}
          <button onClick={() => { closeServerContextMenu(); openEditServerForm(contextServer); }}>
            <Pencil size={14} /> Edit
          </button>
          <button className="danger-item" onClick={() => { closeServerContextMenu(); void deleteServer(contextServer.id); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function TopicPanel({ detail }: { detail: TopicDetail | null }) {
  if (!detail) return <section className="panel empty">토픽을 선택하세요.</section>;
  return (
    <section className="panel">
      <div className="section-title">
        <h2>{detail.name}</h2>
        <span>{detail.partitions.length} partitions</span>
      </div>
      <table>
        <thead>
          <tr><th>Partition</th><th>Leader</th><th>Replicas</th><th>ISR</th><th>Low</th><th>High</th></tr>
        </thead>
        <tbody>
          {detail.partitions.map((partition) => {
            const offset = detail.offsets.find((item) => item.partition === partition.partition);
            return (
              <tr key={partition.partition}>
                <td>{partition.partition}</td>
                <td>{partition.leader}</td>
                <td>{partition.replicas.join(", ")}</td>
                <td>{partition.isr.join(", ")}</td>
                <td>{offset?.low ?? "-"}</td>
                <td>{offset?.high ?? "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function BrokersPanel({ brokers }: { brokers: BrokerSummary[] }) {
  const totalOnlinePartitions = brokers.reduce((total, broker) => total + broker.onlinePartitionCount, 0);
  const totalReplicas = brokers.reduce((total, broker) => total + broker.replicaCount, 0);
  const totalInSyncReplicas = brokers.reduce((total, broker) => total + broker.inSyncReplicaCount, 0);
  const totalOutOfSyncReplicas = brokers.reduce((total, broker) => total + broker.outOfSyncReplicaCount, 0);
  const totalUnderReplicatedPartitions = brokers.reduce((total, broker) => total + broker.underReplicatedPartitionCount, 0);
  const controller = brokers.find((broker) => broker.controller);

  return (
    <section className="panel brokers-panel">
      <div className="section-title">
        <h2>Brokers</h2>
        <span>{brokers.length} brokers</span>
      </div>
      <div className="broker-summary-grid">
        <div className="broker-summary-card">
          <span>Broker Count</span>
          <strong>{brokers.length}</strong>
        </div>
        <div className="broker-summary-card">
          <span>Active Controller</span>
          <strong>{controller?.nodeId ?? "-"}</strong>
        </div>
        <div className="broker-summary-card">
          <span>Online Partitions</span>
          <strong>{formatCompactNumber(totalOnlinePartitions)}</strong>
        </div>
        <div className="broker-summary-card">
          <span>URP</span>
          <strong className={totalUnderReplicatedPartitions > 0 ? "metric-warn" : ""}>{formatCompactNumber(totalUnderReplicatedPartitions)}</strong>
        </div>
        <div className="broker-summary-card">
          <span>In Sync Replicas</span>
          <strong>{formatCompactNumber(totalInSyncReplicas)} <small>of {formatCompactNumber(totalReplicas)}</small></strong>
        </div>
        <div className="broker-summary-card">
          <span>Out Of Sync Replicas</span>
          <strong className={totalOutOfSyncReplicas > 0 ? "metric-warn" : ""}>{formatCompactNumber(totalOutOfSyncReplicas)}</strong>
        </div>
      </div>
      <div className="message-table broker-table">
        <table>
          <thead>
            <tr>
              <th>Broker ID</th>
              <th>Partitions Skew</th>
              <th>Leaders</th>
              <th>Leader Skew</th>
              <th>Online Partitions</th>
              <th>Replicas</th>
              <th>OOS Replicas</th>
              <th>Port</th>
              <th>Host</th>
            </tr>
          </thead>
          <tbody>
            {brokers.map((broker) => (
              <tr key={broker.nodeId}>
                <td>
                  <span className="broker-id-cell">
                    {broker.nodeId}
                    {broker.controller && <span className="controller-badge">Controller</span>}
                  </span>
                </td>
                <td className={Math.abs(broker.partitionSkewPercent) > 10 ? "metric-warn" : ""}>{formatPercent(broker.partitionSkewPercent)}</td>
                <td>{formatCompactNumber(broker.leaderCount)}</td>
                <td className={Math.abs(broker.leaderSkewPercent) > 10 ? "metric-warn" : ""}>{formatPercent(broker.leaderSkewPercent)}</td>
                <td>{formatCompactNumber(broker.onlinePartitionCount)}</td>
                <td>{formatCompactNumber(broker.replicaCount)}</td>
                <td className={broker.outOfSyncReplicaCount > 0 ? "metric-warn" : ""}>{formatCompactNumber(broker.outOfSyncReplicaCount)}</td>
                <td>{broker.port}</td>
                <td title={broker.host}>{broker.host}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {brokers.length === 0 && <div className="empty-list">No brokers loaded</div>}
      </div>
    </section>
  );
}

function ServerTopicsPanel(props: {
  topics: TopicSummary[];
  favoriteTopicNames: string[];
  selectedTopics: string[];
  onOpen: (topic: string) => void;
  onSelect: (topic: string) => void;
  onToggleSelected: (topic: string) => void;
  onToggleAllSelected: (topics: string[]) => void;
  onCopySelected: () => void;
  onPurgeSelected: () => void;
  onDeleteSelected: () => void;
}) {
  const favorites = new Set(props.favoriteTopicNames);
  const selected = new Set(props.selectedTopics);
  const visibleTopicNames = props.topics.map((topic) => topic.name);
  const selectedVisibleCount = visibleTopicNames.filter((topic) => selected.has(topic)).length;
  const allVisibleSelected = visibleTopicNames.length > 0 && selectedVisibleCount === visibleTopicNames.length;
  return (
    <section className="panel server-topics-panel">
      <div className="section-title">
        <h2>Topics</h2>
        <span>{props.topics.length} topics</span>
      </div>
      <div className="topic-actionbar">
        <label className="topic-select-all">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            ref={(input) => {
              if (input) input.indeterminate = selectedVisibleCount > 0 && !allVisibleSelected;
            }}
            onChange={() => props.onToggleAllSelected(visibleTopicNames)}
            disabled={visibleTopicNames.length === 0}
          />
          {props.selectedTopics.length} selected
        </label>
        <button className="ghost compact" onClick={props.onCopySelected} disabled={props.selectedTopics.length === 0}><Copy size={14} /> Copy</button>
        <button className="ghost compact" onClick={props.onPurgeSelected} disabled={props.selectedTopics.length === 0}><Trash2 size={14} /> Purge</button>
        <button className="danger compact" onClick={props.onDeleteSelected} disabled={props.selectedTopics.length === 0}><Trash2 size={14} /> Delete</button>
      </div>
      <div className="message-table server-topics-table">
        <table>
          <thead>
            <tr><th className="check-column">CHK</th><th>Topic</th><th>Partitions</th><th>RF</th><th>Messages</th><th>Favorite</th></tr>
          </thead>
          <tbody>
            {props.topics.map((topic) => (
              <tr
                key={topic.name}
                className={selected.has(topic.name) ? "selected" : ""}
                onClick={() => props.onSelect(topic.name)}
                onDoubleClick={() => props.onOpen(topic.name)}
              >
                <td className="check-column" onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(topic.name)}
                    onChange={() => props.onToggleSelected(topic.name)}
                    title={`Select ${topic.name}`}
                  />
                </td>
                <td title={topic.name}>{topic.name}</td>
                <td>{topic.partitions}</td>
                <td>{topic.replicationFactor}</td>
                <td title={topic.messageCount ?? "0"}>{formatCount(topic.messageCount)}</td>
                <td>{favorites.has(topic.name) ? "Yes" : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {props.topics.length === 0 && <div className="empty-list">No topics found</div>}
      </div>
    </section>
  );
}

function TopicListItem(props: {
  topic: TopicSummary;
  active: boolean;
  favorite: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
}) {
  return (
    <button
      className={props.active ? "topic active" : "topic"}
      onClick={props.onSelect}
      onDoubleClick={props.onOpen}
      onContextMenu={props.onContextMenu}
      title={`${props.topic.name} (${props.topic.partitions} partitions / RF ${props.topic.replicationFactor})`}
    >
      <span className={props.favorite ? "topic-favorite favorite" : "topic-favorite"} onClick={(event) => { event.stopPropagation(); props.onToggleFavorite(); }} title={props.favorite ? "Remove favorite" : "Add favorite"}>
        <Star size={14} fill={props.favorite ? "currentColor" : "none"} />
      </span>
      <span className="topic-copy">
        <strong title={props.topic.name}>{props.topic.name}</strong>
        <small title={`${props.topic.partitions} partitions / RF ${props.topic.replicationFactor} / ${formatCount(props.topic.messageCount)} messages`}>
          P {props.topic.partitions} / RF {props.topic.replicationFactor} / {formatCount(props.topic.messageCount)} msgs
        </small>
      </span>
    </button>
  );
}

function ConsumePanel(props: {
  messages: ConsumedMessage[];
  selectedMessage: ConsumedMessage | null;
  mode: ConsumeMode;
  offsetOrder: OffsetOrder;
  isConsuming: boolean;
  offset: string;
  limit: number;
  partition: string;
  timeStart: string;
  timeEnd: string;
  filterText: string;
  filterField: ConsumeFilterField;
  autoScroll: boolean;
  maxMessages: number;
  messagePaneHeight: number;
  onMode: (value: ConsumeMode) => void;
  onOffsetOrder: (value: OffsetOrder) => void;
  onOffset: (value: string) => void;
  onLimit: (value: number) => void;
  onPartition: (value: string) => void;
  onTimeStart: (value: string) => void;
  onTimeEnd: (value: string) => void;
  onFilterText: (value: string) => void;
  onFilterField: (value: ConsumeFilterField) => void;
  onClearFilter: () => void;
  onApplyFilter: (value: string) => void;
  onAutoScroll: (value: boolean) => void;
  onMaxMessages: (value: number) => void;
  onSelectMessage: (message: ConsumedMessage) => void;
  onMessagePaneHeight: (value: number) => void;
  onSendToProduce: (message: ConsumedMessage) => void;
  onExport: (format: MessageExportFormat, messages: ConsumedMessage[]) => void;
  onStart: () => void;
  onStop: () => void;
}) {
  const [inspectorMode, setInspectorMode] = useState<JsonInspectorMode>("raw");
  const [inspectorSearch, setInspectorSearch] = useState("");
  const messageTableRef = useRef<HTMLDivElement | null>(null);
  const consumeGridRef = useRef<HTMLDivElement | null>(null);
  const selectedPayload = props.selectedMessage ? formatMessagePayload(props.selectedMessage) : null;
  const selectedJson = selectedPayload ? JSON.stringify(selectedPayload, null, 2) : "";
  const filteredMessages = useMemo(
    () => filterMessages(props.messages, props.filterText, props.filterField),
    [props.filterField, props.filterText, props.messages]
  );

  useEffect(() => {
    if (props.mode !== "live" || !props.autoScroll) return;
    messageTableRef.current?.scrollTo({ top: 0 });
  }, [props.autoScroll, props.messages.length, props.mode]);

  function startInspectorResize(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = props.messagePaneHeight;
    const gridHeight = consumeGridRef.current?.getBoundingClientRect().height ?? 620;
    const onPointerMove = (moveEvent: PointerEvent) => {
      const maxHeight = Math.max(150, gridHeight - 250);
      const nextHeight = Math.min(maxHeight, Math.max(120, startHeight + moveEvent.clientY - startY));
      props.onMessagePaneHeight(nextHeight);
    };
    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function getRowNo(index: number) {
    if (props.mode === "offset") {
      return props.offsetOrder === "asc" ? index + 1 : filteredMessages.length - index;
    }
    if (props.mode === "timeRange") {
      return props.offsetOrder === "asc" ? index + 1 : filteredMessages.length - index;
    }
    return filteredMessages.length - index;
  }

  return (
    <section className="panel consume-workspace">
      <div className="toolbar">
        <div className="segmented">
          <button className={props.mode === "offset" ? "active" : ""} onClick={() => props.onMode("offset")} disabled={props.isConsuming}>Offset</button>
          <button className={props.mode === "timeRange" ? "active" : ""} onClick={() => props.onMode("timeRange")} disabled={props.isConsuming}>Time</button>
          <button className={props.mode === "live" ? "active" : ""} onClick={() => props.onMode("live")}>Live</button>
        </div>
        <input className="small-input" type="number" min={0} value={props.partition} onChange={(event) => props.onPartition(event.target.value)} placeholder="partition" />
        {props.mode === "offset" && (
          <>
            <input className="small-input" type="number" min={0} value={props.offset} onChange={(event) => props.onOffset(event.target.value)} placeholder="offset" />
            <input className="tiny-input" type="number" min={1} max={500} value={props.limit} onChange={(event) => props.onLimit(Number(event.target.value))} />
            <select className="order-select" value={props.offsetOrder} onChange={(event) => props.onOffsetOrder(event.target.value as OffsetOrder)} title="Message order">
              <option value="asc">Oldest first</option>
              <option value="desc">Newest first</option>
            </select>
          </>
        )}
        {props.mode === "timeRange" && (
          <>
            <label className="date-field">
              <Calendar size={14} />
              <input type="datetime-local" value={props.timeStart} onChange={(event) => props.onTimeStart(event.target.value)} />
            </label>
            <label className="date-field">
              <Calendar size={14} />
              <input type="datetime-local" value={props.timeEnd} onChange={(event) => props.onTimeEnd(event.target.value)} />
            </label>
            <input className="tiny-input" type="number" min={1} max={1000} value={props.limit} onChange={(event) => props.onLimit(Number(event.target.value))} />
            <select className="order-select" value={props.offsetOrder} onChange={(event) => props.onOffsetOrder(event.target.value as OffsetOrder)} title="Message order">
              <option value="asc">Oldest first</option>
              <option value="desc">Newest first</option>
            </select>
          </>
        )}
        {props.isConsuming ? (
          <button className="danger" onClick={props.onStop}><Square size={16} /> Pause</button>
        ) : (
          <button className="primary" onClick={props.onStart}><Play size={16} /> {props.mode === "live" ? "Start" : "Consume"}</button>
        )}
        {props.mode === "live" && (
          <label className="auto-scroll-toggle">
            <input type="checkbox" checked={props.autoScroll} onChange={(event) => props.onAutoScroll(event.target.checked)} />
            Auto Scroll
          </label>
        )}
        {props.mode === "live" && (
          <label className="max-messages-control">
            Max
            <select value={props.maxMessages} onChange={(event) => props.onMaxMessages(Number(event.target.value))}>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1,000</option>
              <option value={5000}>5,000</option>
              <option value={10000}>10,000</option>
            </select>
          </label>
        )}
        {props.mode === "live" && (
          <span className={props.isConsuming ? "streaming-badge active" : "streaming-badge"}>
            <span />
            Streaming
          </span>
        )}
        <button className="export-button" onClick={() => props.onExport("json", filteredMessages)} disabled={filteredMessages.length === 0} title="Export filtered messages as JSON">
          <Download size={14} /> JSON
        </button>
        <button className="export-button" onClick={() => props.onExport("csv", filteredMessages)} disabled={filteredMessages.length === 0} title="Export filtered messages as CSV">
          <Download size={14} /> CSV
        </button>
        <button className="export-button" onClick={() => props.onExport("log", filteredMessages)} disabled={filteredMessages.length === 0} title="Export filtered messages as custom log">
          <Download size={14} /> LOG
        </button>
        <span className={props.isConsuming ? "count live-count" : "count"}>{props.isConsuming ? "Live" : ""} {filteredMessages.length}/{props.messages.length} messages</span>
      </div>
      <div className="filter-bar">
        <select value={props.filterField} onChange={(event) => props.onFilterField(event.target.value as ConsumeFilterField)}>
          <option value="all">All</option>
          <option value="key">Key</option>
          <option value="value">Value</option>
          <option value="headers">Headers</option>
          <option value="headersEmpty">Empty Headers</option>
          <option value="offset">Offset</option>
          <option value="partition">Partition</option>
          <option value="timestamp">Timestamp</option>
        </select>
        <input value={props.filterText} onChange={(event) => props.onFilterText(event.target.value)} placeholder="Filter messages" />
        <button className="ghost compact" onClick={props.onClearFilter}>Clear</button>
      </div>
      <div className="consume-grid" ref={consumeGridRef} style={{ gridTemplateRows: `${props.messagePaneHeight}px 8px minmax(0, 1fr)` }}>
        <div className="message-table" ref={messageTableRef}>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Partition</th>
                <th>Offset</th>
                <th>Timestamp</th>
                <th>Key</th>
                <th>Headers</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((message, index) => (
                <tr
                  key={`${message.partition}-${message.offset}-${message.timestamp}`}
                  className={props.selectedMessage === message ? "selected" : ""}
                  style={{ borderLeftColor: getPartitionColor(message.partition) }}
                  onClick={() => props.onSelectMessage(message)}
                >
                  <td>{getRowNo(index)}</td>
                  <td><span className="partition-badge" style={{ color: getPartitionColor(message.partition), borderColor: getPartitionColor(message.partition) }}>{message.partition}</span></td>
                  <td title={message.offset}>{message.offset}</td>
                  <td title={message.timestamp}>{formatTimestamp(message.timestamp)}</td>
                  <td title={message.key || "-"}>{message.key || "-"}</td>
                  <td title={formatHeaders(message.headers)}>{previewHeaders(message.headers)}</td>
                  <td title={message.value}>{previewValue(message.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMessages.length === 0 && <div className="empty-list">No messages</div>}
        </div>
        <div className="consume-split-resizer" onPointerDown={startInspectorResize} title="Resize message grid and JSON viewer" />
        <JsonInspector
          mode={inspectorMode}
          search={inspectorSearch}
          payload={selectedPayload}
          rawText={selectedJson}
          valueText={props.selectedMessage?.value ?? ""}
          selectedMessage={props.selectedMessage}
          onMode={setInspectorMode}
          onSearch={setInspectorSearch}
          onApplyFilter={props.onApplyFilter}
          onSendToProduce={props.onSendToProduce}
        />
      </div>
    </section>
  );
}

function JsonInspector(props: {
  mode: JsonInspectorMode;
  search: string;
  payload: unknown;
  rawText: string;
  valueText: string;
  selectedMessage: ConsumedMessage | null;
  onMode: (mode: JsonInspectorMode) => void;
  onSearch: (value: string) => void;
  onApplyFilter: (value: string) => void;
  onSendToProduce: (message: ConsumedMessage) => void;
}) {
  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <section className="json-inspector">
      <div className="json-toolbar">
        <div className="segmented compact-segmented">
          <button className={props.mode === "raw" ? "active" : ""} onClick={() => props.onMode("raw")}>Raw</button>
          <button className={props.mode === "tree" ? "active" : ""} onClick={() => props.onMode("tree")}>Tree</button>
        </div>
        <input value={props.search} onChange={(event) => props.onSearch(event.target.value)} placeholder="Search JSON" />
        <button className="ghost compact" onClick={() => void copyText(props.rawText)} disabled={!props.rawText}><Copy size={14} /> JSON</button>
        <button className="ghost compact" onClick={() => void copyText(props.valueText)} disabled={!props.valueText}><Copy size={14} /> Value</button>
        <button className="ghost compact" onClick={() => props.selectedMessage && props.onSendToProduce(props.selectedMessage)} disabled={!props.selectedMessage}><Send size={14} /> Produce</button>
      </div>
      {props.payload ? (
        props.mode === "raw" ? (
          <pre className="json-view">{renderRawJsonText(props.rawText, props.search)}</pre>
        ) : (
          <div className="json-tree">
            <JsonTreeNode name="message" value={props.payload} path="message" search={props.search} onApplyFilter={props.onApplyFilter} />
          </div>
        )
      ) : (
        <pre className="json-view">Select a message to inspect JSON.</pre>
      )}
    </section>
  );
}

function JsonTreeNode(props: {
  name: string;
  value: unknown;
  path: string;
  search: string;
  onApplyFilter: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isObject = props.value !== null && typeof props.value === "object";
  const entries = isObject ? Object.entries(props.value as Record<string, unknown>) : [];
  const primitive = stringifyPrimitive(props.value);
  const epochTitle = getEpochTitle(props.value);

  if (!isObject) {
    return (
      <div className="json-node leaf">
        <span className="json-key">{renderHighlightedText(props.name, props.search)}</span>
        <span className="json-separator">:</span>
        <span className="json-value" title={epochTitle}>{renderHighlightedText(primitive, props.search)}</span>
        <button className="json-filter" onClick={() => props.onApplyFilter(primitive)} title="Apply to filter">
          <Filter size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="json-node">
      <button className="json-node-toggle" onClick={() => setExpanded((current) => !current)}>
        {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span className="json-key">{renderHighlightedText(props.name, props.search)}</span>
        <span className="json-meta">{Array.isArray(props.value) ? `[${entries.length}]` : `{${entries.length}}`}</span>
      </button>
      {expanded && (
        <div className="json-children">
          {entries.map(([key, value]) => (
            <JsonTreeNode key={`${props.path}.${key}`} name={key} value={value} path={`${props.path}.${key}`} search={props.search} onApplyFilter={props.onApplyFilter} />
          ))}
        </div>
      )}
    </div>
  );
}

function previewValue(value: string) {
  if (!value) return "(empty)";
  return value.length > 80 ? `${value.slice(0, 80)}...` : value;
}

function formatHeaders(headers: Record<string, string>) {
  const entries = Object.entries(headers);
  if (entries.length === 0) return "-";
  return JSON.stringify(headers);
}

function previewHeaders(headers: Record<string, string>) {
  const entries = Object.entries(headers);
  if (entries.length === 0) return "-";
  const text = entries.map(([key, value]) => `${key}=${value}`).join(", ");
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
}

function parseTopicCount(value?: string) {
  if (!value || !/^\d+$/.test(value)) return 0n;
  return BigInt(value);
}

function formatCount(value?: string) {
  const count = Number(parseTopicCount(value));
  if (!Number.isFinite(count)) return "-";
  return formatCompactNumber(count);
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function isTopicWorkView(view: View): view is TopicWorkView {
  return view === "info" || view === "consume" || view === "produce";
}

function getTopicSortLabel(value: TopicSortMode) {
  return topicSortOptions.find((option) => option.value === value)?.label ?? "Name A-Z";
}

function sortTopics(topics: TopicSummary[], sortMode: TopicSortMode, favoriteTopicNames: string[]) {
  const favorites = new Set(favoriteTopicNames);
  return [...topics].sort((left, right) => {
    if (sortMode === "favoritesFirst") {
      const favoriteCompare = Number(favorites.has(right.name)) - Number(favorites.has(left.name));
      if (favoriteCompare !== 0) return favoriteCompare;
    }
    if (sortMode === "messagesDesc") {
      const countCompare = compareBigInt(parseTopicCount(right.messageCount), parseTopicCount(left.messageCount));
      if (countCompare !== 0) return countCompare;
    }
    if (sortMode === "partitionsDesc") {
      const partitionCompare = right.partitions - left.partitions;
      if (partitionCompare !== 0) return partitionCompare;
    }
    return left.name.localeCompare(right.name);
  });
}

function compareBigInt(left: bigint, right: bigint) {
  if (left > right) return 1;
  if (left < right) return -1;
  return 0;
}

function filterMessages(messages: ConsumedMessage[], filterText: string, filterField: ConsumeFilterField) {
  const query = filterText.trim().toLowerCase();
  if (filterField === "headersEmpty") {
    return messages.filter((message) => Object.keys(message.headers ?? {}).length === 0);
  }
  if (!query) return messages;

  return messages.filter((message) => {
    const fields: Record<ConsumeFilterField, string> = {
      all: [
        message.key,
        message.value,
        message.offset,
        String(message.partition),
        message.timestamp,
        JSON.stringify(message.headers)
      ].join(" "),
      key: message.key,
      value: message.value,
      offset: message.offset,
      partition: String(message.partition),
      headers: JSON.stringify(message.headers),
      headersEmpty: Object.keys(message.headers ?? {}).length === 0 ? "true" : "false",
      timestamp: message.timestamp
    };
    return fields[filterField].toLowerCase().includes(query);
  });
}

function getPartitionColor(partition: number) {
  const colors = ["#0f8b8d", "#d97706", "#7c3aed", "#e11d48", "#2563eb", "#16a34a", "#c026d3", "#ea580c"];
  return colors[Math.abs(partition) % colors.length];
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString("ko-KR", { hour12: false });
}

function formatMessagePayload(message: ConsumedMessage) {
  const parsedValue = parseJson(message.value);
  return {
    topic: message.topic,
    partition: message.partition,
    offset: message.offset,
    timestamp: message.timestamp,
    key: parseJson(message.key),
    value: parsedValue,
    headers: message.headers
  };
}

function parseJson(value: string) {
  if (!value) return "";
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function formatProduceValue(value: string) {
  const parsed = parseJson(value);
  return typeof parsed === "string" ? value : JSON.stringify(parsed, null, 2);
}

function validateJsonLikeValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) {
    return null;
  }
  try {
    JSON.parse(trimmed);
    return null;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return `Value JSON 형식이 올바르지 않습니다. ${detail}`;
  }
}

function parseProduceHeaders(value: string): Record<string, string> | string {
  const trimmed = value.trim();
  if (!trimmed) return {};
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      return "Headers must be a JSON object.";
    }
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([, headerValue]) => headerValue !== null && headerValue !== undefined)
        .map(([key, headerValue]) => [key, typeof headerValue === "string" ? headerValue : JSON.stringify(headerValue)])
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return `Headers JSON 형식이 올바르지 않습니다. ${detail}`;
  }
}

function sanitizeFontFamily(value: string) {
  return value.replace(/[;{}]/g, "").trim();
}

function stringifyPrimitive(value: unknown) {
  if (typeof value === "string") return value;
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  return String(value);
}

function renderHighlightedText(text: string, query: string) {
  const needle = query.trim();
  if (!needle) return text;
  const lowerText = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let index = lowerText.indexOf(lowerNeedle);

  while (index !== -1) {
    if (index > cursor) {
      parts.push(text.slice(cursor, index));
    }
    parts.push(<mark key={`${index}-${parts.length}`}>{text.slice(index, index + needle.length)}</mark>);
    cursor = index + needle.length;
    index = lowerText.indexOf(lowerNeedle, cursor);
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

function renderRawJsonText(text: string, query: string) {
  const nodes: React.ReactNode[] = [];
  const epochPattern = /\b\d{10,13}\b/g;
  let cursor = 0;
  let match = epochPattern.exec(text);

  while (match) {
    const value = match[0];
    const index = match.index;
    if (index > cursor) {
      nodes.push(<React.Fragment key={`text-${cursor}`}>{renderHighlightedText(text.slice(cursor, index), query)}</React.Fragment>);
    }
    nodes.push(
      <span key={`epoch-${index}`} className="epoch-token" title={getEpochTitle(value)}>
        {renderHighlightedText(value, query)}
      </span>
    );
    cursor = index + value.length;
    match = epochPattern.exec(text);
  }

  if (cursor < text.length) {
    nodes.push(<React.Fragment key={`text-${cursor}`}>{renderHighlightedText(text.slice(cursor), query)}</React.Fragment>);
  }

  return nodes;
}

function getEpochTitle(value: unknown) {
  const text = typeof value === "number" ? String(value) : typeof value === "string" ? value : "";
  if (!/^\d{10,13}$/.test(text)) return undefined;
  const millis = text.length === 10 ? Number(text) * 1000 : Number(text);
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleString("ko-KR", { hour12: false });
}

function ProducePanel(props: {
  topic: string;
  keyText: string;
  headers: string;
  value: string;
  onKey: (value: string) => void;
  onHeaders: (value: string) => void;
  onValue: (value: string) => void;
  onProduce: () => void;
}) {
  return (
    <section className="panel produce-panel">
      <div className="section-title">
        <h2>Produce</h2>
        <span>{props.topic || "topic required"}</span>
      </div>
      <label>Key<input value={props.keyText} onChange={(event) => props.onKey(event.target.value)} placeholder="optional key" /></label>
      <label>Headers<textarea className="headers-editor" value={props.headers} onChange={(event) => props.onHeaders(event.target.value)} placeholder="{ }" /></label>
      <label>Value<textarea value={props.value} onChange={(event) => props.onValue(event.target.value)} /></label>
      <button className="primary wide" onClick={props.onProduce} disabled={!props.topic}><Send size={16} /> 메시지 전송</button>
    </section>
  );
}

function GroupsPanel(props: {
  groups: ConsumerGroupSummary[];
  selectedGroupId: string;
  detail: ConsumerGroupLagDetail | null;
  onSelectGroup: (groupId: string) => void;
  onRefresh: () => void;
  onRefreshDetail: () => void;
}) {
  return (
    <section className="panel groups-panel">
      <div className="section-title">
        <h2>Consumers</h2>
        <button className="ghost compact" onClick={props.onRefresh}><RefreshCw size={15} /> 조회</button>
      </div>
      <div className="groups-layout">
        <div className="group-list">
          {props.groups.map((group) => (
            <button
              key={group.groupId}
              className={group.groupId === props.selectedGroupId ? "group-row active" : "group-row"}
              onClick={() => props.onSelectGroup(group.groupId)}
              title={group.groupId}
            >
              <strong>{group.groupId}</strong>
              <span>{group.protocol || "-"}</span>
            </button>
          ))}
          {props.groups.length === 0 && <div className="empty-list">No consumer groups</div>}
        </div>
        <div className="group-detail">
          {props.detail ? (
            <>
              <div className="group-summary">
                <div>
                  <span>Total lag</span>
                  <strong>{props.detail.totalLag}</strong>
                </div>
                <div>
                  <span>State</span>
                  <strong>{props.detail.state || "-"}</strong>
                </div>
                <div>
                  <span>Members</span>
                  <strong>{props.detail.members}</strong>
                </div>
                <div>
                  <span>Rows</span>
                  <strong>{props.detail.rows.length}</strong>
                </div>
                <button className="ghost compact" onClick={props.onRefreshDetail}><RefreshCw size={15} /> Lag</button>
              </div>
              <div className="message-table group-lag-table">
                <table>
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Partition</th>
                      <th>Current</th>
                      <th>End</th>
                      <th>Lag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.detail.rows.map((row) => (
                      <tr key={`${row.topic}-${row.partition}`}>
                        <td title={row.topic}>{row.topic}</td>
                        <td>{row.partition}</td>
                        <td title={row.currentOffset}>{row.currentOffset}</td>
                        <td title={row.endOffset}>{row.endOffset}</td>
                        <td className={row.lag !== "-" && row.lag !== "0" ? "lag-warn" : ""}>{row.lag}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {props.detail.rows.length === 0 && <div className="empty-list">No committed offsets</div>}
              </div>
            </>
          ) : (
            <div className="empty-list group-detail-empty">그룹을 선택하면 lag 상세가 표시됩니다.</div>
          )}
        </div>
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
