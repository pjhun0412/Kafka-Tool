# Kafka Tool

[English](README.md) | [한국어](README.ko.md)

Kafka Tool은 Apache Kafka를 위한 가벼운 Electron 데스크톱 클라이언트입니다.

여러 Kafka 클러스터를 등록하고, Broker/Topic/Consumer Group을 조회하며, 메시지 Consume/Produce, payload 확인, Topic 설정 관리, 데이터 Export를 한 곳에서 처리할 수 있게 만든 도구입니다.

## 버전

현재 릴리즈: `2.0.2`

## 2.0.2 패치 노트

- 환경설정에서 앱 내부 키보드 단축키를 편집할 수 있습니다.
- 앱 버전이 바뀌면 주요 변경사항을 What’s New 모달로 한 번 안내합니다.
- Help 메뉴에서 Release Notes를 다시 열 수 있습니다.
- macOS는 Cmd, Windows/Linux는 Ctrl 기반으로 단축키가 자연스럽게 동작하도록 개선했습니다.
- Shortcuts, Split tabs 도움말을 한국어/영어 모두 최신 기능 기준으로 보강했습니다.

## 문서

- [변경 이력](CHANGELOG.md)
- [릴리즈 가이드](docs/release.md)
- [macOS 사내 설치](docs/macos-install.md)
- [Consume 필터](docs/consume-filters.md)
- [Avro](docs/avro.md)
- [프로젝트 구조](PROJECT_STRUCTURE.md)

## 주요 기능

- [x] 여러 Kafka 클러스터 서버 프로필 관리
- [x] `Broker`, `Topic`, `Consumer Group` 조회
- [x] Topic 상세 정보, Settings 조회/수정, 생성, 메시지 비우기, 삭제
- [x] `Offset`, `Time`, `Live` Consume 모드
- [x] Key/Value payload를 `Text`, `JSON`, `Hex`, `Base64`로 표시
- [x] `Raw`, `Tree`, `Preview` 모드를 지원하는 Message Viewer
- [x] Live 메시지를 `JSONL` 파일로 기록
- [x] key, headers, value 기반 메시지 Produce
- [x] Schema Registry 또는 수동 Topic Schema 기반 Avro decode
- [x] 좌우 split pane을 통한 Topic 동시 작업
- [x] `Ctrl+P` / `Ctrl+K` 빠른 검색
- [x] 앱 내부 키보드 단축키 편집
- [x] 업데이트 후 What’s New / Release Notes 안내
- [x] 대량 결과를 위한 virtualized grid
- [x] 한국어/영어 UI 언어 지원
- [x] `Inter`, `Noto Sans KR` 로컬 폰트 지원
- [x] GitHub Releases 기반 패키지 자동 업데이트

## Consume

Consume은 세 가지 모드를 지원합니다.

- `Offset`: 특정 offset부터 메시지 조회
- `Time`: timestamp 범위로 메시지 조회
- `Live`: 새 메시지를 실시간 스트리밍

`Live` 모드는 현재 세션 시작 시점의 최신 Topic offset 이후 메시지를 읽습니다. 이전 consumer group offset 때문에 오래된 메시지가 UI나 Record 파일에 한꺼번에 들어오는 것을 방지합니다.

Offset 조회에서 `Limit`이 `10,000`보다 크면 자동으로 페이지 조회를 사용합니다. 현재 페이지 Export와 전체 offset 범위 Export를 모두 지원합니다.

Key와 Value는 `Text`, `JSON`, `Hex`, `Base64` 형식으로 조회하고 Export할 수 있습니다. Kafka Tool은 대량 Consume 중 메모리 사용량을 보호하기 위해 메시지별 raw payload bytes를 일정 크기까지만 보관합니다. 큰 payload도 KafkaJS가 디코딩한 text 값으로는 볼 수 있지만, hex/base64처럼 raw bytes가 필요한 화면에서는 보관 제한 안내가 표시됩니다.

Live Record는 메시지를 `JSONL` 파일 스트림으로 바로 기록합니다. 장시간 수집 시 전체 데이터를 renderer 메모리에 계속 쌓지 않도록 설계했습니다.

## 단축키

기본 단축키:

- `Ctrl/Cmd+P` 또는 `Ctrl/Cmd+K`: Quick Search 열기
- `Ctrl/Cmd+\`: 현재 Topic을 오른쪽 pane으로 분할
- `Ctrl/Cmd+1`: 왼쪽 pane 활성화
- `Ctrl/Cmd+2`: 오른쪽 pane 활성화
- `Ctrl/Cmd+Shift+W`: split pane 닫기

단축키는 `환경설정 > Editor > Shortcuts`에서 편집할 수 있습니다.

## 보안

> [!WARNING]
> Client secret, Schema Registry 인증 정보, bearer token은 로컬 설정 파일에 저장됩니다. Export한 설정 파일은 주의해서 관리하세요.

## 릴리즈

Windows 빌드는 Windows에서 배포할 수 있습니다. macOS 빌드는 macOS 장비에서 생성해야 합니다.

```bash
npm ci
npm run build
npm run release:win
```

macOS:

```bash
npm ci
npm run release:mac
```
