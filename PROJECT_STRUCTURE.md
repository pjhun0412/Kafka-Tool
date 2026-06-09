# Kafka Tool 작업 내역 및 프로젝트 구조

이 문서는 현재 Kafka Tool 프로젝트의 구현 상태, 주요 기능, 폴더별 책임, 리팩토링 진행 방향을 정리한 문서입니다. 팀원이 프로젝트를 처음 열었을 때 전체 구조를 빠르게 파악하는 용도로 사용합니다.

## 프로젝트 개요

Kafka Tool은 Electron, React, TypeScript, KafkaJS 기반의 데스크톱 Kafka 탐색/운영 도구입니다.

주요 목적은 사내 개발자와 운영자가 Kafka 클러스터를 등록하고, 토픽/브로커/컨슈머 그룹을 확인하며, 메시지를 consume/produce/export 할 수 있게 하는 것입니다.

## 기술 스택

- Electron: 데스크톱 앱 구동, 네이티브 메뉴, 파일 다이얼로그, 자동 업데이트
- React: 렌더러 UI
- TypeScript: main/preload/renderer 공통 타입 안정성
- KafkaJS: Kafka admin, consumer, producer 기능
- TanStack Table: 그리드 정렬/필터링
- TanStack Virtual: 대량 데이터 렌더링 최적화 기반
- Zustand: UI/도메인 상태 분리 진행 중
- avsc: Avro schema 기반 디코딩
- electron-updater: GitHub Releases 기반 자동 업데이트
- Tailwind/PostCSS/CSS: UI 스타일링

## 현재 주요 기능

### 서버/클러스터 관리

- Kafka 서버 등록, 수정, 삭제
- 서버 검색
- 서버 순서 변경
- 서버별 연결/해제
- 연결 상태 표시
- 연결 실패 시 오류 다이얼로그 표시
- 클러스터 탭 지원
- 서버 탭 가운데 버튼 클릭 닫기
- 로컬 사용자 설정 저장
- 설정 import/export

### 토픽 탐색

- 서버별 토픽 목록 조회
- 토픽 검색 고도화
- 최근 검색어 관리
- 토픽 즐겨찾기
- 즐겨찾기 고정 영역
- 토픽별 메시지 수 표시
- 토픽 정렬/필터
- 토픽 더블클릭 시 탭 열기
- 토픽 탭 가운데 버튼 클릭 닫기
- 좌/우 토픽 패널 분할
- 패널별 독립 consume 상태 관리 방향으로 리팩토링 진행 중

### Brokers / Topics / Consumers

- Brokers 화면
  - broker count
  - active controller
  - online partitions
  - ISR/OOS replica 정보
  - broker table
- Topics 화면
  - 전체 토픽 테이블
  - partitions, RF, messages, favorite 표시
- Consumers 화면
  - consumer group 목록
  - group 상세
  - lag, current offset, end offset
  - consumer group 선택 삭제 기능

### Consume

- Offset 조회
- Time 조회
- Live 실시간 조회
- Newest / Oldest 조회 방향
- offset/time 대량 조회
- 10,000건 초과 시 페이징 기반 조회 구조
- Live pause/stop
- Live auto scroll
- max retained messages
- 패널별 viewer open/close
- 메시지 grid 정렬/필터
- 메시지 필터 고도화
  - 단순 텍스트
  - key/value/header 범위
  - 정규식
  - JSON path 조건
  - exists 조건
  - hide/highlight 모드
- JSON Raw/Tree viewer
- JSON 검색
- JSON/value 복사
- 선택 메시지를 Produce로 복사
- headers 표시 및 produce 복사 지원

### Produce

- key/value/header 입력
- Consume 메시지 기반 produce draft 생성
- 복사한 payload 수정 후 재발행
- headers 수정 지원

### Export

- JSON 다운로드
- CSV 다운로드
- LOG 다운로드
- 사용자 LOG 포맷 설정
- 현재 페이지 다운로드
- 대량 offset 범위 전체 다운로드

### Avro / Schema

- Schema Registry URL 서버별 등록
- Confluent wire format Avro 디코딩
- serverId + schemaId 기준 캐시
- 동일 schemaId 동시 요청 중복 방지
- 수동 Avro schema 등록
- 토픽 우클릭 schema 등록
- 토픽 toolbar schema 버튼
- schema 파일 업로드
- schema editor drag & drop
- 등록된 schema 목록 확인
- decode 성공/실패 badge 표시

### 글로벌 검색 / 단축키

- Ctrl+P / Ctrl+K 글로벌 검색
- 서버, 토픽, 열린 탭, Avro schema, consumer group, quick action 검색
- 서버 범위 검색
- 연결되지 않은 서버 결과 표시
- 검색 결과 키보드 이동
- Ctrl+, 환경설정
- Ctrl+B 사이드바 토글
- JSON viewer 패널 토글

### UI/UX

- VSCode 계열 다크 UI 방향으로 개선 중
- 서버/토픽/모드 탭 스타일 정리
- 패널별 toast 표시 방향으로 개선 중
- 설정 화면을 VSCode settings 형태로 구성
- 좌/우 패널 resize
- 좌측 sidebar resize
- 프로그램 창 크기/패널 크기 저장
- 앱 아이콘 적용

## 프로젝트 루트 구조

```text
kafka-tool/
├─ build/                    앱 아이콘 및 빌드 리소스
├─ dist/                     빌드 결과물
├─ out/                      electron-builder 패키징 결과물
├─ scripts/                  실행 보조 스크립트
├─ src/
│  ├─ main/                  Electron main process
│  ├─ preload/               Electron preload bridge
│  ├─ renderer/              React renderer
│  └─ shared/                main/preload/renderer 공통 타입
├─ index.html
├─ package.json
├─ tsconfig.json
├─ tsconfig.electron.json
├─ vite.config.ts
└─ README.md
```

## src/main

Electron main process 영역입니다. KafkaJS 연결, IPC 핸들러, 설정 파일 저장, 파일 import/export, 자동 업데이트, native dialog 등을 담당합니다.

```text
src/main/
├─ main.ts            Electron app entry, IPC, Kafka admin/consumer/producer orchestration
├─ messageMapper.ts   KafkaJS message를 renderer에서 쓰는 메시지 모델로 변환
└─ avroDecoder.ts     Schema Registry / manual schema 기반 Avro decode
```

주요 책임:

- Kafka client/admin/consumer/producer 생성
- topic list, topic detail, broker info, consumer group info 조회
- offset/time/live consume 처리
- active consumer stop/disconnect
- consumer group delete
- topic delete/purge
- produce
- settings import/export
- message export
- app window bounds 저장
- 업데이트 확인/다운로드

## src/preload

Renderer에서 main process 기능을 안전하게 호출할 수 있게 API bridge를 노출합니다.

```text
src/preload/
└─ preload.ts
```

주요 책임:

- `window.kafka` API 제공
- IPC invoke/on wrapper 제공
- renderer가 Node/Electron API에 직접 접근하지 않도록 분리

## src/shared

공통 타입 정의 영역입니다.

```text
src/shared/
└─ types.ts
```

주요 타입:

- `ServerProfile`
- `TopicSummary`
- `TopicDetail`
- `KafkaMessage`
- `ConsumerGroupSummary`
- `ConsumerGroupDetail`
- `AppPreferences`
- Avro/schema 관련 타입
- import/export/settings 관련 타입

## src/renderer

React UI 영역입니다. 현재 리팩토링이 가장 활발하게 진행 중인 영역입니다.

```text
src/renderer/
├─ components/        화면 컴포넌트
├─ hooks/             UI/업무 로직 hook
├─ stores/            Zustand store
├─ main.tsx           React entry 및 아직 남아있는 orchestration
├─ styles.css         전역 스타일
├─ uiTypes.ts         renderer UI 타입
├─ utils.tsx          UI 유틸
├─ quickSearch.ts     글로벌 검색 모델/검색 로직
├─ messageFilters.ts  consume 메시지 필터 파서/매칭 로직
├─ manualAvroSchema.ts
├─ topicSearch.ts
├─ workspaceState.ts
├─ workspaceMessages.ts
├─ consumeConfig.ts
└─ serverProfileForm.ts
```

## renderer/components

UI 컴포넌트 영역입니다.

```text
src/renderer/components/
├─ DataGrid.tsx
├─ QuickSearchPalette.tsx
├─ ServerConnectionIndicator.tsx
├─ ui.tsx
├─ modals/
└─ workspace/
```

### components/modals

```text
modals/
├─ ConnectionErrorDialog.tsx
├─ ManualAvroSchemaDialog.tsx
├─ PreferencesDialog.tsx
├─ ServerProfileDialog.tsx
└─ TopicActionDialog.tsx
```

주요 책임:

- 서버 등록/수정
- 연결 오류 표시
- 환경설정
- Avro schema 등록
- topic delete/purge 확인

### components/workspace

메인 작업 화면입니다.

```text
workspace/
├─ WorkspaceLayout.tsx
├─ WorkspaceTopbar.tsx
├─ WorkspacePaneContent.tsx
├─ WorkspaceOverlays.tsx
├─ WorkspaceContextMenus.tsx
├─ consume/
├─ feedback/
├─ groups/
├─ primary/
├─ produce/
├─ sidebar/
├─ split/
├─ tabs/
└─ topics/
```

주요 책임:

- 전체 레이아웃
- 상단 클러스터 탭
- 좌측 사이드바
- primary/split pane
- topic tab
- consume/produce/info
- brokers/topics/consumers 페이지
- toast/feedback 표시

## renderer/hooks

기능 로직을 컴포넌트에서 분리하기 위해 도입한 hook 영역입니다. 현재는 `hooks/` 아래에 많이 모여 있으며, 향후 도메인별 폴더로 더 나눌 수 있습니다.

주요 hook 그룹:

- 서버/클러스터
  - `useServerBootstrap`
  - `useServerClusterState`
  - `useServerLifecycleActions`
  - `useServerHealthMonitor`
  - `useServerViewNavigation`
  - `useServerSearchState`
- 토픽
  - `useTopicResourceActions`
  - `useTopicMutationActions`
  - `useTopicFavorites`
  - `useTopicDetailCache`
  - `useTopicSearchState`
  - `useTopicViewActions`
- Consume/Produce
  - `useConsumeStateStore`
  - `useConsumeActions`
  - `useKafkaConsumeEvents`
  - `useSelectedConsumeActions`
  - `useProduceActions`
  - `useProduceDraftStore`
  - `useMessageExportActions`
- Split/Pane
  - `useWorkspacePaneState`
  - `useWorkspacePaneModels`
  - `usePrimaryPaneCallbacks`
  - `useSplitPaneCallbacks`
  - `useSplitPaneActions`
  - `useSplitPaneViewActions`
  - `useSplitTopicActivation`
  - `useLiveConsumeRouting`
- UI/검색/설정
  - `useQuickSearchState`
  - `useQuickSearchActions`
  - `useAppKeyboardShortcuts`
  - `useFeedbackState`
  - `usePaneToastRouting`
  - `usePersistedPreferences`
  - `useLayoutPreferences`
  - `usePreferenceNavigation`
- Avro
  - `useManualAvroSchemaActions`
  - `useManualAvroSchemaForm`
  - `useManualAvroSchemaSummary`

## renderer/stores

Zustand store 영역입니다. `main.tsx`의 상태 집중과 prop drilling을 줄이기 위해 도입했습니다.

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

현재 store 역할:

- `serverClusterStore`: 서버 목록, 선택 서버, 클러스터 탭 등 도메인 상태
- `feedbackStore`: toast/feedback 상태
- `layoutStore`: sidebar, viewer, split 크기 등 레이아웃 상태
- `workspacePaneStore`: primary/split pane 상태
- `searchStore`: 글로벌 검색/검색 UI 상태
- `preferencesStore`: 환경설정 UI 상태
- `manualAvroSchemaStore`: 수동 Avro schema UI 상태
- `serverFormStore`: 서버 등록/수정 폼 상태
- `sidebarInteractionStore`: context menu, drag/drop 등 sidebar interaction 상태

## 리팩토링 진행 상태

완료된 방향:

- main process에서 Avro decoder/message mapper 분리
- renderer 컴포넌트 폴더 분리
- workspace 영역을 sidebar/primary/split/tabs/topics/consume/produce/groups로 분리
- consume toolbar/viewer/filter를 컴포넌트로 분리
- consumer group actions hook 분리
- primary/split pane callback hook 분리
- keyboard shortcut hook 분리
- 일부 UI 상태를 Zustand store로 이전
- DataGrid 공통화

아직 남은 핵심 문제:

- `src/renderer/main.tsx`가 여전히 많은 hook과 props를 연결하는 중앙 orchestration 역할을 하고 있음
- primary/split pane 상태 모델이 아직 완전히 독립된 문서/상태 구조로 정리되지 않음
- 같은 topic을 좌/우 패널에 동시에 열었을 때 상태 격리 규칙을 더 명확히 해야 함
- toast가 패널 단위로만 동작하도록 최종 정리 필요
- hook이 `hooks/` 루트에 많이 몰려 있어 도메인별 하위 폴더 정리가 필요할 수 있음
- Zustand store로 옮긴 상태와 기존 hook 상태가 혼재되어 있음

## 앞으로의 리팩토링 방향

우선순위는 다음 순서가 적절합니다.

1. Pane 모델 정리
   - primary/split을 단순 문자열 분기가 아니라 독립 pane document 모델로 정리
   - paneId 기준으로 topic tab, active tab, active view, consume state, viewer state 분리

2. main.tsx 축소
   - main.tsx는 layout shell만 남기기
   - 각 container/component가 필요한 store/hook만 직접 구독
   - props drilling 제거

3. Zustand store 도메인 정리
   - server/cluster
   - topic
   - consume
   - produce
   - layout
   - feedback
   - search
   - preferences

4. hooks 폴더 도메인 분리
   - `hooks/server`
   - `hooks/topic`
   - `hooks/consume`
   - `hooks/produce`
   - `hooks/workspace`
   - `hooks/search`
   - `hooks/preferences`

5. 패널 독립성 검증
   - 같은 토픽을 좌/우에 열어도 consume/live/viewer/filter 상태가 독립
   - 패널 이동 시 live 상태 유지
   - 패널 합치기/승격 시 중복 탭 처리 규칙 명확화
   - close/move/split 시 consumer cleanup 누락 방지

6. 성능 개선
   - streaming message update가 전체 app re-render를 유발하지 않게 store selector 정리
   - 대량 메시지는 pane/topic 단위로만 갱신
   - DataGrid virtual scroll 적용 범위 확대 검토

## 실행 및 빌드

개발 실행:

```bash
npm run dev
```

빌드:

```bash
npm run build
```

패키징:

```bash
npm run package:win
```

배포:

```bash
npm run release:win
```

## 운영/배포 메모

- GitHub Releases 기반 업데이트를 사용합니다.
- release 배포 시 `package.json`의 version을 올려야 업데이트로 인식됩니다.
- Windows 배포는 `out/Kafka-Tool-Setup-{version}.exe` 설치 파일을 기준으로 합니다.
- 사용자 설정은 Electron userData 경로에 저장됩니다.
- 서버 secret 정보가 설정 파일에 저장될 수 있으므로 export 파일 공유에 주의해야 합니다.

## 주의할 점

- Kafka consumer는 stop/disconnect가 누락되면 consumer group이 계속 남을 수 있습니다.
- Live consume은 탭/pane 이동, 닫기, 앱 종료 시 cleanup이 확실해야 합니다.
- 같은 topic을 좌/우 패널에 열 수 있으므로 상태 key는 topic 이름만으로 잡으면 충돌할 수 있습니다.
- Avro schema cache는 serverId + schemaId 기준이어야 멀티 클러스터에서 꼬이지 않습니다.
- 한글 문서와 UI 텍스트는 UTF-8로 유지해야 합니다.
