import type { AppLanguage } from "./i18n";

export type ReleaseNote = {
  title: string;
  items: string[];
};

export const releaseNotes: Record<string, Record<AppLanguage, ReleaseNote>> = {
  "2.0.4": {
    ko: {
      title: "Kafka Tool 2.0.4",
      items: [
        "서버 연결 테스트",
        "서버 추가/수정 팝업에서 저장 전에 Kafka 연결을 확인하는 Test 버튼을 추가했습니다.",
        "서버 이름과 Broker 필수값 검증, 연결 실패 메시지를 팝업 내부에서 바로 확인할 수 있습니다.",
        "UI 표시 수정",
        "서버/토픽 우클릭 메뉴가 다크 테마 색상으로 표시되도록 수정했습니다.",
        "연결 실패 서버 아이콘 중앙에 불필요한 x 문자가 겹쳐 보이던 문제를 수정했습니다.",
        "문서 업데이트",
        "README, 한글 README, 변경 이력, 릴리즈 가이드, 기능 문서를 최신 내용으로 정리했습니다."
      ]
    },
    en: {
      title: "Kafka Tool 2.0.4",
      items: [
        "Server connection test",
        "Added a Test action in the server profile dialog to verify Kafka connectivity before saving.",
        "Required-field validation and connection test errors are now shown directly inside the dialog.",
        "UI fixes",
        "Fixed server/topic context menus so they use the dark theme colors.",
        "Fixed failed server connection indicators showing an extra center x.",
        "Documentation updates",
        "Updated README, Korean README, changelog, release guide, and feature docs."
      ]
    }
  },
  "2.0.3": {
    ko: {
      title: "Kafka Tool 2.0.3",
      items: [
        "스마트 자동 발행 (Interval Produce)",
        "정해진 주기(Every)마다 메시지를 연속으로 발행할 수 있습니다.",
        "지정한 횟수(Count) 또는 시간(Duration)에 도달하면 안전하게 자동 종료됩니다.",
        "유효하지 않은 문법이나 종료 조건은 시작 전에 미리 검증합니다.",
        "동적 치환 템플릿 엔진",
        "Key, Headers, Value에 ${seq}, ${random}, ${date}, ${uuid} 등의 문법을 사용해 매번 다른 데이터를 생성할 수 있습니다.",
        "Preview 버튼으로 실제 변수가 치환되어 발행될 렌더링 결과를 미리 확인할 수 있습니다.",
        "자주 쓰는 메시지 규격을 토픽별로 저장하고, 불러오고, 관리할 수 있습니다.",
        "UX 및 단축키 개선",
        "Ctrl/Cmd+Right, Ctrl/Cmd+Left로 Topic 탭을 좌우 Pane 사이에서 이동할 수 있습니다.",
        "Ctrl/Cmd+W로 활성화된 Pane의 현재 Topic 탭을 닫을 수 있습니다."
      ]
    },
    en: {
      title: "Kafka Tool 2.0.3",
      items: [
        "Smart automatic publishing (Interval Produce)",
        "Messages can be published repeatedly at a fixed Every interval.",
        "Publishing stops safely when the selected Count or Duration limit is reached.",
        "Invalid syntax and stop conditions are validated before Interval Produce starts.",
        "Dynamic replacement template engine",
        "Key, Headers, and Value can use ${seq}, ${random}, ${date}, ${uuid}, and other fields to generate changing data.",
        "Preview shows the rendered result before publishing.",
        "Frequently used message shapes can be saved, loaded, and managed per Topic.",
        "UX and shortcut improvements",
        "Ctrl/Cmd+Right and Ctrl/Cmd+Left can move Topic tabs between left and right panes.",
        "Ctrl/Cmd+W closes the current Topic tab in the active pane."
      ]
    }
  },
  "2.0.2": {
    ko: {
      title: "Kafka Tool 2.0.2",
      items: [
        "환경설정에서 앱 내부 단축키를 편집할 수 있습니다.",
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
        "Key/Value를 Text, JSON, Hex, Base64로 조회하고 Export에도 같은 표현을 반영합니다.",
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
        "대량 Consume 조회와 Split Pane 동작 성능을 개선했습니다."
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
