# Kafka Tool

Kafka Tool is a lightweight Electron desktop client for Apache Kafka.

It is built for developers and operators who need to register Kafka clusters, browse brokers/topics/consumer groups, consume and produce messages, inspect payloads, manage topic settings, and export data from one desktop app.

## Version

Current release: `2.0.0`

## Documentation

- [Changelog](CHANGELOG.md)
- [Release guide](docs/release.md)
- [macOS internal install](docs/macos-install.md)
- [Consume filters](docs/consume-filters.md)
- [Avro](docs/avro.md)

## Highlights

- Multi-cluster server profile management
- Broker, Topic, and Consumer Group browsing
- Topic detail, settings, creation, clear messages, and delete actions
- Offset, Time Range, and Live Consume modes
- Live message recording to JSONL files
- Produce messages with key, headers, and value
- Avro decoding with Schema Registry or manually registered topic schemas
- Split workspace panes for side-by-side Topic workflows
- Fast global search with `Ctrl+P` / `Ctrl+K`
- Virtualized grids for large result sets
- Korean/English UI language support
- Local font support with Inter and Noto Sans KR
- GitHub Releases based auto update for packaged builds

## Consume

Consume supports three modes:

- `Offset`: read from a specific offset
- `Time`: read messages by timestamp range
- `Live`: stream new messages in real time

Live mode starts from the latest topic offsets for the current session, so old committed group offsets do not flood the UI or Live Record output.

Large offset queries are paged automatically when the requested limit is greater than `10,000`. The current page can be exported, and the full captured offset range can also be exported.

Message filtering supports plain text, field filters, regex, and JSON path comparisons.
See [Consume filters](docs/consume-filters.md) for more examples.

```text
key:PR1001
value:OK
headers.traceId exists
!error
/timeout|failed/i
decoded.speed >= 50
```

## Produce

The Produce tab supports:

- Kafka key
- Headers
- Message value
- Avro serialization when a manual schema is registered
- Sending a consumed message payload back to Produce for editing and replay

## Topics

Topic workflows include:

- Topic list with search, sort, selection, and favorites
- Topic info with partitions, replicas, ISR, offsets, and message counts
- Topic settings view and editable config form
- Topic creation
- Clear messages
- Delete topics
- Manual Avro schema registration from the toolbar or context menu

## Brokers And Consumers

Broker pages show cluster and broker-level information, including broker details and configs.

Consumer pages show consumer groups, group state, members, lag, assigned topics, and collapsible topic-level partition details.

## Avro

Kafka Tool supports two Avro modes:

- Schema Registry URL configured per server
- Manual schema registered per topic

Confluent wire-format messages can be decoded automatically when schema IDs are available. Manual schemas can be pasted, uploaded, or drag-and-dropped into the schema editor.
See [Avro](docs/avro.md) for details.

## Preferences

Preferences include:

- UI language: Auto, Korean, English
- Editor font and size
- Manual Avro schemas
- Export log template

Settings are stored locally in Electron's user data directory.

On Windows this is usually:

```text
C:\Users\{USER}\AppData\Roaming\kafka-tool
```

Important files:

```text
servers.json
preferences.json
```

## Authentication

Kafka Tool supports:

- Plain Kafka connections
- SSL/TLS
- SASL/OAUTHBEARER

Server profiles are stored on the user's PC. Client secrets are saved in the local settings file, so exported settings files should be handled carefully.

## Development

Install dependencies:

```bash
npm install
```

Run the development app:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Full type-check:

```bash
npm run typecheck
```

## Packaging

Build a Windows installer locally:

```bash
npm run package:win
```

Build a macOS package on macOS:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run package:mac
```

Generated files are written to:

```text
out/
```

Windows installer output:

```text
out/Kafka-Tool-Setup-{version}.exe
out/Kafka-Tool-Setup-{version}.exe.blockmap
out/latest.yml
```

Install using `Kafka-Tool-Setup-{version}.exe`, not the `win-unpacked` directory.
See [macOS internal install](docs/macos-install.md) for unsigned internal macOS installs.

## Release

Auto update uses `electron-updater` and GitHub Releases.
See [Release guide](docs/release.md) for the full release flow.

Publish a Windows release:

```powershell
$env:GH_TOKEN="your_github_token"
npm run release:win
Remove-Item Env:GH_TOKEN
```

Publish a macOS release from macOS:

```bash
GH_TOKEN="your_github_token" CSC_IDENTITY_AUTO_DISCOVERY=false npm run release:mac
```

The GitHub token needs repository access for:

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
