/// <reference types="vite/client" />

import type { KafkaApi } from "../shared/types";

declare global {
  interface Window {
    kafkaApi: KafkaApi;
  }
}
