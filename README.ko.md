# Kafka Tool

[English](README.md) | [한국어](README.ko.md)

Kafka Tool은 Apache Kafka를 다루기 위한 가벼운 Electron 데스크톱 클라이언트입니다.

Kafka 클러스터 등록, Broker/Topic/Consumer Group 조회, 메시지 Consume/Produce, payload 확인, Topic 설정 관리, 데이터 Export를 하나의 앱에서 처리할 수 있도록 만들었습니다.

## 버전

현재 릴리즈: `2.0.0`

## 문서

- [변경 이력](CHANGELOG.md)
- [릴리즈 가이드](docs/release.md)
- [macOS 사내 설치](docs/macos-install.md)
- [Consume 필터](docs/consume-filters.md)
- [Avro](docs/avro.md)

## 주요 기능

- [x] 여러 Kafka 서버 프로필 관리
- [x] `Broker`, `Topic`, `Consumer Group` 조회
- [x] Topic 상세 정보, 설정 수정, 생성, 메시지 비우기, 삭제
- [x] `Offset`, `Time`, `Live` Consume 모드
- [x] Live 메시지 `JSONL` 파일 저장
- [x] key, headers, value 기반 메시지 Produce
- [x] Schema Registry 또는 수동 Topic Schema 기반 Avro 디코딩
- [x] 좌우 분할 패널을 통한 Topic 동시 작업
- [x] `Ctrl+P` / `Ctrl+K` 빠른 검색
- [x] 대량 데이터용 가상화 그리드
- [x] 한국어/영어 UI 언어 지원
- [x] `Inter`, `Noto Sans KR` 로컬 폰트 지원
- [x] GitHub Releases 기반 패키지 업데이트 지원

## Consume

Consume은 세 가지 모드를 지원합니다.

- `Offset`: 특정 offset부터 메시지 조회
- `Time`: timestamp 범위로 메시지 조회
- `Live`: 새 메시지를 실시간 스트리밍

`Live` 모드는 현재 세션 시작 시점의 최신 Topic offset 이후부터 메시지를 읽습니다. 이전 consumer group offset 때문에 오래된 메시지가 UI나 Record 파일에 쌓이는 것을 방지합니다.

Offset 조회에서 `Limit`이 `10,000`보다 크면 자동으로 페이지 조회를 사용합니다. 현재 페이지 Export와 전체 offset 범위 Export를 지원합니다.

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

Produce 탭은 다음을 지원합니다.

- Kafka key
- Headers
- Message value
- 수동 schema가 등록된 Topic의 Avro 직렬화
- Consume한 메시지를 Produce 탭으로 보내 수정 후 재전송

## Topics

Topic 작업은 다음을 포함합니다.

- 검색, 정렬, 선택, 즐겨찾기가 가능한 Topic 목록
- partition, replica, ISR, offset, message count를 포함한 Topic 정보
- Topic Settings 조회와 수정 가능한 config 편집
- Topic 생성
- 메시지 비우기
- Topic 삭제
- toolbar 또는 context menu에서 수동 Avro schema 등록

## Brokers And Consumers

Broker 화면에서는 cluster 및 broker 단위 정보와 config를 확인할 수 있습니다.

Consumer 화면에서는 consumer group, group state, member, lag, assigned topic, 접고 펼칠 수 있는 topic별 partition 상세를 확인할 수 있습니다.

## Avro

Kafka Tool은 두 가지 Avro 방식을 지원합니다.

- 서버별 Schema Registry URL
- Topic별 수동 schema 등록

Confluent wire-format 메시지는 schema ID가 있으면 자동으로 디코딩할 수 있습니다. 수동 schema는 직접 붙여넣기, 파일 업로드, drag and drop으로 등록할 수 있습니다. 자세한 내용은 [Avro](docs/avro.md)를 참고하세요.

## Preferences

Preferences에서 다음을 설정할 수 있습니다.

- UI 언어: Auto, Korean, English
- Editor font와 size
- 수동 Avro schemas
- Export log template

설정은 Electron user data directory에 로컬로 저장됩니다.

Windows 기본 위치는 보통 다음과 같습니다.

```text
C:\Users\{USER}\AppData\Roaming\kafka-tool
```

중요 파일:

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
> 서버 프로필은 사용자 PC에 저장됩니다. Client secret도 로컬 설정 파일에 저장되므로, export한 설정 파일은 주의해서 다뤄야 합니다.

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

전체 type-check:

```bash
npm run typecheck
```

## Packaging

Windows installer 빌드:

```bash
npm run package:win
```

macOS package 빌드:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run package:mac
```

생성 파일은 다음 폴더에 기록됩니다.

```text
out/
```

Windows installer 출력:

```text
out/Kafka-Tool-Setup-{version}.exe
out/Kafka-Tool-Setup-{version}.exe.blockmap
out/latest.yml
```

설치할 때는 `win-unpacked` 폴더가 아니라 `Kafka-Tool-Setup-{version}.exe`를 사용하세요. unsigned macOS 사내 설치는 [macOS 사내 설치](docs/macos-install.md)를 참고하세요.

## Release

Auto update는 `electron-updater`와 GitHub Releases를 사용합니다. 전체 릴리즈 흐름은 [릴리즈 가이드](docs/release.md)를 참고하세요.

Windows 릴리즈:

```powershell
$env:GH_TOKEN="your_github_token"
npm run release:win
Remove-Item Env:GH_TOKEN
```

macOS 릴리즈:

```bash
GH_TOKEN="your_github_token" CSC_IDENTITY_AUTO_DISCOVERY=false npm run release:mac
```

GitHub token 권한:

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
