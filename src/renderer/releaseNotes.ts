import type { AppLanguage } from "./i18n";

export type ReleaseNote = {
  title: string;
  items: string[];
};

export const releaseNotes: Record<string, Record<AppLanguage, ReleaseNote>> = {
  "2.0.2": {
    ko: {
      title: "Kafka Tool 2.0.2",
      items: [
        "환경설정에서 앱 내부 키보드 단축키를 편집할 수 있습니다.",
        "macOS에서는 Cmd, Windows/Linux에서는 Ctrl 기반 단축키가 자연스럽게 동작합니다.",
        "업데이트 후 새 버전의 주요 변경사항을 What’s New 모달로 한 번 안내합니다.",
        "Help 메뉴에서 Release Notes를 언제든 다시 확인할 수 있습니다.",
        "Help 메뉴의 Shortcuts, Split tabs 안내를 한글/영어 모두 최신 기능 기준으로 보강했습니다."
      ]
    },
    en: {
      title: "Kafka Tool 2.0.2",
      items: [
        "Keyboard shortcuts used inside the app can now be customized in Preferences.",
        "Shortcut handling now maps naturally to Cmd on macOS and Ctrl on Windows/Linux.",
        "A What’s New dialog shows key changes once after an app update.",
        "Release Notes can be reopened anytime from the Help menu.",
        "Help content for Shortcuts and Split tabs was refreshed in both Korean and English."
      ]
    }
  },
  "2.0.1": {
    ko: {
      title: "Kafka Tool 2.0.1",
      items: [
        "Message Viewer에서 Raw, Tree, Preview 모드를 분리하고 마지막 선택 모드를 유지합니다.",
        "Key/Value 포맷을 Text, JSON, Hex, Base64로 조회하고 export에도 같은 표현을 반영합니다.",
        "Live Record는 장시간 수집 시 UI 메모리 증가를 줄이도록 파일 스트림 중심으로 기록합니다.",
        "환경설정에서 앱 내부 단축키를 macOS/Windows 공통 방식으로 편집할 수 있습니다.",
        "Help 메뉴에 Shortcuts, Message Viewer, Live Record 안내를 보강했습니다."
      ]
    },
    en: {
      title: "Kafka Tool 2.0.1",
      items: [
        "Message Viewer now separates Raw, Tree, and Preview modes and keeps the last selected mode.",
        "Key/Value formats can be viewed as Text, JSON, Hex, or Base64, and exports follow the selected representation.",
        "Live Record writes through a file stream to reduce renderer memory growth during long captures.",
        "App keyboard shortcuts can now be customized across macOS and Windows/Linux.",
        "Help now includes stronger Shortcuts, Message Viewer, and Live Record guidance."
      ]
    }
  },
  "2.0.0": {
    ko: {
      title: "Kafka Tool 2.0.0",
      items: [
        "Topic 생성, Settings 편집, Clear Messages 기능을 추가했습니다.",
        "Broker 상세 화면에서 Configs, Metrics, Log directory 정보를 확인할 수 있습니다.",
        "Consumer Group 상세를 Topic별 접기/펼치기 형태로 개선했습니다.",
        "한국어/영어 UI와 Inter + Noto Sans KR 폰트 구성을 추가했습니다.",
        "대량 Consume 조회와 split pane 동작 성능을 개선했습니다."
      ]
    },
    en: {
      title: "Kafka Tool 2.0.0",
      items: [
        "Added Topic creation, Settings editing, and Clear Messages.",
        "Added Broker detail views for Configs, Metrics, and Log directory information.",
        "Improved Consumer Group details with collapsible Topic sections.",
        "Added Korean/English UI and Inter + Noto Sans KR font support.",
        "Improved large Consume queries and split pane performance."
      ]
    }
  }
};

export function getReleaseNote(version: string, language: AppLanguage) {
  return releaseNotes[version]?.[language] ?? releaseNotes[version]?.en;
}
