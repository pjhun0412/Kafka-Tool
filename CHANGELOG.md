# Changelog

## 2.0.2

### Added

- Added editable in-app keyboard shortcuts in Preferences.
- Added a What’s New dialog that appears once after an app version changes.
- Added a Help menu entry for reopening Release Notes.

### Improved

- Improved shortcut handling for macOS and Windows/Linux by using Cmd/Ctrl-aware bindings.
- Updated Help content for Shortcuts and Split tabs in English and Korean.
- Persisted shortcut preferences and release-note acknowledgement in app preferences and settings export/import.

## 2.0.1

### Added

- Added Key/Value payload format selectors for Consume results and exports.
- Added a Message Viewer with `Raw`, `Tree`, and `Preview` modes.
- Added `Text`, `JSON`, `Hex`, and `Base64` preview/export support with UTF-8 and EUC-KR decoding.

### Improved

- Limited retained raw payload bytes per message to reduce memory pressure during large consumes.
- Improved Live Record file writing with sequential write backpressure for long-running captures.
- Kept Message Viewer mode per topic pane, including split panes, when switching tabs.
- Updated English and Korean README release notes for `2.0.1`.

### Fixed

- Fixed Value/Preview copy actions so they use the currently selected payload target and format.
- Fixed viewer mode unexpectedly returning to `Raw` after navigating away from Consume.
- Fixed large raw payload export behavior for Hex/Base64 by showing a retained-bytes warning instead of rebuilding bytes from fallback text.

## 2.0.0

### Added

- Added split workspace panes for side-by-side Topic workflows.
- Added Topic Settings view with editable Kafka configs.
- Added Topic creation and clear messages actions.
- Added Broker detail pages with configs.
- Added Live Record for streaming messages to JSONL files.
- Added Korean/English UI language support.
- Added Inter and Noto Sans KR font support.
- Added macOS package and release scripts for macOS builds.

### Improved

- Refactored renderer state around Zustand stores and focused hooks/actions.
- Improved large Consume result performance with virtualized grids.
- Improved JSON Viewer resize responsiveness.
- Improved Consumer Group detail layout with collapsible Topic sections.
- Improved Quick Search keyboard navigation and result badges.
- Improved split-pane state preservation per server.

### Fixed

- Fixed large offset paging in Newest mode.
- Fixed split refresh resetting Consume mode back to Offset.
- Fixed Live Consume reading old committed group offsets into the UI or Record output.
- Fixed Topic/Favorite row hit areas triggering unintended navigation.
- Fixed several hard-coded UI strings through i18n cleanup.
