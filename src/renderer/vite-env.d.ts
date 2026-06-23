/// <reference types="vite/client" />

import type { KafkaApi, LiveMapPoint } from "../shared/types";

declare global {
  interface Window {
    kafkaApi: KafkaApi;
    liveMapApi: {
      onPoints: (callback: (points: LiveMapPoint[]) => void) => () => void;
      clearPoints: () => Promise<void>;
      getPoints: () => Promise<LiveMapPoint[]>;
    };
  }
}
