import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ImportSettingsResult, KafkaApi, UpdateStatus } from "../../shared/types";
import type { ToastState } from "../uiTypes";

type ElectronMenuEventParams = {
  kafkaApi: KafkaApi | undefined;
  openPreferencesSection: (section: "editor" | "avro") => void;
  applyImportedSettings: (result: ImportSettingsResult) => void;
  setStatus: (status: string) => void;
  setToast: Dispatch<SetStateAction<ToastState>>;
};

function getUpdateToastKind(updateStatus: UpdateStatus): "loading" | "success" | "error" {
  if (updateStatus.status === "error") return "error";
  if (
    updateStatus.status === "checking" ||
    updateStatus.status === "available" ||
    updateStatus.status === "download-progress"
  ) {
    return "loading";
  }
  return "success";
}

export function useElectronMenuEvents({
  kafkaApi,
  openPreferencesSection,
  applyImportedSettings,
  setStatus,
  setToast
}: ElectronMenuEventParams) {
  useEffect(() => {
    if (!kafkaApi) return;
    const offPreferencesOpen = kafkaApi.onPreferencesOpen((section) => {
      openPreferencesSection(section === "avro" ? "avro" : "editor");
    });
    return () => {
      offPreferencesOpen();
    };
  }, [kafkaApi, openPreferencesSection]);

  useEffect(() => {
    if (!kafkaApi) return;
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
  }, [kafkaApi, applyImportedSettings, setStatus, setToast]);

  useEffect(() => {
    if (!kafkaApi) return;
    const offUpdateStatus = kafkaApi.onUpdateStatus((updateStatus) => {
      const kind = getUpdateToastKind(updateStatus);
      setStatus(updateStatus.message);
      setToast({ message: updateStatus.message, kind });
    });
    return () => {
      offUpdateStatus();
    };
  }, [kafkaApi, setStatus, setToast]);
}
