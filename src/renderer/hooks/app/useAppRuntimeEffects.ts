import { useElectronMenuEvents, usePersistedPreferences } from "../preferences";
import { useServerBootstrap, useServerHealthMonitor } from "../ui";
import { useKafkaConsumeEvents, useSelectedServerResources } from "../workspace";

type AppRuntimeEffectsParams = {
  serverBootstrap: Parameters<typeof useServerBootstrap>[0];
  persistedPreferences: Parameters<typeof usePersistedPreferences>[0];
  serverHealthMonitor: Parameters<typeof useServerHealthMonitor>[0];
  electronMenuEvents: Parameters<typeof useElectronMenuEvents>[0];
  kafkaConsumeEvents: Parameters<typeof useKafkaConsumeEvents>[0];
  selectedServerResources: Parameters<typeof useSelectedServerResources>[0];
};

export function useAppRuntimeEffects(params: AppRuntimeEffectsParams) {
  useServerBootstrap(params.serverBootstrap);
  usePersistedPreferences(params.persistedPreferences);
  useServerHealthMonitor(params.serverHealthMonitor);
  useElectronMenuEvents(params.electronMenuEvents);
  useKafkaConsumeEvents(params.kafkaConsumeEvents);
  useSelectedServerResources(params.selectedServerResources);
}
