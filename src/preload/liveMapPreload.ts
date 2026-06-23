import { contextBridge, ipcRenderer } from "electron";
import type { LiveMapPoint } from "../shared/types.js";

contextBridge.exposeInMainWorld("liveMapApi", {
  onPoints(callback: (points: LiveMapPoint[]) => void) {
    const listener = (_event: Electron.IpcRendererEvent, points: LiveMapPoint[]) => callback(points);
    ipcRenderer.on("live-map:points", listener);
    return () => ipcRenderer.removeListener("live-map:points", listener);
  },
  clearPoints() {
    return ipcRenderer.invoke("app:clear-live-map-points");
  },
  getPoints() {
    return ipcRenderer.invoke("app:get-live-map-points") as Promise<LiveMapPoint[]>;
  }
});
