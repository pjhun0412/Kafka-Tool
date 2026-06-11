# Kafka Tool

[English](README.md) | [한국어](README.ko.md)

Kafka Tool is a lightweight Electron desktop client for Apache Kafka.

It is built for developers and operators who need to register Kafka clusters, browse brokers/topics/consumer groups, consume and produce messages, inspect payloads, manage topic settings, and export data from one desktop app.

## Version

Current release: `2.0.2`

## 2.0.2 Patch Notes

- Added editable in-app keyboard shortcuts in Preferences.
- Added a What’s New dialog that appears once after an app version changes.
- Added a Help menu entry for reopening Release Notes.
- Improved shortcut handling for macOS and Windows/Linux by using Cmd/Ctrl-aware bindings.
- Updated Help content for Shortcuts and Split tabs in English and Korean.

## Documentation

- [Changelog](CHANGELOG.md)
- [Release guide](docs/release.md)
- [macOS internal install](docs/macos-install.md)
- [Consume filters](docs/consume-filters.md)
- [Avro](docs/avro.md)
- [Project structure](PROJECT_STRUCTURE.md)

## Highlights

- [x] Multi-cluster server profile management
- [x] `Broker`, `Topic`, and `Consumer Group` browsing
- [x] Topic detail, settings, creation, clear messages, and delete actions
- [x] `Offset`, `Time`, and `Live` Consume modes
- [x] Key/Value payload display as `Text`, `JSON`, `Hex`, or `Base64`
- [x] Message Viewer with `Raw`, `Tree`, and `Preview` modes
- [x] Live message recording to `JSONL` files
- [x] Produce messages with key, headers, and value
- [x] Avro decoding with Schema Registry or manually registered topic schemas
- [x] Split workspace panes for side-by-side Topic workflows
- [x] Fast global search with `Ctrl+P` / `Ctrl+K`
- [x] Editable in-app keyboard shortcuts
- [x] What’s New / Release Notes after updates
- [x] Virtualized grids for large result sets
- [x] Korean/English UI language support
- [x] Local font support with `Inter` and `Noto Sans KR`
- [x] GitHub Releases based auto update for packaged builds

## Consume

Consume supports three modes:

- `Offset`: read from a specific offset
- `Time`: read messages by timestamp range
- `Live`: stream new messages in real time

Live mode starts from the latest topic offsets for the current session, so old committed group offsets do not flood the UI or Live Record output.

Large offset queries are paged automatically when the requested limit is greater than `10,000`. The current page can be exported, and the full captured offset range can also be exported.

Key and Value can be viewed and exported as `Text`, `JSON`, `Hex`, or `Base64`. Kafka Tool keeps raw payload bytes only up to a fixed per-message limit to protect memory during large consumes. Larger payloads still display as text when KafkaJS can decode them, but raw-only views such as hex/base64 show an explicit retained-bytes warning.

Live Record writes messages directly to a `JSONL` file stream. It is intended for long-running captures without keeping the entire captured dataset in renderer memory.

## Shortcuts

Default shortcuts:

- `Ctrl/Cmd+P` or `Ctrl/Cmd+K`: open Quick Search
- `Ctrl/Cmd+\`: split the current Topic to the right pane
- `Ctrl/Cmd+1`: focus the left pane
- `Ctrl/Cmd+2`: focus the right pane
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
