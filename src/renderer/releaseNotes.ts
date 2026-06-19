import type { AppLanguage } from "./i18n";

export type ReleaseNote = {
  title: string;
  items: string[];
};

export const releaseNotes: Record<string, Record<AppLanguage, ReleaseNote>> = {
  "2.0.3": {
    ko: {
      title: "Kafka Tool 2.0.3",
      items: [
        "Produce에 Interval 발행 모드를 추가해 Count 또는 Duration 제한 안에서 반복 발행할 수 있습니다.",
        "Key, Headers, Value에서 ${seq}, ${random}, ${date}, ${uuid} 같은 동적 필드를 사용할 수 있습니다.",
        "Produce Preview에서 실제 발행될 Key, Headers, Value 렌더링 결과를 함께 확인할 수 있습니다.",
        "토픽별 Produce 템플릿 저장, 불러오기, 업데이트, 삭제를 지원합니다.",
        "잘못된 동적 필드 문법과 Count/Duration 종료 조건을 Interval 시작 전에 확인합니다.",
        "Ctrl/Cmd+→, Ctrl/Cmd+← 단축키로 Topic을 좌우 pane 사이에서 빠르게 이동할 수 있습니다.",
        "Topic/Consumer 그리드 셀 정렬을 다듬어 목록을 더 편하게 볼 수 있습니다."
      ]
    },
    en: {
      title: "Kafka Tool 2.0.3",
      items: [
        "Added Interval Produce with Count or Duration limits for repeated message publishing.",
        "Added dynamic fields such as ${seq}, ${random}, ${date}, and ${uuid} for Key, Headers, and Value.",
        "Produce Preview now shows the rendered Key, Headers, and Value before publishing.",
        "Added per-topic Produce templates with save, load, update, and delete support.",
        "Invalid dynamic field syntax and Count/Duration stop conditions are checked before Interval Produce starts.",
        "Ctrl/Cmd+Right and Ctrl/Cmd+Left can now move Topics between left and right panes.",
        "Refined Topic and Consumer grid cell alignment for easier scanning."
      ]
    }
  },
  "2.0.2": {
    ko: {
      title: "Kafka Tool 2.0.2",
      items: [
        "환경설정에서 앱 내부 키보드 단축키를 편집할 수 있습니다.",
        "macOS에서는 Cmd, Windows/Linux에서는 Ctrl 기반 단축키가 자연스럽게 동작합니다.",
        "앱 버전이 바뀌면 주요 변경 사항을 Release Notes로 한 번 안내합니다.",
        "Help 메뉴에서 Release Notes를 언제든 다시 열 수 있습니다.",
        "Shortcuts와 Split tabs 도움말을 한국어/영어 모두 최신 기능 기준으로 보강했습니다."
      ]
    },
    en: {
      title: "Kafka Tool 2.0.2",
      items: [
        "Keyboard shortcuts used inside the app can now be customized in Preferences.",
        "Shortcut handling now maps naturally to Cmd on macOS and Ctrl on Windows/Linux.",
        "Release Notes show key changes once after an app update.",
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
        "Key/Value를 Text, JSON, Hex, Base64로 조회하고 export에도 같은 표현을 반영합니다.",
        "Live Record는 장시간 수집 중 UI 메모리 증가를 줄이도록 파일 스트림 중심으로 기록합니다.",
        "Message Viewer, Live Record, 단축키 도움말을 보강했습니다."
      ]
    },
    en: {
      title: "Kafka Tool 2.0.1",
      items: [
        "Message Viewer separates Raw, Tree, and Preview modes and keeps the last selected mode.",
        "Key/Value formats can be viewed as Text, JSON, Hex, or Base64, and exports follow the selected representation.",
        "Live Record writes through a file stream to reduce renderer memory growth during long captures.",
        "Help now includes stronger Message Viewer, Live Record, and shortcut guidance."
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
