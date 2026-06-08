# 내가 쓰려고 만든 바이브코딩 Kafka Tool

Kafka Tool is a lightweight desktop Kafka explorer built with Electron, React, TypeScript, KafkaJS, and KafkaJS-compatible admin/consumer APIs.

It is designed for internal developer and operations use: register Kafka clusters, browse topics, consume and produce messages, inspect payloads, manage schemas, and export operational data from a single executable app.

## 0.1.7 Release Notes

Bug fixes:

- Fixed large offset paging in `Newest` mode so `Next` then `Prev` returns to the same captured page without dropping the first message.
- Prevented large offset paging from reusing stale pagination snapshots after starting a fresh consume request.
- Disabled `Prev` and `Next` while a consume page request is already running to avoid overlapping page navigation.

Performance improvements:

- Added virtualized row rendering to the shared data grid to keep large consume result sets responsive.
- Reduced JSON viewer resize jank by updating layout directly during drag and committing the final height once.
- Cached consume message grid view models so timestamp/header/value previews are not recalculated on every cell render.
- Split the consume message grid into a memoized component to reduce unnecessary re-renders while using the lower JSON viewer.

## Key Features

- Manage multiple Kafka server profiles
- Connect, disconnect, edit, delete, search, and reorder servers
- Open multiple cluster tabs and close tabs with the middle mouse button
- Browse brokers, topics, and consumer groups per cluster
- Browse topic metadata such as partitions, replication factor, ISR, low/high offsets, and message counts
- Search, sort, filter, and favorite topics per server
- Keep favorite topics pinned above the normal topic list
- Open topic tabs by double-clicking topics
- Split topic tabs into left/right work areas for side-by-side inspection
- Persist user settings, server profiles, favorite topics, panel sizes, and window size locally
- Import/export settings from the native File menu
- Check and install updates from GitHub Releases in packaged builds

## Consume

Messages can be consumed in three modes:

- `Offset`: consume from a specific offset
- `Time`: consume by timestamp range
- `Live`: stream new messages in real time

Consume features:

- `Newest` and `Oldest` lookup direction
- Pause/stop live streaming
- Auto-scroll toggle for live mode
- Max retained live messages to protect renderer memory
- Message grid with sorting and column filters
- Global text filter across key, value, headers, partition, offset, timestamp, topic, and decoded payload
- Advanced filter syntax such as:

```text
key:PR1001
value:OK
headers.traceId exists
!error
/timeout|failed/i
value.proc_id == "PR0116"
decoded.speed >= 50
```

Filter modes:

- `Hide`: rows that do not match are hidden
- `Highlight`: all rows stay visible, matching rows are highlighted and non-matching rows are dimmed

## Large Offset Queries

Large operational lookups are supported without forcing all messages into renderer memory.

When the offset `Limit` is `10,000` or lower, the app reads and displays the requested range directly.

When the offset `Limit` is greater than `10,000`, the app switches to paged viewing:

- The screen loads up to `5,000` messages per page.
- `Prev` and `Next` move through the captured offset range.
- `Newest` starts from the high offset captured when `Consume` is clicked.
- `Oldest` starts from the entered offset.
- The captured offset range is reused for paging and full export, so newly arriving Kafka messages do not change the current query session.

The download menu supports:

- Current page export
- Full offset range export

This keeps the UI responsive while still allowing large exports such as 60,000 messages.

## Message Viewer

Selected messages are shown in the lower viewer.

- Raw JSON view
- Tree JSON view
- JSON search and highlight
- Copy full message JSON
- Copy only Kafka value
- Send selected payload to the Produce tab
- Timestamp hover conversion for epoch-like values
- Avro decoded payload display when schema information is available

## Produce

Produce supports:

- Topic key
- Message value
- Headers
- Payload copied from consumed messages
- Produce templates from selected consumed data
- Editing copied headers and values before sending

## Avro And Schema Registry

Kafka Tool supports optional Avro decoding.

Schema Registry mode:

- Register a Schema Registry URL on a server profile.
- Confluent wire-format Avro messages can be decoded automatically when schema IDs are available.
- Schema cache is scoped by server and schema ID to avoid multi-cluster collisions.
- Concurrent requests for the same schema ID reuse the same in-flight request.

Manual schema mode:

- Register an Avro schema for a specific topic.
- Open the schema dialog from the topic toolbar or topic context menu.
- Paste schema JSON directly.
- Upload a schema file.
- Drag and drop a schema file into the schema editor.
- View registered topic schemas from Preferences.

If a message cannot be decoded, the grid shows an Avro error badge and preserves the original payload preview.

## Brokers, Topics, Consumers

Cluster-level pages are available from the main navigation:

- `Brokers`: broker count, controller, partitions, ISR, OOS replica information, and broker table
- `Topics`: topic table with partitions, replication factor, message count, and favorite state
- `Consumers`: consumer group list, group state, members, assigned topics, coordinator, and group detail view

All major tables use sortable/filterable TanStack-based grids.

## Global Search

Global search is available from keyboard shortcuts:

```text
Ctrl+P
Ctrl+K
```

Search can find:

- Servers
- Topics
- Open topic tabs
- Avro schemas
- Consumer groups
- Quick actions

Disconnected server results are marked before navigation. If needed, the app attempts to connect before opening a server-scoped result.

## Message Export

Consumed messages can be exported as:

- `JSON`
- `CSV`
- `LOG`

The LOG format uses the template configured in:

```text
File > Preferences...
```

Available LOG template variables:

```text
{topic}
{partition}
{offset}
{timestamp}
{key}
{value}
{headers}
```

## Authentication

Plain Kafka brokers work without additional settings.

For SSL/TLS:

1. Open Add Server or Edit Server.
2. Enable `Use SSL/TLS`.
3. Save and connect.

For SASL/OAUTHBEARER:

1. Open Add Server or Edit Server.
2. Enable `SASL/OAUTHBEARER`.
3. Fill in:
   - `Token endpoint`
   - `Client ID`
   - `Client secret`
   - Optional `Scope`
   - Optional `Audience`
4. Enable `Use SSL/TLS` only when your Kafka endpoint requires TLS.
5. Save and connect.

For Keycloak client credentials, the token endpoint usually looks like this:

```text
https://{keycloak-host}/realms/{realm-name}/protocol/openid-connect/token
```

The `Client ID` is the Keycloak client name, for example:

```text
nzero-kafka-client
```

Security note: server profiles are stored on the user's PC. Client secrets are currently saved in the local settings file, so exported settings files should be handled carefully.

## Local Data

Electron stores user data under the app's user data directory.

On Windows this is usually:

```text
C:\Users\{USER}\AppData\Roaming\kafka-tool
```

Important files:

```text
servers.json
preferences.json
```

Stored information includes:

- Server profiles
- Favorite topics by server
- Avro schemas by server/topic
- Consume defaults
- Font and LOG export template preferences
- Window size and position
- Sidebar and panel sizes

## Development

Install dependencies:

```bash
npm install
```

Run the development app:

```bash
npm run dev
```

Type-check and build:

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

Generated files are written to:

```text
out/
```

The important Windows output files are:

```text
out/Kafka-Tool-Setup-{version}.exe
out/Kafka-Tool-Setup-{version}.exe.blockmap
out/latest.yml
```

Team members should install using the `Kafka-Tool-Setup-{version}.exe` installer, not the `win-unpacked` directory.

## Auto Update

Auto update uses `electron-updater` and GitHub Releases.

The app checks GitHub Releases when running as a packaged app. Users can also run:

```text
File > Check for Updates...
```

To publish a new Windows release:

```powershell
$env:GH_TOKEN="your_github_token"
npm version patch
git push origin main --tags
npm run release:win
Remove-Item Env:GH_TOKEN
```

The GitHub token should be a fine-grained token with access only to this repository and:

```text
Contents: Read and write
Metadata: Read
```

Make sure the GitHub release is a production release, not a draft or pre-release. The updater reads the latest production release.

## Release Checklist

1. Confirm the app builds.

```bash
npm run build
```

2. Increase the version.

```bash
npm version patch
```

3. Push code and tags.

```bash
git push origin main --tags
```

4. Publish the Windows installer.

```powershell
$env:GH_TOKEN="your_github_token"
npm run release:win
Remove-Item Env:GH_TOKEN
```

5. Confirm the GitHub Release contains:

```text
Kafka-Tool-Setup-{version}.exe
Kafka-Tool-Setup-{version}.exe.blockmap
latest.yml
```

6. Test from an older installed version:

```text
File > Check for Updates...
```

## Tech Stack

- Electron
- React
- TypeScript
- Vite
- KafkaJS
- Avro via `avsc`
- TanStack Table
- TanStack Virtual
- Tailwind CSS
- electron-builder
- electron-updater
