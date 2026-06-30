# Kafka Tool

[English](README.md) | [한국어](README.ko.md)

Kafka Tool은 Apache Kafka를 위한 가벼운 Electron 데스크톱 클라이언트입니다.

여러 Kafka 클러스터를 등록하고, Broker/Topic/Consumer Group을 조회하며, 메시지 Consume/Produce, Payload 확인, Topic 설정 관리, 좌표 데이터 시각화, 데이터 Export를 한 곳에서 처리할 수 있도록 만든 도구입니다.

## 버전

현재 릴리즈: `2.0.6`

## 2.0.6 패치 노트

- Consume 그리드와 CSV Export에 `Value Columns` 기능을 추가했습니다.
- 좌표 메시지를 지도에서 볼 수 있는 Map Viewer를 추가하고, 토픽별 필드 매핑, 좌표계 변환, 차량 heading, trail, 선택 차량 follow 모드를 지원합니다.
- Consumer Group Offset Reset을 추가하고, 미리보기, Partition 선택, 활성 Group 보호를 지원합니다.
- 대상 서버/토픽 선택, Payload 편집, Dynamic Field 치환을 지원하는 Message Replay를 추가했습니다.
- 선택 메시지, 필터 결과, 조회된 전체 메시지를 대상으로 하는 Batch Replay를 추가했습니다.
- 진행률, 원본/대상 서버 표시, Delay, 전송 중단을 지원하는 Background Replay Jobs를 추가했습니다.
- 대량 Consume 탭 전환과 Map Viewer 차량 이동 부드러움을 개선했습니다.

## 문서

- [변경 이력](CHANGELOG.md)
- [릴리즈 가이드](docs/release.md)
- [macOS 사내 설치](docs/macos-install.md)
- [Consume 필터](docs/consume-filters.md)
- [Avro](docs/avro.md)
- [프로젝트 구조](PROJECT_STRUCTURE.md)

## 주요 기능

- [x] 여러 Kafka 클러스터 서버 프로필 관리
- [x] 저장 전 서버 프로필 검증 및 Kafka 연결 테스트
- [x] `Broker`, `Topic`, `Consumer Group` 조회
- [x] 미리보기와 Partition 선택을 지원하는 Consumer Group Offset Reset
- [x] Topic 상세 정보, Settings 조회/수정, 생성, 메시지 비우기, 삭제
- [x] `Offset`, `Time`, `Live` Consume 모드
- [x] Key/Value Payload를 `Text`, `JSON`, `Hex`, `Base64`로 표시
- [x] Consume 그리드와 CSV Export용 `Value Columns`
- [x] `Raw`, `Tree`, `Preview` 모드 Message Viewer
- [x] Consume 결과를 원하는 대상 서버/토픽으로 다시 보내는 Message Replay
- [x] 토픽별 좌표 필드 매핑과 WGS84/TM/UTM 변환을 지원하는 Map Viewer
- [x] Live 메시지를 `JSONL` 파일로 기록
- [x] Key, Headers, Value 기반 메시지 Produce, 템플릿, Interval Produce
- [x] 반복 테스트 데이터를 위한 Produce 동적 필드
- [x] Schema Registry 또는 수동 Topic Schema 기반 Avro Decode
- [x] 좌/우 Split Pane을 통한 Topic 동시 작업
- [x] `Ctrl+P` / `Ctrl+K` 빠른 검색
- [x] 앱 내부 단축키 편집
- [x] 업데이트 후 Release Notes 안내
- [x] 대량 결과를 위한 Virtualized Grid
- [x] 한국어/영어 UI 지원
- [x] `Inter`, `Noto Sans KR` 로컬 폰트 지원
- [x] GitHub Releases 기반 패키지 자동 업데이트

## 서버 프로필

서버 프로필에는 Broker 주소, 선택적 SSL/TLS, 선택적 SASL/OAUTHBEARER, 선택적 Schema Registry 설정이 포함됩니다.

서버 추가/수정 팝업의 `Test` 버튼으로 저장 전에 Kafka Admin 연결을 확인할 수 있습니다. 이 테스트는 현재 입력한 값을 사용하며, 프로필을 저장하지 않고 성공/실패 결과를 팝업 내부에 표시합니다.

## Consume

Consume은 세 가지 모드를 지원합니다.

- `Offset`: 특정 Offset부터 메시지 조회
- `Time`: Timestamp 범위로 메시지 조회
- `Live`: 새 메시지를 실시간 스트리밍

`Live` 모드는 현재 세션 시작 시점의 최신 Topic Offset 이후 메시지를 읽습니다. 이전 Consumer Group Offset 때문에 오래된 메시지가 UI나 Record 파일에 한꺼번에 들어오는 것을 방지합니다.

Offset 조회에서 `Limit`이 `10,000`보다 크면 자동으로 페이지 조회를 사용합니다. 현재 페이지 Export와 전체 Offset 범위 Export를 모두 지원합니다.

Key와 Value는 `Text`, `JSON`, `Hex`, `Base64` 형식으로 조회하고 Export할 수 있습니다. Kafka Tool은 대량 Consume 중 메모리 사용량을 보호하기 위해 메시지별 Raw Payload Bytes를 일정 크기까지만 보관합니다. 큰 Payload는 KafkaJS가 디코딩한 Text 값으로는 볼 수 있지만, Hex/Base64처럼 Raw Bytes가 필요한 화면에서는 보관 제한 안내가 표시됩니다.

`Value Columns`를 사용하면 `vehicleId`, `latitude`, `longitude`, `speed` 같은 Value 내부 key나 깊은 중첩 path를 그리드 컬럼으로 바로 표시할 수 있습니다. 선택 팝업은 중첩 필드를 Tree 형태로 보여주며, Message Viewer의 Tree에서 leaf 값을 바로 Value Columns에 추가할 수도 있습니다. 선택한 Value Columns는 토픽별로 저장됩니다. CSV Export에는 기본 메시지 컬럼 뒤에 선택한 Value Columns가 함께 포함되며, JSON/LOG Export 형식은 기존 구조를 유지합니다.

Message Viewer 툴바의 Message Replay로 Consume 메시지를 원하는 대상 서버와 토픽으로 다시 전송할 수 있습니다. Replay 팝업은 원본 Cluster/Topic/Partition/Offset을 보여주고, 대상 서버/토픽 선택과 Key, Headers, Value 포함 여부를 지원합니다. 단건, 선택 메시지, 필터 결과, 조회된 전체 메시지를 Replay 대상으로 선택할 수 있습니다. 단건 Replay는 Payload 직접 편집을 지원하고, Batch Replay는 `${uuid}`, `${seq:1..100}`, `${date:yyyy-MM-dd HH:mm:ss}` 같은 Produce Dynamic Field로 Value 필드 치환을 지원합니다. 대량 Replay 작업은 Background Replay Jobs에서 진행률, Delay, 전송 중단을 제어할 수 있습니다.

Live Record는 메시지를 `JSONL` 파일 스트림으로 바로 기록합니다. 장시간 수집 중 전체 데이터를 Renderer 메모리에 계속 쌓지 않도록 설계했습니다.

## Consumer Groups

Consumer Group 상세 화면에서는 Topic Partition별 committed offset, beginning/end offset, lag를 확인할 수 있습니다.

Consumer Group 상세 화면의 `Reset Offsets`에서 선택한 Partition을 다음 위치로 리셋할 수 있습니다.

- `Earliest`
- `Latest`
- `Timestamp`
- `Specific offset`

Kafka Tool은 Consumer Group이 활성 상태일 때 reset 실행을 막고, 미리보기 단계와 명시적인 `RESET` 확인 입력을 요구합니다. 진행 상태와 오류는 팝업 내부에 표시됩니다.

## Map Viewer

좌표 필드가 포함된 메시지는 Consume 메시지 툴바에서 Map Viewer로 보낼 수 있습니다. Map Viewer는 별도 창으로 열리며 다음 기능을 지원합니다.

- 커스텀 JSON path를 지정하는 토픽별 Map Field Mapping
- WGS84 degree, WGS84 millisecond, Korea TM, UTM Zone 52N 좌표 변환
- heading을 반영해 회전하는 차량 마커
- 최근 이동 경로 trail
- 선택 차량 follow, auto-fit, free-move 모드
- Topic, 속도, heading, 좌표를 확인할 수 있는 차량 리스트
- `km/h` 또는 `m/s` 속도 필드 처리

Map Viewer는 스마트시티, BIS, C-ITS, 자율주행 Kafka Topic처럼 실시간 좌표 스트림을 확인해야 하는 개발 워크플로우를 위해 설계했습니다.

## Produce

Produce는 단일 메시지 발행과 Interval Produce를 지원합니다.

Interval Produce는 `Count` 또는 `Duration` 제한 중 하나가 필요합니다. 무제한 발행 모드는 제공하지 않습니다. 시작 전에 Topic, Every, 종료 조건, 예상 최대 발행 건수를 확인합니다.

동적 필드는 `Key`, `Headers`, `Value` 모두에서 사용할 수 있습니다.

| 문법 | 설명 |
| --- | --- |
| `${seq}` | 1부터 증가하는 시퀀스 |
| `${seq:1..10}` | 지정 범위 안에서 순환하는 시퀀스 |
| `VMS${seq:1..100\|pad=7}` | `VMS0000001` 같은 패딩 ID |
| `${random:1..100}` | 범위 안의 랜덤 정수 |
| `${float:0..1\|fixed=2}` | 소수점 자릿수를 제한한 랜덤 실수 |
| `${choice:READY\|RUNNING\|ERROR}` | 목록 중 하나를 랜덤 선택 |
| `${timestamp}` | 현재 Epoch Milliseconds |
| `${timestamp:s}` | 현재 Epoch Seconds |
| `${date:yyyy-MM-dd HH:mm:ss}` | 포맷된 현재 지역 날짜/시간 |
| `${now}` | 현재 ISO 날짜/시간 |
| `${uuid}` | 랜덤 UUID |
| `\${uuid}` | 치환하지 않는 Literal Token |

Produce Preview에서는 발행 전 렌더링된 Key, Headers, Value를 확인할 수 있습니다. 잘못된 동적 필드 문법은 Preview에 표시되고 Interval Produce 시작을 막습니다.

토픽별 Produce 템플릿은 Preferences에 저장되며 설정 내보내기/가져오기에 포함됩니다.

## 단축키

기본 단축키:

- `Ctrl/Cmd+P` 또는 `Ctrl/Cmd+K`: Quick Search 열기
- `Ctrl/Cmd+Right`: 현재 Topic을 오른쪽 Pane으로 보내기
- `Ctrl/Cmd+Left`: 오른쪽 Pane의 현재 Topic을 왼쪽 Pane으로 보내기
- `Ctrl/Cmd+1`: 왼쪽 Pane 활성화
- `Ctrl/Cmd+2`: 오른쪽 Pane 활성화
- `Ctrl/Cmd+W`: 현재 Topic 탭 닫기
- `Ctrl/Cmd+Shift+W`: Split Pane 닫기

단축키는 `Preferences > Editor > Shortcuts`에서 편집할 수 있습니다.

## 보안

> [!WARNING]
> Client Secret, Schema Registry 인증 정보, Bearer Token은 로컬 설정 파일에 저장됩니다. Export한 설정 파일은 주의해서 관리하세요.

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

## 라이선스

이 프로젝트는 MIT License로 배포합니다. 자세한 내용은 [LICENSE](LICENSE)를 확인하세요.

## 저작권

Copyright (c) 2026 PJHUN.
