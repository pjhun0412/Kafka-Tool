import type { AppLanguage } from "./i18n";

type ReleaseNoteSection = {
  heading?: string;
  items: string[];
};

export type ReleaseNote = {
  title: string;
  sections: ReleaseNoteSection[];
};

export const releaseNotes: Record<string, Record<AppLanguage, ReleaseNote>> = {
  "2.0.4": {
    ko: {
      title: "Kafka Tool 2.0.4",
      sections: [
        {
          heading: "서버 연결 테스트",
          items: [
            "서버 추가/수정 팝업에 Test 버튼을 추가하여 저장 전에 Kafka 연결을 미리 확인할 수 있습니다.",
            "필수값 누락 검증 및 연결 실패 원인을 팝업 내부에서 바로 확인할 수 있습니다."
          ]
        },
        {
          heading: "UI 버그 수정",
          items: [
            "서버/토픽 우클릭 메뉴가 다크 테마 색상과 자연스럽게 표시되도록 수정했습니다.",
            "연결에 실패한 서버 아이콘 중앙에 불필요한 x 문자가 겹쳐 보이던 문제를 해결했습니다."
          ]
        }
      ]
    },
    en: {
      title: "Kafka Tool 2.0.4",
      sections: [
        {
          heading: "Server connection test",
          items: [
            "Added a Test button in the server profile dialog to verify Kafka connectivity before saving.",
            "Required-field validation and detailed connection errors are now shown directly inside the dialog."
          ]
        },
        {
          heading: "UI fixes",
          items: [
            "Fixed server/topic context menus to properly match dark theme colors.",
            "Fixed failed server connection indicators showing an extra overlapping x character."
          ]
        }
      ]
    }
  },
  "2.0.3": {
    ko: {
      title: "Kafka Tool 2.0.3",
      sections: [
        {
          heading: "스마트 자동 발행 (Interval Produce)",
          items: [
            "지정한 주기(Every)마다 메시지를 연속으로 자동 발행할 수 있습니다.",
            "설정한 횟수(Count) 또는 시간(Duration)에 도달하면 발행이 안전하게 자동 종료됩니다.",
            "유효하지 않은 문법이나 종료 조건은 시작 전에 미리 검증하여 실수를 방지합니다."
          ]
        },
        {
          heading: "동적 치환 템플릿 엔진",
          items: [
            "Key, Headers, Value에 ${seq}, ${random}, ${date}, ${uuid} 등의 문법으로 매번 다른 테스트 데이터를 발행할 수 있습니다.",
            "Preview 버튼으로 실제 치환된 발행 결과를 미리 확인할 수 있습니다.",
            "자주 쓰는 메시지 규격을 토픽별로 저장하고 불러와서 관리할 수 있습니다."
          ]
        },
        {
          heading: "단축키 및 작업 효율 개선",
          items: [
            "Ctrl/Cmd+Right / Left 단축키로 토픽 탭을 좌우 분할 화면(Split Pane) 간에 빠르게 이동할 수 있습니다.",
            "Ctrl/Cmd+W 단축키로 현재 활성화된 Pane의 토픽 탭을 즉시 닫을 수 있습니다."
          ]
        }
      ]
    },
    en: {
      title: "Kafka Tool 2.0.3",
      sections: [
        {
          heading: "Smart automatic publishing (Interval Produce)",
          items: [
            "Messages can be published repeatedly at a fixed Every interval.",
            "Publishing stops safely when the selected Count or Duration limit is reached.",
            "Invalid syntax and stop conditions are validated upfront to prevent accidental heavy loads."
          ]
        },
        {
          heading: "Dynamic replacement template engine",
          items: [
            "Key, Headers, and Value support ${seq}, ${random}, ${date}, ${uuid}, and more to generate unique test data per message.",
            "Use the Preview button to inspect the fully rendered payload before publishing.",
            "Frequently used message shapes can be saved, loaded, and managed per topic."
          ]
        },
        {
          heading: "Shortcut and workflow improvements",
          items: [
            "Press Ctrl/Cmd+Right / Left to move Topic tabs between left and right split panes.",
            "Press Ctrl/Cmd+W to close the current Topic tab in the active pane."
          ]
        }
      ]
    }
  },
  "2.0.2": {
    ko: {
      title: "Kafka Tool 2.0.2",
      sections: [
        {
          items: [
            "환경설정(Preferences)에서 앱 내 모든 단축키를 직접 편집할 수 있습니다.",
            "macOS(Cmd) 및 Windows/Linux(Ctrl) OS 표준에 맞게 단축키가 자연스럽게 동작합니다.",
            "앱 업데이트 직후 주요 변경 사항을 한눈에 보여주는 Release Notes 팝업이 추가됐습니다. Help 메뉴에서 언제든 다시 열 수 있습니다."
          ]
        }
      ]
    },
    en: {
      title: "Kafka Tool 2.0.2",
      sections: [
        {
          items: [
            "Keyboard shortcuts used inside the app can now be fully customized in Preferences.",
            "Shortcut handling now maps naturally to Cmd on macOS and Ctrl on Windows/Linux.",
            "Introduced this Release Notes view to show key changes right after an app update. Reopen anytime via the Help menu."
          ]
        }
      ]
    }
  },
  "2.0.1": {
    ko: {
      title: "Kafka Tool 2.0.1",
      sections: [
        {
          items: [
            "Message Viewer에 Raw, Tree, Preview 탭 분리 모드를 도입하고, 마지막으로 선택한 뷰 모드를 기억합니다.",
            "Key와 Value를 Text, JSON, Hex, Base64 포맷으로 조회하고 내보내기(Export) 시에도 해당 포맷이 그대로 적용됩니다.",
            "Live Record 시 렌더러 메모리를 거치지 않고 파일 스트림에 직접 기록하여 장시간 수집 중 메모리 누적을 방지합니다."
          ]
        }
      ]
    },
    en: {
      title: "Kafka Tool 2.0.1",
      sections: [
        {
          items: [
            "Message Viewer now separates Raw, Tree, and Preview tabs and remembers your last selected view mode.",
            "Key/Value can be inspected as Text, JSON, Hex, or Base64, and exports preserve your selected representation.",
            "Live Record now writes directly through a file stream, preventing renderer memory growth during long captures."
          ]
        }
      ]
    }
  },
  "2.0.0": {
    ko: {
      title: "Kafka Tool 2.0.0",
      sections: [
        {
          items: [
            "앱 내부에서 직접 Topic 생성, Settings 편집, Clear Messages를 실행할 수 있습니다.",
            "Broker 상세 화면에서 Configs, Metrics, Log directory 정보를 확인할 수 있습니다.",
            "Consumer Group 상세 화면을 토픽별 접기/펼치기(Collapsible) 형태로 개선했습니다.",
            "한국어/영어 UI와 Inter + Noto Sans KR 폰트를 공식 지원합니다.",
            "대량 Consume 조회 속도와 Split Pane 반응 속도를 크게 향상했습니다."
          ]
        }
      ]
    },
    en: {
      title: "Kafka Tool 2.0.0",
      sections: [
        {
          items: [
            "Added Topic creation, Settings editing, and Clear Messages directly inside the app.",
            "Added Broker detail views with Configs, live Metrics, and Log directory information.",
            "Redesigned Consumer Group details with collapsible per-topic sections.",
            "Added full Korean/English UI support with Inter and Noto Sans KR fonts.",
            "Greatly improved performance for large Consume queries and split pane interactions."
          ]
        }
      ]
    }
  }
};

export function getReleaseNote(version: string, language: AppLanguage) {
  return releaseNotes[version]?.[language] ?? releaseNotes[version]?.en;
}
