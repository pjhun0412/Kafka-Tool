# Kafka Tool

[English](README.md) | [한국어](README.ko.md)

Kafka Tool은 Apache Kafka를 위한 가벼운 Electron 데스크톱 클라이언트입니다.

여러 Kafka 클러스터를 등록하고, Broker/Topic/Consumer Group을 조회하며, 메시지 Consume/Produce, payload 확인, Topic 설정 관리, 데이터 Export를 한 곳에서 처리할 수 있도록 만든 도구입니다.

## 버전

현재 릴리즈: `2.0.3`

## 2.0.3 패치 노트

- Count 또는 Duration 제한을 둔 Interval Produce를 추가했습니다.
- Key, Headers, Value에서 `${seq}`, `${random}`, `${float}`, `${choice}`, `${timestamp}`, `${date}`, `${now}`, `${uuid}` 동적 필드를 사용할 수 있습니다.
- Produce Preview에서 실제 발행될 Key, Headers, Value 렌더링 결과를 확인할 수 있습니다.
- 토픽별 Produce 템플릿 저장, 불러오기, 업데이트, 삭제를 지원합니다.
- Interval Produce 시작 전 동적 필드와 Count/Duration 종료 조건을 검증합니다.
- 좌우 pane 사이에서 Topic을 이동하는 단축키를 추가했습니다.
- 활성화된 pane의 현재 Topic 탭을 닫는 단축키를 추가했습니다.
- Topic/Consumer 그리드 셀 정렬을 다듬었습니다.

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
- [x] Key, Headers, Value 기반 메시지 Produce, 템플릿, Interval Produce
- [x] 반복 테스트 데이터를 위한 Produce 동적 필드
- [x] Schema Registry 또는 수동 Topic Schema 기반 Avro decode
- [x] 좌우 split pane을 통한 Topic 동시 작업
- [x] `Ctrl+P` / `Ctrl+K` 빠른 검색
- [x] 앱 내부 키보드 단축키 편집
- [x] 업데이트 후 Release Notes 안내
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

Key와 Value는 `Text`, `JSON`, `Hex`, `Base64` 형식으로 조회하고 Export할 수 있습니다. Kafka Tool은 대량 Consume 중 메모리 사용량을 보호하기 위해 메시지별 raw payload bytes를 일정 크기까지만 보관합니다. 큰 payload는 KafkaJS가 디코딩한 text 값으로는 볼 수 있지만, hex/base64처럼 raw bytes가 필요한 화면에서는 보관 제한 안내가 표시됩니다.

Live Record는 메시지를 `JSONL` 파일 스트림으로 바로 기록합니다. 장시간 수집 때 전체 데이터를 renderer 메모리에 계속 쌓지 않도록 설계했습니다.

## Produce

Produce는 단일 메시지 발행과 Interval Produce를 지원합니다.

Interval Produce는 `Count` 또는 `Duration` 제한 중 하나가 필요합니다. 무제한 발행 모드는 제공하지 않습니다. 시작 전에는 Topic, Every, 종료 조건, 예상 최대 발행 건수를 확인합니다.

동적 필드는 `Key`, `Headers`, `Value` 모두에서 사용할 수 있습니다.

| 문법 | 설명 |
| --- | --- |
| `${seq}` | 1부터 증가하는 순번 |
| `${seq:1..10}` | 지정 범위 안에서 순환하는 순번 |
| `VMS${seq:1..100\|pad=7}` | `VMS0000001` 같은 패딩 ID |
| `${random:1..100}` | 범위 안의 랜덤 정수 |
| `${float:0..1\|fixed=2}` | 소수점 자릿수를 제한한 랜덤 실수 |
| `${choice:READY\|RUNNING\|ERROR}` | 목록 중 하나를 랜덤 선택 |
| `${timestamp}` | 현재 epoch milliseconds |
| `${timestamp:s}` | 현재 epoch seconds |
| `${date:yyyy-MM-dd HH:mm:ss}` | 포맷팅된 현재 지역 날짜/시간 |
| `${now}` | 현재 ISO 날짜/시간 |
| `${uuid}` | 랜덤 UUID |
| `\${uuid}` | 치환하지 않는 literal token |

Produce Preview에서는 발행 전 렌더링된 Key, Headers, Value를 확인할 수 있습니다. 잘못된 동적 필드 문법은 Preview에 표시되고 Interval Produce 시작도 막습니다.

토픽별 Produce 템플릿은 앱 preferences에 저장되며 설정 내보내기/가져오기에 포함됩니다.

## 단축키

기본 단축키:

- `Ctrl/Cmd+P` 또는 `Ctrl/Cmd+K`: Quick Search 열기
- `Ctrl/Cmd+→`: 현재 Topic을 오른쪽 pane으로 보내기
- `Ctrl/Cmd+←`: 오른쪽 pane의 현재 Topic을 왼쪽 pane으로 보내기
- `Ctrl/Cmd+1`: 왼쪽 pane 활성화
- `Ctrl/Cmd+2`: 오른쪽 pane 활성화
- `Ctrl/Cmd+W`: 현재 Topic 탭 닫기
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
