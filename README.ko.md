# Kafka Tool

[English](README.md) | [한국어](README.ko.md)

Kafka Tool은 Apache Kafka를 다루기 위한 가벼운 Electron 데스크톱 클라이언트입니다.

여러 Kafka 클러스터를 등록하고, Broker/Topic/Consumer Group을 조회하며, 메시지 Consume/Produce, payload 확인, Topic 설정 관리, 데이터 Export를 하나의 앱에서 처리할 수 있도록 만들었습니다.

## 버전

현재 릴리즈: `2.0.1`

## 2.0.1 패치 노트

- Consume 결과와 Export에 Key/Value payload 포맷 선택 기능을 추가했습니다.
- JSON 전용 Viewer를 `Raw`, `Tree`, `Preview`를 지원하는 Message Viewer로 교체했습니다.
- `Text`, `JSON`, `Hex`, `Base64` 보기와 Export를 지원하고, UTF-8/EUC-KR 디코딩을 선택할 수 있게 했습니다.
- 대량 Consume 시 메모리 압박을 줄이기 위해 메시지별 raw payload 보관 크기를 제한했습니다.
- 장시간 Live Record 중 파일 쓰기 속도보다 수신 속도가 빠를 때 메모리 버퍼가 커지지 않도록 파일 쓰기 backpressure를 적용했습니다.

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
- [x] Topic 상세 정보, 설정 조회/수정, 생성, 메시지 비우기, 삭제
- [x] `Offset`, `Time`, `Live` Consume 모드
- [x] Key/Value payload를 `Text`, `JSON`, `Hex`, `Base64`로 표시
- [x] Live 메시지를 `JSONL` 파일로 기록
- [x] key, headers, value 기반 메시지 Produce
- [x] Schema Registry 또는 수동 Topic Schema 기반 Avro decode
- [x] 좌우 분할 pane을 통한 Topic 동시 작업
- [x] `Ctrl+P` / `Ctrl+K` 빠른 검색
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

Key와 Value는 text, JSON, hex, base64 형식으로 조회하고 Export할 수 있습니다. Kafka Tool은 대량 Consume 중 메모리 사용량을 보호하기 위해 메시지별 raw payload bytes를 일정 크기까지만 보관합니다. 더 큰 payload는 KafkaJS가 디코딩한 text 값으로는 볼 수 있지만, hex/base64처럼 raw bytes가 필요한 화면에서는 보관 제한 안내가 표시됩니다.

Live Record는 메시지를 `JSONL` 파일 스트림으로 바로 기록합니다. 장시간 수집을 위한 기능이며, 수집된 전체 데이터를 renderer 메모리에 계속 들고 있지 않습니다.

메시지 필터는 일반 텍스트, field filter, regex, JSON path 비교식을 지원합니다. 자세한 예시는 [Consume 필터](docs/consume-filters.md)를 참고하세요.

```text
key:PR1001
value:OK
headers.traceId exists
!error
/timeout|failed/i
decoded.speed >= 50
```

## Produce

Produce 탭은 다음 기능을 지원합니다.

- Kafka key
- Headers
- Message value
- 수동 schema가 등록된 Topic의 Avro 직렬화
- Consume 메시지를 Produce draft로 보내 수정 후 재전송

## Topics

Topic 기능은 다음을 포함합니다.

- 검색, 정렬, 선택, 즐겨찾기가 가능한 Topic 목록
- partitions, replicas, ISR, offsets, message count가 포함된 Topic 정보
- Topic settings 조회 및 수정
- Topic 생성
- Clear messages
- Topic 삭제
- toolbar 또는 context menu를 통한 수동 Avro schema 등록

## Brokers And Consumers

Broker 화면은 클러스터와 broker 수준의 정보, broker 상세, config를 보여줍니다.

Consumer 화면은 consumer group, group state, member, lag, assigned topic, 접고 펼칠 수 있는 topic별 partition 상세를 보여줍니다.

## Avro

Kafka Tool은 두 가지 Avro 방식을 지원합니다.

- 서버별 Schema Registry URL 설정
- Topic별 수동 schema 등록

Confluent wire-format 메시지는 schema ID가 있으면 자동 decode할 수 있습니다. 수동 schema는 붙여넣기, 파일 업로드, drag & drop으로 등록할 수 있습니다.

자세한 내용은 [Avro](docs/avro.md)를 참고하세요.

## Preferences

환경설정은 다음을 포함합니다.

- UI 언어: 자동, 한국어, 영어
- Editor font 및 size
- 수동 Avro schemas
- Export log template

설정은 Electron user data 디렉터리에 로컬 저장됩니다.

Windows 기본 경로:

```text
C:\Users\{USER}\AppData\Roaming\kafka-tool
```

주요 파일:

```text
servers.json
preferences.json
```

## Authentication

Kafka Tool은 다음 연결 방식을 지원합니다.

- Plain Kafka connection
- SSL/TLS
- SASL/OAUTHBEARER

> [!WARNING]
> 서버 프로필은 사용자 PC에 저장됩니다. Client secret도 로컬 설정 파일에 저장될 수 있으므로, export한 설정 파일은 주의해서 다뤄야 합니다.

## Development

의존성 설치:

```bash
npm install
```

개발 앱 실행:

```bash
npm run dev
```

빌드:

```bash
npm run build
```

전체 타입 체크:

```bash
npm run typecheck
```

## Packaging

Windows installer 빌드:

```bash
npm run package:win
```

macOS package 빌드(macOS 장비 필요):

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run package:mac
```

생성 파일은 다음 경로에 기록됩니다.

```text
out/
```

Windows installer 출력:

```text
out/Kafka-Tool-Setup-{version}.exe
out/Kafka-Tool-Setup-{version}.exe.blockmap
out/latest.yml
```

설치는 `win-unpacked` 디렉터리가 아니라 `Kafka-Tool-Setup-{version}.exe`를 사용합니다.

unsigned macOS 사내 설치는 [macOS 사내 설치](docs/macos-install.md)를 참고하세요.

## Release

자동 업데이트는 `electron-updater`와 GitHub Releases를 사용합니다.

전체 릴리즈 흐름은 [릴리즈 가이드](docs/release.md)를 참고하세요.

Windows 릴리즈 publish:

```powershell
$env:GH_TOKEN="your_github_token"
npm run release:win
Remove-Item Env:GH_TOKEN
```

macOS 릴리즈 publish:

```bash
GH_TOKEN="your_github_token" CSC_IDENTITY_AUTO_DISCOVERY=false npm run release:mac
```

GitHub token에는 다음 권한이 필요합니다.

```text
Contents: Read and write
Metadata: Read
```

## Tech Stack

- Electron
- React
- TypeScript
- Vite
- KafkaJS
- Zustand
- Avro via `avsc`
- TanStack Table
- TanStack Virtual
- Tailwind CSS
- electron-builder
- electron-updater
