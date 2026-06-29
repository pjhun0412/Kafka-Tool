# Kafka Tool

[English](README.md) | [한국어](README.ko.md)

Kafka Tool is a lightweight Electron desktop client for Apache Kafka.

It is built for developers and operators who need to register Kafka clusters, browse brokers/topics/consumer groups, consume and produce messages, inspect payloads, manage topic settings, visualize coordinate streams, and export data from one desktop app.

## Version

Current release: `2.0.5`

## 2.0.5 Patch Notes

- Added `Value Columns` for Consume grids and CSV export.
- Added Map Viewer for coordinate messages with per-topic field mapping, projection conversion, vehicle heading, trails, and selected-vehicle follow mode.
- Added Consumer Group Offset Reset with preview, partition selection, and active-group protection.
- Added Message Replay with target server/topic selection, payload editing, and Dynamic Field rendering.
- Improved large Consume tab switching and Map Viewer movement smoothing.

## Documentation

- [Changelog](CHANGELOG.md)
- [Release guide](docs/release.md)
- [macOS internal install](docs/macos-install.md)
- [Consume filters](docs/consume-filters.md)
- [Avro](docs/avro.md)
- [Project structure](PROJECT_STRUCTURE.md)

## Highlights

- [x] Multi-cluster server profile management
- [x] Server profile validation and Kafka connection testing before saving
- [x] `Broker`, `Topic`, and `Consumer Group` browsing
- [x] Consumer Group Offset Reset with dry-run preview and partition selection
- [x] Topic detail, settings, creation, clear messages, and delete actions
- [x] `Offset`, `Time`, and `Live` Consume modes
- [x] Key/Value payload display as `Text`, `JSON`, `Hex`, or `Base64`
- [x] `Value Columns` for selected `value.*` fields in the Consume grid and CSV export
- [x] Message Viewer with `Raw`, `Tree`, and `Preview` modes
- [x] Message Replay from Consume results to any connected target server/topic
- [x] Map Viewer with per-topic coordinate field mapping and WGS84/TM/UTM conversion
- [x] Live message recording to `JSONL` files
- [x] Produce messages with key, headers, value, templates, and Interval Produce
- [x] Dynamic Produce fields for repeated test data
- [x] Avro decoding with Schema Registry or manually registered topic schemas
- [x] Split workspace panes for side-by-side Topic workflows
- [x] Fast global search with `Ctrl+P` / `Ctrl+K`
- [x] Editable in-app keyboard shortcuts
- [x] Release Notes after updates
- [x] Virtualized grids for large result sets
- [x] Korean/English UI language support
- [x] Local font support with `Inter` and `Noto Sans KR`
- [x] GitHub Releases based auto update for packaged builds

## Server Profiles

Server profiles include broker addresses, optional SSL/TLS, optional SASL/OAUTHBEARER, and optional Schema Registry settings.

Use `Test` in the server profile dialog to verify the Kafka Admin connection before saving. The test uses the current form values, does not save the profile, and shows success or failure inside the dialog.

## Consume

Consume supports three modes:

- `Offset`: read from a specific offset
- `Time`: read messages by timestamp range
- `Live`: stream new messages in real time

Live mode starts from the latest topic offsets for the current session, so old committed group offsets do not flood the UI or Live Record output.

Large offset queries are paged automatically when the requested limit is greater than `10,000`. The current page can be exported, and the full captured offset range can also be exported.

Key and Value can be viewed and exported as `Text`, `JSON`, `Hex`, or `Base64`. Kafka Tool keeps raw payload bytes only up to a fixed per-message limit to protect memory during large consumes. Larger payloads still display as text when KafkaJS can decode them, but raw-only views such as hex/base64 show an explicit retained-bytes warning.

Use `Value Columns` to select fields inside a structured Value payload, such as `vehicleId`, `latitude`, `longitude`, `speed`, or deeply nested paths. The picker groups nested fields as a tree, and leaf values in the Message Viewer Tree can be added directly to Value Columns. Selected Value Columns are stored per topic. CSV exports include selected Value Columns after the default message columns; JSON and LOG exports keep their existing formats.

Use Message Replay from the Message Viewer toolbar to send the selected consumed message to a target server and topic. The replay dialog shows the source cluster/topic/partition/offset, lets you pick a target server and topic, and supports Key, Headers, and Value inclusion toggles. Payload fields can be edited before sending, and Dynamic Produce fields such as `${uuid}`, `${seq:1..100}`, and `${date:yyyy-MM-dd HH:mm:ss}` are rendered just before replay.

Live Record writes messages directly to a `JSONL` file stream. It is intended for long-running captures without keeping the entire captured dataset in renderer memory.

## Consumer Groups

Consumer Group details show committed offsets, beginning/end offsets, and lag by topic partition.

Use `Reset Offsets` from a Consumer Group detail view to reset selected partitions to:

- `Earliest`
- `Latest`
- `Timestamp`
- `Specific offset`

Kafka Tool blocks reset execution while the Consumer Group is active, requires a preview step, and asks for explicit `RESET` confirmation before applying changes. Reset progress and errors are shown inside the dialog.

## Map Viewer

Messages that contain coordinate fields can be sent to the Map Viewer from the Consume message toolbar. The Map Viewer opens in a separate window and supports:

- per-topic Map Field Mapping for custom JSON paths
- WGS84 degree, WGS84 millisecond, Korea TM, and UTM Zone 52N coordinate conversion
- vehicle markers with heading-aware rotation
- trails for recent movement history
- selected-vehicle follow, auto-fit, and free-move modes
- a vehicle list with topic, speed, heading, and coordinates
- speed fields in `km/h` or `m/s`

The Map Viewer is designed for smart-city, BIS, C-ITS, and autonomous-driving Kafka topics where developers need to inspect live coordinate streams.

## Produce

Produce supports single-message publishing and Interval Produce.

Interval Produce requires either a `Count` or `Duration` limit. It does not provide an unlimited mode. Before it starts, Kafka Tool shows a confirmation with the topic, interval, stop condition, and estimated maximum message count.

Dynamic fields can be used in `Key`, `Headers`, and `Value`:

| Syntax | Description |
| --- | --- |
| `${seq}` | Sequential values starting at 1 |
| `${seq:1..10}` | Sequential values that wrap inside a range |
| `VMS${seq:1..100\|pad=7}` | Padded IDs such as `VMS0000001` |
| `${random:1..100}` | Random integer in a range |
| `${float:0..1\|fixed=2}` | Random decimal with fixed digits |
| `${choice:READY\|RUNNING\|ERROR}` | Randomly picks one value |
| `${timestamp}` | Current epoch milliseconds |
| `${timestamp:s}` | Current epoch seconds |
| `${date:yyyy-MM-dd HH:mm:ss}` | Formatted local date/time |
| `${now}` | Current ISO date/time |
| `${uuid}` | Random UUID |
| `\${uuid}` | Escaped literal token |

Produce Preview shows the rendered Key, Headers, and Value before publishing. Invalid dynamic field syntax is shown in Preview and blocks Interval Produce.

Per-topic Produce templates are saved in app preferences and are included in settings export/import.

## Shortcuts

Default shortcuts:

- `Ctrl/Cmd+P` or `Ctrl/Cmd+K`: open Quick Search
- `Ctrl/Cmd+Right`: send the current Topic to the right pane
- `Ctrl/Cmd+Left`: send the current Topic in the right pane to the left pane
- `Ctrl/Cmd+1`: focus the left pane
- `Ctrl/Cmd+2`: focus the right pane
- `Ctrl/Cmd+W`: close the current Topic tab
- `Ctrl/Cmd+Shift+W`: close the split pane

Shortcuts can be customized in `Preferences > Editor > Shortcuts`.

## Security

> [!WARNING]
> Client secrets, Schema Registry credentials, and bearer tokens are saved in the local settings file. Handle exported settings files carefully.

## Release

Windows builds can be published from Windows. macOS builds must be created on macOS.

```bash
npm ci
npm run build
npm run release:win
```

For macOS:

```bash
npm ci
npm run release:mac
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Copyright

Copyright (c) 2026 PJHUN.
