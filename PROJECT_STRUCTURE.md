# Kafka Tool 프로젝트 구조

이 문서는 Kafka Tool의 현재 구조와 리팩토링 기준을 빠르게 파악하기 위한 개발 문서입니다. 모든 문서는 UTF-8로 유지합니다.

## 개요

Kafka Tool은 Electron, React, TypeScript, KafkaJS 기반의 Apache Kafka 데스크톱 클라이언트입니다.

주요 목적은 여러 Kafka 클러스터를 등록하고, Broker/Topic/Consumer Group을 조회하며, 메시지를 Consume/Produce/Export하고, Topic 설정과 Avro Schema를 관리하는 것입니다.

## 기술 스택

- Electron: 데스크톱 앱, native menu, dialog, updater
- React: Renderer UI
- TypeScript: Main/Preload/Renderer 타입 안정성
- KafkaJS: Kafka Admin, Consumer, Producer
- Zustand: UI 및 도메인 상태 관리
- TanStack Table / Virtual: 대용량 Grid 렌더링
- avsc: Avro encode/decode
- electron-builder / electron-updater: 패키징 및 업데이트
- Vite / Tailwind CSS / PostCSS: Renderer 빌드와 스타일

## 루트 구조

```text
kafka-tool/
├─ build/                  아이콘 및 빌드 리소스
├─ dist/                   Vite/Electron 빌드 결과
├─ docs/                   기능별 문서
├─ out/                    electron-builder 패키지 결과
├─ scripts/                실행/배포 보조 스크립트
├─ src/
│  ├─ main/                Electron Main Process
│  ├─ preload/             Preload Bridge
│  ├─ renderer/            React Renderer
│  └─ shared/              공통 타입
├─ CHANGELOG.md
├─ LICENSE
├─ README.md
├─ README.ko.md
├─ package.json
├─ tsconfig.json
├─ tsconfig.electron.json
└─ vite.config.ts
```

## src/main

Electron Main Process 영역입니다. KafkaJS 연동, IPC 핸들러, 파일 입출력, 자동 업데이트, native dialog를 담당합니다.

```text
src/main/
├─ ipc/                    Kafka/설정/업데이트 IPC 모듈
├─ avroDecoder.ts
├─ kafkaClient.ts          Kafka client/admin 생성 유틸
├─ logger.ts               앱 로그 기록
├─ main.ts                 Electron app entry
├─ menuText.ts             메뉴 i18n 텍스트
├─ messageMapper.ts
├─ settingsTransfer.ts
└─ storage.ts              서버/환경설정 저장소
```

주요 책임:

- Kafka client/admin/consumer/producer 생성
- Broker, Topic, Consumer Group 조회
- Offset/Time/Live Consume 처리
- Produce, Export, Record 처리
- Topic create/delete/purge/config 변경
- 서버 프로필 저장 및 저장 전 연결 테스트
- 설정 import/export
- 앱 로그 기록과 로그 보관 주기 관리
- 자동 업데이트 확인 및 다운로드
- Electron 메뉴와 윈도우 수명주기 관리

## src/preload

Renderer가 Main Process 기능을 안전하게 호출할 수 있도록 Bridge API를 제공합니다.

```text
src/preload/
└─ preload.ts
```

## src/shared

Main/Preload/Renderer에서 함께 사용하는 타입 정의 영역입니다.

```text
src/shared/
└─ types.ts
```

대표 타입:

- `ServerProfile`
- `TopicSummary`
- `TopicDetail`
- `ConsumedMessage`
- `ConsumerGroupSummary`
- `ConsumerGroupLagDetail`
- `AppPreferences`
- Avro, Schema Registry, Export, Update 관련 타입

## src/renderer

React UI 영역입니다.

```text
src/renderer/
├─ components/             화면 컴포넌트
├─ hooks/                  UI/도메인 Hook
├─ stores/                 Zustand Store
├─ styles/                 기능별 CSS
├─ i18n.ts                 한국어/영어 메시지
├─ main.tsx                React entry
├─ styles.css              전역 스타일 entry
├─ uiTypes.ts              Renderer UI 타입
├─ utils.tsx               UI 유틸
├─ quickSearch.ts          Global Search 모델
├─ messageFilters.ts       Consume 메시지 필터
├─ produceTemplate.ts      Produce 동적 필드/템플릿 유틸
├─ manualAvroSchema.ts
├─ topicSearch.ts
├─ workspaceState.ts
├─ workspaceMessages.ts
└─ consumeConfig.ts
```

## renderer/components

UI 컴포넌트는 화면 단위로 분리되어 있습니다.

```text
src/renderer/components/
├─ DataGrid.tsx
├─ QuickSearchPalette.tsx
├─ ServerConnectionIndicator.tsx
├─ modals/
└─ workspace/
```

`workspace/` 하위 구조:

```text
workspace/
├─ consume/                Consume toolbar, grid, viewer, filters
├─ feedback/               Toast, pane feedback
├─ groups/                 Consumer Group 목록/상세
├─ primary/                Primary workspace pane
├─ produce/                Produce panel
├─ sidebar/                Server/Topic sidebar
├─ split/                  Split workspace pane
├─ tabs/                   Cluster/Topic tab
├─ topics/                 Brokers/Topics/Topic detail/settings
├─ WorkspaceContextMenus.tsx
├─ WorkspaceDialogs.tsx
├─ WorkspaceLayout.tsx
├─ WorkspaceOverlays.tsx
└─ WorkspacePaneContent.tsx
```

## renderer/hooks

상태 조립과 기능 로직을 컴포넌트에서 분리한 Hook 영역입니다.

```text
src/renderer/hooks/
├─ app/
├─ consume/
├─ preferences/
├─ search/
├─ state/
└─ workspace/
```

### app/controller

`useWorkspaceAppController.ts`는 최상위 orchestration hook입니다. 직접 비즈니스 로직을 많이 갖기보다 하위 controller와 composition hook을 순서대로 연결하는 역할을 합니다.

```text
src/renderer/hooks/app/controller/
├─ useWorkspaceAppController.ts
├─ useWorkspaceControllerStateBindings.ts
├─ useWorkspaceControllerSearch.ts
├─ useWorkspaceControllerResources.ts
├─ useWorkspaceControllerModels.ts
├─ useWorkspaceControllerNavigation.ts
├─ useWorkspaceControllerMessageFlow.ts
├─ useWorkspaceControllerServer.ts
├─ useWorkspaceControllerSplit.ts
├─ useWorkspaceControllerTopicOperations.ts
├─ useWorkspaceControllerInteractions.ts
├─ useWorkspaceControllerRuntime.ts
├─ useWorkspaceControllerChrome.ts
├─ useWorkspaceControllerPanes.ts
├─ useWorkspaceControllerLayout.ts
├─ chrome/
├─ consumerGroups/
├─ contextMenus/
├─ derived/
├─ interactions/
├─ layout/
├─ messageFlow/
├─ models/
├─ navigation/
├─ panes/
├─ resources/
├─ runtime/
├─ search/
├─ server/
├─ setup/
├─ split/
├─ stateBindings/
├─ topics/
└─ view/
```

리팩토링 기준:

- Controller 파일끼리 직접 순환 의존을 만들지 않습니다.
- `useWorkspaceAppController.ts`는 실행 순서가 보이는 조립자 역할로 유지합니다.
- 하위 controller는 필요한 입력을 명시 타입으로 받습니다.
- `Record<string, any>` 같은 느슨한 wiring 타입은 사용하지 않습니다.
- Factory/helper는 의미 있는 파라미터 그룹화가 있을 때만 추가합니다.

## renderer/stores

Zustand Store 영역입니다.

```text
src/renderer/stores/
├─ domain/
│  └─ serverClusterStore.ts
└─ ui/
   ├─ feedbackStore.ts
   ├─ layoutStore.ts
   ├─ manualAvroSchemaStore.ts
   ├─ preferencesStore.ts
   ├─ releaseNotesStore.ts
   ├─ searchStore.ts
   ├─ serverFormStore.ts
   ├─ sidebarInteractionStore.ts
   ├─ topicCreateStore.ts
   └─ workspacePaneStore.ts
```

현재 역할:

- `serverClusterStore`: 서버 목록, 선택 서버, 클러스터 리소스 상태
- `feedbackStore`: Toast, Status, 연결 에러
- `layoutStore`: Sidebar, Split, Viewer 크기
- `workspacePaneStore`: Primary/Split Pane 상태
- `searchStore`: Global/Topic Search UI 상태
- `preferencesStore`: 환경설정 UI 상태
- `manualAvroSchemaStore`: 수동 Avro Schema UI 상태
- `serverFormStore`: 서버 등록/수정 Form 상태
- `sidebarInteractionStore`: Context Menu, Drag/Drop 상태

## 주요 기능

- 멀티 클러스터 서버 관리
- 서버 프로필 저장 전 Kafka 연결 테스트
- Broker/Topic/Consumer Group 탐색
- Topic 상세, 설정 조회/수정, 생성, Clear Messages, 삭제
- Offset/Time/Live Consume
- Live Record JSONL 저장
- Produce, Interval Produce, 동적 필드, 토픽별 템플릿
- Avro Schema Registry 및 수동 Schema
- Split Workspace Pane
- Ctrl/Cmd+P 또는 Ctrl/Cmd+K Global Search
- 대용량 Grid Virtualization
- 한국어/영어 UI
- GitHub Releases 기반 자동 업데이트

## 검증 명령

```bash
npm run build
```

## 패키지

Windows:

```bash
npm run package:win
```

macOS:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run package:mac
```

## 운영 메모

- Release 전에는 `package.json` 버전, GitHub Release Asset, `latest.yml` 또는 `latest-mac.yml`을 맞춥니다.
- Windows 자동 업데이트는 `latest.yml`을 사용합니다.
- macOS 자동 업데이트는 `latest-mac.yml`이 필요합니다.
- 사내 unsigned macOS 배포는 Gatekeeper 수동 허용이 필요할 수 있습니다.
- 서버 Secret은 로컬 설정 파일에 저장될 수 있으므로 Export 파일 공유에 주의합니다.
