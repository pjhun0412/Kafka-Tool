# Changelog

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

