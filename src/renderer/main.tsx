import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ArrowUpDown, Calendar, CheckCircle2, ChevronDown, ChevronRight, Copy, Database, Download, Filter, HardDrive, Layers, ListTree, Pencil, Play, Plug, Plus, Power, RefreshCw, Send, Square, Star, Trash2, Unplug, Users, X } from "lucide-react";
import type { AppPreferences, BrokerSummary, ConsumedMessage, ConsumerGroupLagDetail, ConsumerGroupLagRow, ConsumerGroupSummary, ImportSettingsResult, MessageExportFormat, ServerProfile, TopicDetail, TopicSummary, UpdateStatus } from "../shared/types";
import { DataGrid } from "./components/DataGrid";
import { emptyConsumeState, emptyServer, fontOptions, topicSortOptions, type ConsumeDefaultPatch, type ConsumeFilterField, type ConsumeMode, type DragPayload, type JsonInspectorMode, type OffsetOrder, type SplitPaneState, type ToastState, type TopicAction, type TopicConsumeState, type TopicListFilter, type TopicSortMode, type TopicWorkView, type View } from "./uiTypes";
import { filterMessages, formatCompactNumber, formatCount, formatHeaders, formatMessagePayload, formatPercent, formatProduceValue, formatTimestamp, getEpochTitle, getPartitionColor, getTopicSortLabel, isTopicWorkView, parseJson, parseProduceHeaders, parseTopicCount, previewHeaders, previewValue, renderHighlightedText, renderRawJsonText, sanitizeFontFamily, sortTopics, stringifyPrimitive, validateJsonLikeValue } from "./utils";
import "./styles.css";

const OFFSET_PAGING_THRESHOLD = 10000;
const OFFSET_PAGE_SIZE = 5000;

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
  const [splitPane, setSplitPane] = useState<SplitPaneState | null>(null);
  const [splitDropSide, setSplitDropSide] = useState<"left" | "right" | null>(null);
  const [splitPrimaryPercent, setSplitPrimaryPercent] = useState(50);
  const [activeWorkspacePane, setActiveWorkspacePane] = useState<"primary" | "split">("primary");
  const [activeDragPayload, setActiveDragPayload] = useState<DragPayload | null>(null);
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
  const visibleSplitPane = splitPane?.serverId === selectedServerId ? splitPane : null;
  const splitServer = visibleSplitPane ? servers.find((server) => server.id === visibleSplitPane.serverId) : undefined;
  const splitTopics = visibleSplitPane ? topicsByServer[visibleSplitPane.serverId] ?? [] : [];
  const splitGroups = visibleSplitPane ? groupsByServer[visibleSplitPane.serverId] ?? [] : [];
  const splitBrokers = visibleSplitPane ? brokersByServer[visibleSplitPane.serverId] ?? [] : [];
  const splitConsumeState = visibleSplitPane
    ? (consumeStatesByServer[visibleSplitPane.serverId]?.[visibleSplitPane.topic] ?? getDefaultConsumeState(visibleSplitPane.serverId))
    : emptyConsumeState;
  const splitSelectedGroupId = visibleSplitPane ? selectedGroupByServer[visibleSplitPane.serverId] ?? "" : "";
  const splitSelectedGroupLag = visibleSplitPane ? groupLagByServer[visibleSplitPane.serverId]?.[splitSelectedGroupId] ?? null : null;

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

  function updateConsumeStateFor(serverId: string, topic: string, patch: Partial<TopicConsumeState>) {
    setConsumeStatesByServer((current) => {
      const serverStates = current[serverId] ?? {};
      const previous = serverStates[topic] ?? getDefaultConsumeState(serverId);
      return {
        ...current,
        [serverId]: {
          ...serverStates,
          [topic]: {
            ...previous,
            ...patch
          }
        }
      };
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

  function readDragPayload(event: React.DragEvent): DragPayload | null {
    const raw = event.dataTransfer.getData("application/x-kafka-tool");
    if (!raw) return activeDragPayload;
    try {
      return JSON.parse(raw) as DragPayload;
    } catch {
      return activeDragPayload;
    }
  }

  async function openSplitForTopic(serverId: string, topic: string) {
    if (!topic || serverId !== selectedServerId) return;
    setSplitPane((current) => {
      const previousTabs = current?.serverId === serverId ? current.topicTabs : [];
      return {
        serverId,
        topic,
        topicTabs: previousTabs.includes(topic) ? previousTabs : [...previousTabs, topic],
        view: getTopicView(topic) === "consume" ? "consume" : "info",
        detail: null
      };
    });
    setActiveWorkspacePane("split");
    await loadSplitTopicDetail(serverId, topic);
  }

  async function loadSplitTopicDetail(serverId: string, topic: string) {
    if (!kafkaApi || !topic) return;
    const detail = await runTask("split topic detail 조회 중", () => kafkaApi.getTopicDetail(serverId, topic));
    setSplitPane((current) => current && current.serverId === serverId && current.topic === topic
      ? { ...current, detail }
      : current
    );
  }

  function handleWorkspaceDragOver(event: React.DragEvent<HTMLElement>) {
    const payload = activeDragPayload ?? readDragPayload(event);
    if (!payload) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const rect = event.currentTarget.getBoundingClientRect();
    setSplitDropSide(event.clientX < rect.left + rect.width / 2 ? "left" : "right");
  }

  function startWorkspaceSplitResize(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const container = event.currentTarget.closest(".workspace") as HTMLElement | null;
    const rect = container?.getBoundingClientRect();
    if (!rect) return;
    const onPointerMove = (moveEvent: PointerEvent) => {
      const percent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      setSplitPrimaryPercent(Math.min(72, Math.max(28, percent)));
    };
    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  async function handleWorkspaceDrop(event: React.DragEvent<HTMLElement>) {
    const payload = activeDragPayload ?? readDragPayload(event);
    if (!payload) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const side = event.clientX < rect.left + rect.width / 2 ? "left" : "right";
    setSplitDropSide(null);
    setActiveDragPayload(null);
    if (payload.type === "split-pane" && side === "left") {
      await closeSplitPane();
      return;
    }
    if (payload.type === "topic") {
      if (side === "right" && payload.source === "primary") {
        await openSplitForTopic(payload.serverId, payload.topic);
        await removePrimaryTopicTabAfterSplit(payload.topic);
        return;
      }
      if (side === "left" && payload.source === "split") {
        await moveSplitTopicToPrimary(payload.topic);
      }
    }
  }

  async function openPrimaryTopicTab(topic: string) {
    setActiveWorkspacePane("primary");
    setOpenedTopicTabs((current) => (current.includes(topic) ? current : [...current, topic]));
    activateTopicView(topic);
    await loadTopicDetail(topic);
  }

  async function moveSplitTopicToPrimary(topic: string) {
    const pane = splitPane;
    if (!pane || pane.serverId !== selectedServerId || !pane.topicTabs.includes(topic)) return;
    await openPrimaryTopicTab(topic);
    await closeSplitTopicTab(topic);
  }

  async function removePrimaryTopicTabAfterSplit(topic: string) {
    if (!openedTopicTabs.includes(topic)) return;
    const nextTabs = openedTopicTabs.filter((item) => item !== topic);
    setOpenedTopicTabs(nextTabs);
    if (selectedTopic !== topic) return;
    const nextTopic = nextTabs[nextTabs.length - 1] ?? "";
    setSelectedTopic(nextTopic);
    if (nextTopic) {
      activateTopicView(nextTopic);
      await loadTopicDetail(nextTopic);
      return;
    }
    setTopicDetail(null);
  }

  async function closeSplitPane() {
    const pane = splitPane;
    if (!pane) return;
    if ((streamingTopicsByServer[pane.serverId] ?? []).includes(pane.topic)) {
      await stopConsume(pane.serverId, pane.topic);
    }
    setSplitPane(null);
    setActiveWorkspacePane("primary");
  }

  async function activateSplitTopic(topic: string, view: View = "info") {
    const pane = splitPane;
    if (!pane || !topic) return;
    setSplitPane((current) => current
      ? {
          ...current,
          topic,
          topicTabs: current.topicTabs.includes(topic) ? current.topicTabs : [...current.topicTabs, topic],
          view,
          detail: null
        }
      : current
    );
    await loadSplitTopicDetail(pane.serverId, topic);
  }

  async function closeSplitTopicTab(topic: string) {
    const pane = splitPane;
    if (!pane) return;
    if ((streamingTopicsByServer[pane.serverId] ?? []).includes(topic)) {
      await stopConsume(pane.serverId, topic);
    }
    const nextTabs = pane.topicTabs.filter((item) => item !== topic);
    if (nextTabs.length === 0) {
      setSplitPane(null);
      setActiveWorkspacePane("primary");
      return;
    }
    const nextTopic = pane.topic === topic ? nextTabs[nextTabs.length - 1] ?? "" : pane.topic;
    setSplitPane({
      ...pane,
      topic: nextTopic,
      topicTabs: nextTabs,
      view: nextTopic ? pane.view : "topics",
      detail: null
    });
    if (nextTopic) {
      await loadSplitTopicDetail(pane.serverId, nextTopic);
    }
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
    if (activeWorkspacePane === "split" && splitPane?.serverId === selectedServerId) {
      await activateSplitTopic(topic);
      return;
    }
    await openPrimaryTopicTab(topic);
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

  async function loadConsumerGroupLagFor(serverId: string, groupId: string) {
    if (!kafkaApi || !serverId) return;
    setSelectedGroupByServer((current) => ({ ...current, [serverId]: groupId }));
    const detail = await runTask("consumer group lag loading", () => kafkaApi.getConsumerGroupLag(serverId, groupId));
    setGroupLagByServer((current) => ({
      ...current,
      [serverId]: {
        ...(current[serverId] ?? {}),
        [groupId]: detail
      }
    }));
  }

  async function produce() {
    await produceFor(selectedServerId, selectedTopic);
  }

  async function produceFor(serverId: string, topic: string) {
    if (!kafkaApi || !serverId || !topic) return;
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
        serverId,
        topic,
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

  async function exportConsumedMessages(format: MessageExportFormat, messages: ConsumedMessage[], topicName = selectedTopic) {
    if (!kafkaApi || !topicName) return;
    if (messages.length === 0) {
      setToast({ message: "내보낼 메시지가 없습니다.", kind: "error" });
      return;
    }
    setLoading(true);
    setToast({ message: "메시지 내보내기 중", kind: "loading" });
    try {
      const filePath = await kafkaApi.exportMessages({
        topic: topicName,
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

  async function exportOffsetConditionMessages(format: MessageExportFormat, serverId: string, topic: string, state: TopicConsumeState) {
    if (!kafkaApi || !serverId || !topic) return;
    const partition = state.partition === "" ? 0 : Number(state.partition);
    setLoading(true);
    setToast({ message: "전체 조건 메시지 내보내기 중", kind: "loading" });
    try {
      const filePath = await kafkaApi.exportOffsetMessages({
        serverId,
        topic,
        partition,
        offset: state.offset,
        limit: state.limit,
        order: state.offsetOrder,
        endOffsetExclusive: state.offsetPagination?.endOffsetExclusive,
        format,
        template: exportFormatTemplate
      });
      if (filePath) {
        setStatus(`전체 조건 메시지 내보내기 완료: ${filePath}`);
        setToast({ message: "전체 조건 메시지 내보내기 완료", kind: "success" });
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
    await startConsumeFor(selectedServerId, selectedTopic, state);
  }

  function getOffsetPageLimit(state: TopicConsumeState, pageIndex: number) {
    if (state.limit <= OFFSET_PAGING_THRESHOLD) return state.limit;
    return Math.min(OFFSET_PAGE_SIZE, Math.max(0, state.limit - pageIndex * OFFSET_PAGE_SIZE));
  }

  function getNextPageOffset(order: OffsetOrder, messages: ConsumedMessage[]) {
    if (messages.length === 0) return "";
    const anchor = messages[messages.length - 1].offset;
    return order === "desc" ? anchor : stringifyPrimitive(/^\d+$/.test(anchor) ? BigInt(anchor) + 1n : anchor);
  }

  async function consumeOffsetPageFor(
    serverId: string,
    topic: string,
    state: TopicConsumeState,
    pageOffset: string,
    pageIndex: number,
    prevOffsets: string[]
  ) {
    if (!kafkaApi) return;
    const partition = state.partition === "" ? 0 : Number(state.partition);
    const pageLimit = getOffsetPageLimit(state, pageIndex);
    if (pageLimit <= 0) return;
    updateConsumeStateFor(serverId, topic, { messages: [], selectedMessage: null });
    const result = await runTask("offset consume 조회 중", () =>
      kafkaApi.consumeFromOffset({
        serverId,
        topic,
        partition,
        offset: pageOffset,
        limit: pageLimit,
        order: state.offsetOrder,
        endOffsetExclusive: state.offsetPagination?.endOffsetExclusive
      })
    );
    const items = result.messages;
    const orderedItems = state.offsetOrder === "desc" ? [...items].reverse() : items;
    const endOffsetExclusive = result.endOffsetExclusive ?? state.offsetPagination?.endOffsetExclusive;
    const hasPaging = state.limit > OFFSET_PAGING_THRESHOLD;
    const pagination = hasPaging
      ? {
          totalLimit: state.limit,
          pageSize: OFFSET_PAGE_SIZE,
          pageIndex,
          currentOffset: pageOffset,
          prevOffsets,
          nextOffset: getNextPageOffset(state.offsetOrder, orderedItems),
          hasNext: orderedItems.length === pageLimit && (pageIndex + 1) * OFFSET_PAGE_SIZE < state.limit,
          endOffsetExclusive
        }
      : null;
    updateConsumeStateFor(serverId, topic, {
      messages: orderedItems,
      selectedMessage: orderedItems[0] ?? null,
      offsetPagination: pagination
    });
  }

  async function moveOffsetPageFor(serverId: string, topic: string, state: TopicConsumeState, direction: "prev" | "next") {
    const pagination = state.offsetPagination;
    if (!pagination) return;
    if (direction === "next") {
      await consumeOffsetPageFor(serverId, topic, state, pagination.nextOffset, pagination.pageIndex + 1, [...pagination.prevOffsets, pagination.currentOffset]);
      return;
    }
    const previousOffset = pagination.prevOffsets[pagination.prevOffsets.length - 1];
    if (previousOffset === undefined) return;
    await consumeOffsetPageFor(serverId, topic, state, previousOffset, Math.max(0, pagination.pageIndex - 1), pagination.prevOffsets.slice(0, -1));
  }

  async function startConsumeFor(serverId: string, topic: string, state: TopicConsumeState) {
    if (!kafkaApi || !serverId || !topic) return;
    const partition = state.partition === "" ? 0 : Number(state.partition);
    if (state.mode === "offset") {
      await consumeOffsetPageFor(serverId, topic, state, state.offset, 0, []);
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
          serverId,
          topic,
          partition: state.partition === "" ? undefined : partition,
          startTimestamp,
          endTimestamp,
          limit: state.limit
        })
      );
      const orderedItems = state.offsetOrder === "desc" ? [...items].reverse() : items;
      updateConsumeStateFor(serverId, topic, { messages: orderedItems, selectedMessage: orderedItems[0] ?? null, offsetPagination: null });
      return;
    }
    await runTask("실시간 consume 시작 중", () =>
      kafkaApi.startConsume({
        serverId,
        topic,
        fromBeginning: false,
        partition: state.partition === "" ? undefined : Number(state.partition)
      })
    );
    updateConsumeStateFor(serverId, topic, { offsetPagination: null });
    setStreamingTopicsByServer((current) => {
      const topics = current[serverId] ?? [];
      return {
        ...current,
        [serverId]: topics.includes(topic) ? topics : [...topics, topic]
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
            <span>Server</span>
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
                  setActiveDragPayload(null);
                  setSplitDropSide(null);
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
                          <span>{topicSort === option.value ? "*" : ""}</span>
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
                      if (activeWorkspacePane === "split" && visibleSplitPane) return;
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
                  if (activeWorkspacePane === "split" && visibleSplitPane) return;
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

      <main
        className={visibleSplitPane ? "workspace split-mode" : "workspace"}
        style={visibleSplitPane ? { gridTemplateColumns: `${splitPrimaryPercent}fr 8px ${100 - splitPrimaryPercent}fr` } : undefined}
        onDragOver={handleWorkspaceDragOver}
        onDragLeave={() => setSplitDropSide(null)}
        onDrop={(event) => void handleWorkspaceDrop(event)}
      >
        {splitDropSide && (
          <div className={`split-drop-indicator ${splitDropSide}`}>
            {splitDropSide === "right" ? "Drop here to split" : "Drop split here to close"}
          </div>
        )}
        <section
          className={activeWorkspacePane === "primary" ? "workspace-pane primary-pane active-pane" : "workspace-pane primary-pane inactive-pane"}
          onMouseDown={() => setActiveWorkspacePane("primary")}
        >
        <header className="topbar">
          <div>
            <span className="eyebrow" title={selectedServer ? selectedServer.brokers.join(", ") : "no server"}>{selectedServer ? selectedServer.brokers.join(", ") : "no server"}</span>
            <h1>{selectedServer?.name ?? "Kafka Server"}</h1>
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

        <section
          className={activeWorkspacePane === "primary" ? "primary-topic-pane active-pane" : "primary-topic-pane inactive-pane"}
          onMouseDown={() => setActiveWorkspacePane("primary")}
        >
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
                draggable
                title={topic}
                onDragStart={(event) => {
                  const payload: DragPayload = { type: "topic", serverId: selectedServerId, topic, source: "primary" };
                  setActiveDragPayload(payload);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("application/x-kafka-tool", JSON.stringify(payload));
                }}
                onDragEnd={() => {
                  setActiveDragPayload(null);
                  setSplitDropSide(null);
                }}
                onClick={() => {
                  setActiveWorkspacePane("primary");
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
              offsetPagination={selectedConsumeState.offsetPagination}
              messagePaneHeight={messagePaneHeight}
              onMode={(mode) => {
                updateSelectedConsumeState({ mode, offsetPagination: null });
                updateConsumeDefaults({ mode });
              }}
              onOffset={(offset) => updateSelectedConsumeState({ offset, offsetPagination: null })}
              onOffsetOrder={(offsetOrder) => {
                updateSelectedConsumeState({ offsetOrder, offsetPagination: null });
                updateConsumeDefaults({ offsetOrder });
              }}
              onLimit={(limit) => {
                updateSelectedConsumeState({ limit, offsetPagination: null });
                updateConsumeDefaults({ limit });
              }}
              onPartition={(partition) => {
                updateSelectedConsumeState({ partition, offsetPagination: null });
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
              onPagePrev={() => void moveOffsetPageFor(selectedServerId, selectedTopic, selectedConsumeState, "prev")}
              onPageNext={() => void moveOffsetPageFor(selectedServerId, selectedTopic, selectedConsumeState, "next")}
              onSelectMessage={(selectedMessage) => updateSelectedConsumeState({ selectedMessage })}
              onMessagePaneHeight={setMessagePaneHeight}
              onSendToProduce={sendMessageToProduce}
              onExport={(format, messages) => void exportConsumedMessages(format, messages)}
              onExportAll={(format) => void exportOffsetConditionMessages(format, selectedServerId, selectedTopic, selectedConsumeState)}
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
            <ConsumerGroupsPanel
              groups={groups}
              selectedGroupId={selectedGroupId}
              detail={selectedGroupLag}
              detailsByGroup={groupLagByServer[selectedServerId] ?? {}}
              onSelectGroup={(groupId) => void loadConsumerGroupLag(groupId)}
              onBack={() => setSelectedGroupByServer((current) => ({ ...current, [selectedServerId]: "" }))}
              onRefresh={() => void refreshGroups()}
              onRefreshDetail={() => {
                if (selectedGroupId) void loadConsumerGroupLag(selectedGroupId);
              }}
            />
          )}
        </div>
        </section>
        </section>
        {visibleSplitPane && <div className="workspace-split-resizer" onPointerDown={startWorkspaceSplitResize} title="Resize split panes" />}
        {visibleSplitPane && splitServer && (
          <SplitWorkspacePane
            pane={visibleSplitPane}
            server={splitServer}
            topics={splitTopics}
            brokers={splitBrokers}
            groups={splitGroups}
            selectedGroupId={splitSelectedGroupId}
            selectedGroupLag={splitSelectedGroupLag}
            groupDetailsById={groupLagByServer[visibleSplitPane.serverId] ?? {}}
            consumeState={splitConsumeState}
            isConnected={connectedServerIds.includes(visibleSplitPane.serverId)}
            isConsuming={(streamingTopicsByServer[visibleSplitPane.serverId] ?? []).includes(visibleSplitPane.topic)}
            messagePaneHeight={messagePaneHeight}
            onClose={() => void closeSplitPane()}
            active={activeWorkspacePane === "split"}
            onActivate={() => setActiveWorkspacePane("split")}
            onDragStart={(event) => {
              const payload: DragPayload = { type: "split-pane" };
              setActiveDragPayload(payload);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("application/x-kafka-tool", JSON.stringify(payload));
            }}
            onDragEnd={() => {
              setActiveDragPayload(null);
              setSplitDropSide(null);
            }}
            onView={(nextView) => {
              setSplitPane((current) => current ? { ...current, view: nextView } : current);
              if (nextView === "brokers" && !brokersByServer[visibleSplitPane.serverId]) void refreshBrokersForServer(visibleSplitPane.serverId);
              if (nextView === "topics" && !topicsByServer[visibleSplitPane.serverId]) void refreshTopicsForServer(visibleSplitPane.serverId);
              if (nextView === "consumers" && !groupsByServer[visibleSplitPane.serverId]) void refreshGroupsForServer(visibleSplitPane.serverId);
            }}
            onTopic={(topic) => {
              void activateSplitTopic(topic);
            }}
            onCloseTopic={(topic) => void closeSplitTopicTab(topic)}
            onTopicDragStart={(event, topic) => {
              const payload: DragPayload = { type: "topic", serverId: visibleSplitPane.serverId, topic, source: "split" };
              setActiveDragPayload(payload);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("application/x-kafka-tool", JSON.stringify(payload));
            }}
            onTopicDragEnd={() => {
              setActiveDragPayload(null);
              setSplitDropSide(null);
            }}
            onRefresh={() => {
              if (visibleSplitPane.view === "info" && visibleSplitPane.topic) void loadSplitTopicDetail(visibleSplitPane.serverId, visibleSplitPane.topic);
            }}
            onSelectGroup={(groupId) => void loadConsumerGroupLagFor(visibleSplitPane.serverId, groupId)}
            onBackGroup={() => setSelectedGroupByServer((current) => ({ ...current, [visibleSplitPane.serverId]: "" }))}
            onRefreshGroupDetail={() => {
              if (splitSelectedGroupId) void loadConsumerGroupLagFor(visibleSplitPane.serverId, splitSelectedGroupId);
            }}
            onUpdateConsume={(patch) => updateConsumeStateFor(visibleSplitPane.serverId, visibleSplitPane.topic, patch)}
            onOffsetOrder={(offsetOrder) => {
              updateConsumeStateFor(visibleSplitPane.serverId, visibleSplitPane.topic, { offsetOrder, offsetPagination: null });
            }}
            onOffsetPage={(direction) => void moveOffsetPageFor(visibleSplitPane.serverId, visibleSplitPane.topic, splitConsumeState, direction)}
            onStartConsume={() => void startConsumeFor(visibleSplitPane.serverId, visibleSplitPane.topic, splitConsumeState)}
            onStopConsume={() => void stopConsume(visibleSplitPane.serverId, visibleSplitPane.topic)}
            onSendToProduce={sendMessageToProduce}
            onExport={(format, messages) => void exportConsumedMessages(format, messages, visibleSplitPane.topic)}
            onExportAll={(format) => void exportOffsetConditionMessages(format, visibleSplitPane.serverId, visibleSplitPane.topic, splitConsumeState)}
            onMessagePaneHeight={setMessagePaneHeight}
            produceKey={produceKey}
            produceHeaders={produceHeaders}
            produceValue={produceValue}
            onProduceKey={setProduceKey}
            onProduceHeaders={setProduceHeaders}
            onProduceValue={setProduceValue}
            onProduce={() => void produceFor(visibleSplitPane.serverId, visibleSplitPane.topic)}
          />
        )}
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

function SplitWorkspacePane(props: {
  pane: SplitPaneState;
  server: ServerProfile;
  topics: TopicSummary[];
  brokers: BrokerSummary[];
  groups: ConsumerGroupSummary[];
  selectedGroupId: string;
  selectedGroupLag: ConsumerGroupLagDetail | null;
  groupDetailsById: Record<string, ConsumerGroupLagDetail>;
  consumeState: TopicConsumeState;
  isConnected: boolean;
  isConsuming: boolean;
  messagePaneHeight: number;
  active: boolean;
  onActivate: () => void;
  onClose: () => void;
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: () => void;
  onView: (view: View) => void;
  onTopic: (topic: string) => void;
  onCloseTopic: (topic: string) => void;
  onTopicDragStart: (event: React.DragEvent, topic: string) => void;
  onTopicDragEnd: () => void;
  onRefresh: () => void;
  onSelectGroup: (groupId: string) => void;
  onBackGroup: () => void;
  onRefreshGroupDetail: () => void;
  onUpdateConsume: (patch: Partial<TopicConsumeState>) => void;
  onOffsetOrder: (value: OffsetOrder) => void;
  onOffsetPage: (direction: "prev" | "next") => void;
  onStartConsume: () => void;
  onStopConsume: () => void;
  onSendToProduce: (message: ConsumedMessage) => void;
  onExport: (format: MessageExportFormat, messages: ConsumedMessage[]) => void;
  onExportAll: (format: MessageExportFormat) => void;
  onMessagePaneHeight: (value: number) => void;
  produceKey: string;
  produceHeaders: string;
  produceValue: string;
  onProduceKey: (value: string) => void;
  onProduceHeaders: (value: string) => void;
  onProduceValue: (value: string) => void;
  onProduce: () => void;
}) {
  const topicViews: View[] = ["info", "consume", "produce"];
  const isTopicView = props.pane.view === "info" || props.pane.view === "consume" || props.pane.view === "produce";
  const topicDetail = props.pane.detail;

  return (
    <section className={props.active ? "workspace-pane split-pane active-pane" : "workspace-pane split-pane inactive-pane"} onMouseDown={props.onActivate}>
      {isTopicView && (
        <>
          <div className="split-topic-tabs-row">
          <div className="topic-tabs" aria-label="Opened split topics">
            {props.pane.topicTabs.length === 0 ? (
              <div className="topic-tabs-empty">토픽을 선택하세요.</div>
            ) : props.pane.topicTabs.map((topic) => (
              <button
                key={topic}
                className={topic === props.pane.topic ? "topic-tab active" : "topic-tab"}
                draggable
                title={topic}
                onDragStart={(event) => props.onTopicDragStart(event, topic)}
                onDragEnd={props.onTopicDragEnd}
                onClick={() => props.onTopic(topic)}
                onAuxClick={(event) => {
                  if (event.button === 1) {
                    event.preventDefault();
                    props.onCloseTopic(topic);
                  }
                }}
              >
                <span>{topic}</span>
                <X size={14} onClick={(event) => { event.stopPropagation(); props.onCloseTopic(topic); }} />
              </button>
            ))}
          </div>
          </div>
          <div className="tabs topic-work-tabs split-topic-tabs">
            {topicViews.map((view) => (
              <button key={view} className={props.pane.view === view ? "active" : ""} onClick={() => props.onView(view)} disabled={!props.pane.topic}>
                {view === "info" && <Layers size={15} />}
                {view === "consume" && <Play size={15} />}
                {view === "produce" && <Send size={15} />}
                {view === "info" ? "Info" : view === "consume" ? "Consume" : "Produce"}
              </button>
            ))}
            <button className="ghost" onClick={props.onRefresh} disabled={!props.pane.topic || props.pane.view === "produce"}>
              <RefreshCw size={15} /> 새로고침
            </button>
          </div>
        </>
      )}

      <div className="content-grid split-content-grid">
        {props.pane.view === "info" && <TopicPanel detail={topicDetail} />}
        {props.pane.view === "consume" && (
          <ConsumePanel
            messages={props.consumeState.messages}
            selectedMessage={props.consumeState.selectedMessage}
            mode={props.consumeState.mode}
            offsetOrder={props.consumeState.offsetOrder}
            isConsuming={props.isConsuming}
            offset={props.consumeState.offset}
            limit={props.consumeState.limit}
            partition={props.consumeState.partition}
            timeStart={props.consumeState.timeStart}
            timeEnd={props.consumeState.timeEnd}
            filterText={props.consumeState.filterText}
            filterField={props.consumeState.filterField}
            autoScroll={props.consumeState.autoScroll}
            maxMessages={props.consumeState.maxMessages}
            offsetPagination={props.consumeState.offsetPagination}
            messagePaneHeight={props.messagePaneHeight}
            onMode={(mode) => props.onUpdateConsume({ mode, offsetPagination: null })}
            onOffset={((offset) => props.onUpdateConsume({ offset, offsetPagination: null }))}
            onOffsetOrder={props.onOffsetOrder}
            onLimit={(limit) => props.onUpdateConsume({ limit, offsetPagination: null })}
            onPartition={(partition) => props.onUpdateConsume({ partition, offsetPagination: null })}
            onTimeStart={(timeStart) => props.onUpdateConsume({ timeStart })}
            onTimeEnd={(timeEnd) => props.onUpdateConsume({ timeEnd })}
            onFilterText={(filterText) => props.onUpdateConsume({ filterText })}
            onFilterField={(filterField) => props.onUpdateConsume({ filterField })}
            onClearFilter={() => props.onUpdateConsume({ filterText: "", filterField: "all" })}
            onApplyFilter={(filterText) => props.onUpdateConsume({ filterText, filterField: "all" })}
            onAutoScroll={(autoScroll) => props.onUpdateConsume({ autoScroll })}
            onMaxMessages={(maxMessages) => props.onUpdateConsume({ maxMessages })}
            onPagePrev={() => props.onOffsetPage("prev")}
            onPageNext={() => props.onOffsetPage("next")}
            onSelectMessage={(selectedMessage) => props.onUpdateConsume({ selectedMessage })}
            onMessagePaneHeight={props.onMessagePaneHeight}
            onSendToProduce={props.onSendToProduce}
            onExport={props.onExport}
            onExportAll={props.onExportAll}
            onStart={props.onStartConsume}
            onStop={props.onStopConsume}
          />
        )}
        {props.pane.view === "produce" && (
          <ProducePanel
            topic={props.pane.topic}
            keyText={props.produceKey}
            headers={props.produceHeaders}
            value={props.produceValue}
            onKey={props.onProduceKey}
            onHeaders={props.onProduceHeaders}
            onValue={props.onProduceValue}
            onProduce={props.onProduce}
          />
        )}
      </div>
    </section>
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
  const columns = useMemo<ColumnDef<BrokerSummary>[]>(() => [
    {
      accessorKey: "nodeId",
      header: "Broker ID",
      cell: ({ row }) => (
        <span className="broker-id-cell">
          {row.original.nodeId}
          {row.original.controller && <span className="controller-badge">Controller</span>}
        </span>
      )
    },
    {
      accessorKey: "partitionSkewPercent",
      header: "Partitions Skew",
      cell: ({ row }) => (
        <span className={Math.abs(row.original.partitionSkewPercent) > 10 ? "metric-warn" : ""}>
          {formatPercent(row.original.partitionSkewPercent)}
        </span>
      )
    },
    {
      accessorKey: "leaderCount",
      header: "Leaders",
      cell: ({ row }) => formatCompactNumber(row.original.leaderCount)
    },
    {
      accessorKey: "leaderSkewPercent",
      header: "Leader Skew",
      cell: ({ row }) => (
        <span className={Math.abs(row.original.leaderSkewPercent) > 10 ? "metric-warn" : ""}>
          {formatPercent(row.original.leaderSkewPercent)}
        </span>
      )
    },
    {
      accessorKey: "onlinePartitionCount",
      header: "Online Partitions",
      cell: ({ row }) => formatCompactNumber(row.original.onlinePartitionCount)
    },
    {
      accessorKey: "replicaCount",
      header: "Replicas",
      cell: ({ row }) => formatCompactNumber(row.original.replicaCount)
    },
    {
      accessorKey: "outOfSyncReplicaCount",
      header: "OOS Replicas",
      cell: ({ row }) => (
        <span className={row.original.outOfSyncReplicaCount > 0 ? "metric-warn" : ""}>
          {formatCompactNumber(row.original.outOfSyncReplicaCount)}
        </span>
      )
    },
    {
      accessorKey: "port",
      header: "Port"
    },
    {
      accessorKey: "host",
      header: "Host",
      cell: ({ row }) => <span title={row.original.host}>{row.original.host}</span>
    }
  ], []);

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
      <DataGrid
        data={brokers}
        columns={columns}
        className="broker-table"
        emptyText="No brokers loaded"
        getRowKey={(broker) => String(broker.nodeId)}
      />
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
  const columns = useMemo<ColumnDef<TopicSummary>[]>(() => [
    {
      id: "check",
      header: "CHK",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="check-column" onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected.has(row.original.name)}
            onChange={() => props.onToggleSelected(row.original.name)}
            title={`Select ${row.original.name}`}
          />
        </span>
      )
    },
    {
      accessorKey: "name",
      header: "Topic",
      cell: ({ row }) => <span title={row.original.name}>{row.original.name}</span>
    },
    {
      accessorKey: "partitions",
      header: "Partitions"
    },
    {
      accessorKey: "replicationFactor",
      header: "RF"
    },
    {
      id: "messages",
      header: "Messages",
      accessorFn: (topic) => Number(topic.messageCount ?? 0),
      cell: ({ row }) => <span title={row.original.messageCount ?? "0"}>{formatCount(row.original.messageCount)}</span>
    },
    {
      id: "favorite",
      header: "Favorite",
      accessorFn: (topic) => favorites.has(topic.name) ? 1 : 0,
      cell: ({ row }) => favorites.has(row.original.name) ? "Yes" : "-"
    }
  ], [favorites, props.onToggleSelected, selected]);
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
      <DataGrid
        data={props.topics}
        columns={columns}
        className="server-topics-table"
        emptyText="No topics found"
        getRowKey={(topic) => topic.name}
        getRowClassName={(topic) => (selected.has(topic.name) ? "selected" : "")}
        onRowClick={(topic) => props.onSelect(topic.name)}
        onRowDoubleClick={(topic) => props.onOpen(topic.name)}
      />
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
  offsetPagination: TopicConsumeState["offsetPagination"];
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
  onPagePrev: () => void;
  onPageNext: () => void;
  onSelectMessage: (message: ConsumedMessage) => void;
  onMessagePaneHeight: (value: number) => void;
  onSendToProduce: (message: ConsumedMessage) => void;
  onExport: (format: MessageExportFormat, messages: ConsumedMessage[]) => void;
  onExportAll: (format: MessageExportFormat) => void;
  onStart: () => void;
  onStop: () => void;
}) {
  const [inspectorMode, setInspectorMode] = useState<JsonInspectorMode>("raw");
  const [inspectorSearch, setInspectorSearch] = useState("");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const messageTableRef = useRef<HTMLDivElement | null>(null);
  const consumeGridRef = useRef<HTMLDivElement | null>(null);
  const selectedPayload = props.selectedMessage ? formatMessagePayload(props.selectedMessage) : null;
  const selectedJson = selectedPayload ? JSON.stringify(selectedPayload, null, 2) : "";
  const filteredMessages = useMemo(
    () => filterMessages(props.messages, props.filterText, props.filterField),
    [props.filterField, props.filterText, props.messages]
  );
  const isLargeOffsetRequest = props.mode === "offset" && props.limit > OFFSET_PAGING_THRESHOLD;
  const pagination = props.offsetPagination;
  const canExportFullOffsetRange = isLargeOffsetRequest && Boolean(pagination?.endOffsetExclusive);

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
    return index + 1;
  }

  const columns = useMemo<ColumnDef<ConsumedMessage>[]>(() => [
    {
      id: "no",
      header: "No",
      enableSorting: false,
      cell: ({ row }) => getRowNo(row.index)
    },
    {
      accessorKey: "partition",
      header: "Partition",
      sortingFn: "basic",
      cell: ({ row }) => {
        const partition = row.original.partition;
        return (
          <span className="partition-badge" style={{ color: getPartitionColor(partition), borderColor: getPartitionColor(partition) }}>
            {partition}
          </span>
        );
      }
    },
    {
      accessorKey: "offset",
      header: "Offset",
      sortingFn: (left, right, columnId) => Number(left.getValue(columnId)) - Number(right.getValue(columnId)),
      cell: ({ row }) => <span title={row.original.offset}>{row.original.offset}</span>
    },
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      sortingFn: (left, right, columnId) => Date.parse(String(left.getValue(columnId))) - Date.parse(String(right.getValue(columnId))),
      cell: ({ row }) => <span title={row.original.timestamp}>{formatTimestamp(row.original.timestamp)}</span>
    },
    {
      accessorKey: "key",
      header: "Key",
      cell: ({ row }) => <span title={row.original.key || "-"}>{row.original.key || "-"}</span>
    },
    {
      id: "headers",
      header: "Headers",
      accessorFn: (message) => formatHeaders(message.headers),
      cell: ({ row }) => <span title={formatHeaders(row.original.headers)}>{previewHeaders(row.original.headers)}</span>
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => <span title={row.original.value}>{previewValue(row.original.value)}</span>
    }
  ], [filteredMessages.length, props.mode, props.offsetOrder]);

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
            <input className="tiny-input" type="number" min={1} value={props.limit} onChange={(event) => props.onLimit(Number(event.target.value))} />
            <select className="order-select" value={props.offsetOrder} onChange={(event) => props.onOffsetOrder(event.target.value as OffsetOrder)} title="Message order">
              <option value="asc">Oldest</option>
              <option value="desc">Newest</option>
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
            <input className="tiny-input" type="number" min={1} value={props.limit} onChange={(event) => props.onLimit(Number(event.target.value))} />
            <select className="order-select" value={props.offsetOrder} onChange={(event) => props.onOffsetOrder(event.target.value as OffsetOrder)} title="Message order">
              <option value="asc">Oldest</option>
              <option value="desc">Newest</option>
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
        <div className="export-menu">
          <button
            className="export-button"
            onClick={() => setIsExportMenuOpen((current) => !current)}
            disabled={filteredMessages.length === 0}
            title="Export filtered messages"
          >
            <Download size={14} />
            <ChevronDown size={13} />
          </button>
          {isExportMenuOpen && (
            <div className="export-menu-popover">
              <span className="export-menu-label">Current page</span>
              {(["json", "csv", "log"] as MessageExportFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    props.onExport(format, filteredMessages);
                  }}
                >
                  <Download size={13} />
                  {format.toUpperCase()}
                </button>
              ))}
              {canExportFullOffsetRange && (
                <>
                  <span className="export-menu-divider" />
                  <span className="export-menu-label">Full offset range</span>
                  {(["json", "csv", "log"] as MessageExportFormat[]).map((format) => (
                    <button
                      key={`all-${format}`}
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        props.onExportAll(format);
                      }}
                    >
                      <Download size={13} />
                      All {format.toUpperCase()}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <span className={props.isConsuming ? "count live-count" : "count"}>{props.isConsuming ? "Live" : ""} {filteredMessages.length}/{props.messages.length} messages</span>
      </div>
      {isLargeOffsetRequest && (
        <div className="paging-bar">
          <span>
            Page {pagination ? pagination.pageIndex + 1 : 1}
            {" "}of {Math.max(1, Math.ceil(props.limit / OFFSET_PAGE_SIZE))}
            {" "}· showing up to {OFFSET_PAGE_SIZE.toLocaleString()} messages
          </span>
          <div>
            <button className="ghost compact" onClick={props.onPagePrev} disabled={!pagination || pagination.prevOffsets.length === 0}>Prev</button>
            <button className="ghost compact" onClick={props.onPageNext} disabled={!pagination?.hasNext}>Next</button>
          </div>
        </div>
      )}
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
        <div ref={messageTableRef} className="consume-grid-table-wrap">
          <DataGrid
            data={filteredMessages}
            columns={columns}
            className="tanstack-message-table"
            emptyText="No messages"
            getRowKey={(message) => `${message.partition}-${message.offset}-${message.timestamp}`}
            getRowClassName={(message) => (props.selectedMessage === message ? "selected" : "")}
            getRowStyle={(message) => ({ borderLeftColor: getPartitionColor(message.partition) })}
            onRowClick={props.onSelectMessage}
          />
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

function GroupStateBadge({ state }: { state?: string }) {
  const normalized = (state || "unknown").toLowerCase();
  return <span className={`group-state-badge ${normalized}`}>{state || "UNKNOWN"}</span>;
}

function groupRowsByTopic(rows: ConsumerGroupLagDetail["rows"]) {
  const grouped = new Map<string, ConsumerGroupLagDetail["rows"]>();
  for (const row of rows) {
    grouped.set(row.topic, [...(grouped.get(row.topic) ?? []), row]);
  }
  return [...grouped.entries()].map(([topic, topicRows]) => {
    const totalLag = topicRows.reduce<bigint | null>((total, row) => {
      if (!/^\d+$/.test(row.lag)) return total;
      return (total ?? 0n) + BigInt(row.lag);
    }, null);
    return {
      topic,
      rows: topicRows,
      totalLag: totalLag?.toString() ?? "-"
    };
  });
}

function ConsumerGroupsPanel(props: {
  groups: ConsumerGroupSummary[];
  selectedGroupId: string;
  detail: ConsumerGroupLagDetail | null;
  detailsByGroup: Record<string, ConsumerGroupLagDetail>;
  onSelectGroup: (groupId: string) => void;
  onBack: () => void;
  onRefresh: () => void;
  onRefreshDetail: () => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = props.groups.filter((group) => group.groupId.toLowerCase().includes(normalizedQuery));
  const groupColumns = useMemo<ColumnDef<ConsumerGroupSummary>[]>(() => [
    {
      accessorKey: "groupId",
      header: "Group ID",
      cell: ({ row }) => <strong title={row.original.groupId}>{row.original.groupId}</strong>
    },
    {
      id: "members",
      header: "Num Of Members",
      accessorFn: (group) => group.members ?? -1,
      cell: ({ row }) => row.original.members ?? "-"
    },
    {
      id: "topics",
      header: "Num Of Topics",
      accessorFn: (group) => props.detailsByGroup[group.groupId]
        ? new Set(props.detailsByGroup[group.groupId].rows.map((item) => item.topic)).size
        : group.topics ?? -1,
      cell: ({ row }) => {
        const detail = props.detailsByGroup[row.original.groupId];
        return detail ? new Set(detail.rows.map((item) => item.topic)).size : row.original.topics ?? "-";
      }
    },
    {
      id: "lag",
      header: "Consumer Lag",
      accessorFn: (group) => {
        const lag = props.detailsByGroup[group.groupId]?.totalLag ?? group.totalLag;
        return /^\d+$/.test(lag ?? "") ? Number(lag) : -1;
      },
      cell: ({ row }) => {
        const lag = props.detailsByGroup[row.original.groupId]?.totalLag ?? row.original.totalLag ?? "N/A";
        return <span className={lag !== "N/A" && lag !== "-" && lag !== "0" ? "lag-warn" : ""}>{lag}</span>;
      }
    },
    {
      accessorKey: "coordinator",
      header: "Coordinator",
      cell: ({ row }) => row.original.coordinator ?? "-"
    },
    {
      accessorKey: "state",
      header: "State",
      cell: ({ row }) => <GroupStateBadge state={row.original.state} />
    }
  ], [props.detailsByGroup]);
  const lagColumns = useMemo<ColumnDef<ConsumerGroupLagRow>[]>(() => [
    {
      accessorKey: "partition",
      header: "Partition"
    },
    {
      id: "currentOffset",
      header: "Current Offset",
      accessorFn: (row) => /^\d+$/.test(row.currentOffset) ? Number(row.currentOffset) : -1,
      cell: ({ row }) => <span title={row.original.currentOffset}>{row.original.currentOffset}</span>
    },
    {
      id: "endOffset",
      header: "End Offset",
      accessorFn: (row) => /^\d+$/.test(row.endOffset) ? Number(row.endOffset) : -1,
      cell: ({ row }) => <span title={row.original.endOffset}>{row.original.endOffset}</span>
    },
    {
      id: "lag",
      header: "Consumer Lag",
      accessorFn: (row) => /^\d+$/.test(row.lag) ? Number(row.lag) : -1,
      cell: ({ row }) => <span className={row.original.lag !== "-" && row.original.lag !== "0" ? "lag-warn" : ""}>{row.original.lag}</span>
    },
    {
      accessorKey: "metadata",
      header: "Metadata",
      cell: ({ row }) => <span title={row.original.metadata ?? ""}>{row.original.metadata || "-"}</span>
    }
  ], []);

  if (props.detail) {
    const groupedTopics = groupRowsByTopic(props.detail.rows).filter((topic) => topic.topic.toLowerCase().includes(normalizedQuery));
    return (
      <section className="panel groups-panel">
        <div className="group-detail-header">
          <button className="ghost compact" onClick={props.onBack}>Consumers</button>
          <span>/</span>
          <h2 title={props.detail.groupId}>{props.detail.groupId}</h2>
          <button className="ghost compact" onClick={props.onRefreshDetail}><RefreshCw size={15} /> 새로고침</button>
        </div>
        <div className="group-summary-grid">
          <div><span>State</span><strong><GroupStateBadge state={props.detail.state} /></strong></div>
          <div><span>Members</span><strong>{props.detail.members}</strong></div>
          <div><span>Assigned Topics</span><strong>{new Set(props.detail.rows.map((row) => row.topic)).size}</strong></div>
          <div><span>Assigned Partitions</span><strong>{props.detail.rows.length}</strong></div>
          <div><span>Total Lag</span><strong className={props.detail.totalLag !== "-" && props.detail.totalLag !== "0" ? "lag-warn" : ""}>{props.detail.totalLag}</strong></div>
        </div>
        <div className="search-box group-search">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by topic name" />
          {query && <button onClick={() => setQuery("")} title="Clear search"><X size={13} /></button>}
        </div>
        <div className="group-topic-detail-list">
          {groupedTopics.map((topic) => (
            <section key={topic.topic} className="group-topic-card">
              <div className="group-topic-row">
                <strong title={topic.topic}>{topic.topic}</strong>
                <span className={topic.totalLag !== "-" && topic.totalLag !== "0" ? "lag-warn" : ""}>{topic.totalLag}</span>
              </div>
              <DataGrid
                data={topic.rows}
                columns={lagColumns}
                className="group-lag-table"
                emptyText="No committed offsets"
                getRowKey={(row) => `${row.topic}-${row.partition}`}
              />
            </section>
          ))}
          {groupedTopics.length === 0 && <div className="empty-list">No committed offsets</div>}
        </div>
      </section>
    );
  }

  return (
    <section className="panel groups-panel">
      <div className="section-title">
        <h2>Consumers</h2>
        <button className="ghost compact" onClick={props.onRefresh}><RefreshCw size={15} /> 조회</button>
      </div>
      <div className="search-box group-search">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by Consumer Group ID" />
        {query && <button onClick={() => setQuery("")} title="Clear search"><X size={13} /></button>}
      </div>
      <DataGrid
        data={filteredGroups}
        columns={groupColumns}
        className="consumer-groups-table"
        emptyText="No consumer groups"
        getRowKey={(group) => group.groupId}
        getRowClassName={(group) => (group.groupId === props.selectedGroupId ? "selected" : "")}
        onRowClick={(group) => props.onSelectGroup(group.groupId)}
      />
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
