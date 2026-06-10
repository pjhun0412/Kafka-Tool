# Kafka Tool 프로젝트 구조

이 문서는 Kafka Tool의 현재 구조와 리팩토링 기준을 빠르게 파악하기 위한 개발 문서입니다. 모든 문서는 UTF-8로 유지합니다.

## 개요

Kafka Tool은 Electron, React, TypeScript, KafkaJS 기반의 Apache Kafka 데스크톱 클라이언트입니다.

주요 목적은 여러 Kafka 클러스터를 등록하고, Broker/Topic/Consumer Group을 조회하며, 메시지를 Consume/Produce/Export하고 Topic 설정과 Avro Schema를 관리하는 것입니다.

## 기술 스택

- Electron: 데스크톱 앱, native menu, dialog, updater
- React: renderer UI
- TypeScript: main/preload/renderer 타입 안정성
- KafkaJS: Kafka admin, consumer, producer
- Zustand: UI 및 도메인 상태 관리
- TanStack Table / Virtual: 대용량 grid 렌더링
- avsc: Avro encode/decode
- electron-builder / electron-updater: 패키징 및 업데이트
- Vite / Tailwind CSS / PostCSS: renderer 빌드와 스타일

## 루트 구조

```text
kafka-tool/
├─ build/                  아이콘 및 빌드 리소스
├─ dist/                   Vite/Electron 빌드 결과
├─ docs/                   기능별 문서
├─ out/                    electron-builder 패키징 결과
├─ scripts/                실행/배포 보조 스크립트
├─ src/
│  ├─ main/                Electron main process
│  ├─ preload/             preload bridge
│  ├─ renderer/            React renderer
│  └─ shared/              공통 타입
├─ README.md
├─ README.ko.md
├─ package.json
├─ tsconfig.json
├─ tsconfig.electron.json
└─ vite.config.ts
```

## src/main

Electron main process 영역입니다. KafkaJS 연동, IPC 핸들러, 파일 입출력, 자동 업데이트, native dialog를 담당합니다.

```text
src/main/
├─ ipc/                    Kafka/설정/업데이트 IPC 모듈
├─ kafka/                  Kafka client/admin/consumer/producer 유틸
├─ avroDecoder.ts
├─ main.ts                 Electron app entry
├─ menuText.ts             메뉴 i18n 텍스트
└─ messageMapper.ts
```

주요 책임:

- Kafka client/admin/consumer/producer 생성
- Broker, Topic, Consumer Group 조회
- Offset/Time/Live consume 처리
- Produce, export, record 처리
- Topic create/delete/purge/config 변경
- 설정 import/export
- 자동 업데이트 확인 및 다운로드
- Electron 메뉴와 윈도우 수명주기 관리

## src/preload

Renderer가 main process 기능을 안전하게 호출할 수 있도록 bridge API를 제공합니다.

```text
src/preload/
└─ preload.ts
```

## src/shared

main/preload/renderer에서 함께 사용하는 타입 정의 영역입니다.

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
- `ConsumerGroupDetail`
- `AppPreferences`
- Avro/schema/export/update 관련 타입

## src/renderer

React UI 영역입니다.

```text
src/renderer/
├─ components/             화면 컴포넌트
├─ hooks/                  UI/도메인 hook
├─ stores/                 Zustand store
├─ i18n.ts                 한국어/영어 메시지
├─ main.tsx                React entry
├─ styles.css              전역 스타일
├─ uiTypes.ts              renderer UI 타입
├─ utils.tsx               UI 유틸
├─ quickSearch.ts          global search 모델
├─ messageFilters.ts       consume 메시지 필터
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
├─ consume/                Consume toolbar, grid, JSON viewer, filters
├─ feedback/               toast, pane feedback
├─ groups/                 Consumer Group 목록/상세
├─ primary/                Primary workspace pane
├─ produce/                Produce panel
├─ sidebar/                Server/Topic sidebar
├─ split/                  Split workspace pane
├─ tabs/                   Cluster/Topic tab
├─ topics/                 Brokers/Topics/Topic detail/settings
├─ WorkspaceContextMenus.tsx
├─ WorkspaceLayout.tsx
├─ WorkspaceOverlays.tsx
└─ WorkspacePaneContent.tsx
```

## renderer/hooks

상태 조립과 기능 로직을 컴포넌트에서 분리한 hook 영역입니다.

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

`useWorkspaceAppController.ts`는 최상위 orchestration hook입니다. 현재는 직접 로직을 들고 있기보다 하위 controller와 composition hook을 순서대로 연결하는 역할만 합니다.

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

- controller 파일끼리 직접 순환 의존을 만들지 않습니다.
- `useWorkspaceAppController.ts`는 실행 순서가 보이는 조립자 역할로 유지합니다.
- 하위 controller는 필요한 입력을 명시 타입으로 받습니다.
- `Record<string, any>` 같은 느슨한 wiring 타입은 사용하지 않습니다.
- factory/helper는 의미 있는 파라미터 그룹화가 있을 때만 추가합니다.

## renderer/stores

Zustand store 영역입니다.

```text
src/renderer/stores/
├─ domain/
│  └─ serverClusterStore.ts
└─ ui/
   ├─ feedbackStore.ts
   ├─ layoutStore.ts
   ├─ manualAvroSchemaStore.ts
   ├─ preferencesStore.ts
   ├─ searchStore.ts
   ├─ serverFormStore.ts
   ├─ sidebarInteractionStore.ts
   └─ workspacePaneStore.ts
```

현재 역할:

- `serverClusterStore`: 서버 목록, 선택 서버, cluster resource 상태
- `feedbackStore`: toast/status
- `layoutStore`: sidebar, split, viewer 크기
- `workspacePaneStore`: primary/split pane 상태
- `searchStore`: global/topic search UI 상태
- `preferencesStore`: 환경설정 UI 상태
- `manualAvroSchemaStore`: 수동 Avro schema UI 상태
- `serverFormStore`: 서버 등록/수정 form 상태
- `sidebarInteractionStore`: context menu, drag/drop 상태

## 주요 기능

- 멀티 클러스터 서버 관리
- Broker/Topic/Consumer Group 탐색
- Topic 상세, 설정 조회/수정, 생성, clear messages, 삭제
- Offset/Time/Live Consume
- Live Record JSONL 저장
- Produce
- Avro Schema Registry 및 수동 schema
- Split workspace pane
- Ctrl+P / Ctrl+K global search
- 대용량 grid virtualization
- 한국어/영어 UI
- GitHub Releases 기반 자동 업데이트

## 검증 명령

```bash
npm run typecheck
npm run build
```

## 패키징

Windows:

```bash
npm run package:win
```

macOS:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run package:mac
```

## 운영 메모

- Release 전에는 `package.json` 버전과 GitHub Release asset을 맞춥니다.
- Windows 자동 업데이트는 `latest.yml`을 사용합니다.
- macOS 자동 업데이트는 `latest-mac.yml`이 필요합니다.
- 사내 unsigned macOS 배포는 Gatekeeper 수동 허용이 필요할 수 있습니다.
- 서버 secret은 로컬 설정 파일에 저장될 수 있으므로 export 파일 공유에 주의합니다.
