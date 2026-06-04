# Kafka Tool

Kafka Tool is a lightweight desktop Kafka explorer built with Electron, React, TypeScript, KafkaJS, and Tailwind CSS.

It is designed for internal developer use: register Kafka clusters, browse topics, consume and produce messages, inspect JSON payloads, and monitor consumer groups from a single executable app.

## Features

- Manage multiple Kafka server profiles
- Open multiple cluster tabs
- Search, reorder, connect, disconnect, edit, and delete servers
- Browse topic lists with per-server favorites
- Filter and sort topic lists by name, message count, partitions, and favorites
- View topic message counts in the sidebar and topic overview
- Open topic tabs by double-clicking topics
- Split topic tabs into left/right work areas for side-by-side inspection
- View topic partition, replica, ISR, and offset information
- Consume messages by offset, time range, or live streaming
- Use `Newest` or `Oldest` offset lookup order
- Automatically page large offset queries over 10,000 messages
- Keep large offset paging and full export pinned to the same snapshot offset
- Pause live streaming and control auto-scroll
- Limit retained live messages to protect renderer memory
- Filter consumed messages by key, value, offset, partition, or timestamp
- Export consumed messages as JSON, CSV, or custom LOG format
- Export current page or full offset range for large offset queries
- Inspect selected messages with Raw and Tree JSON viewers
- Search and highlight JSON contents
- Copy full message JSON or only the Kafka value
- Send consumed payloads to the Produce tab
- Produce messages with key, headers, and value
- Use sortable TanStack-based grids for messages, brokers, topics, and consumers
- View consumer groups and group lag
- Persist user settings locally
- Import/export settings from the native File menu
- Customize editor font family, font size, and LOG export template
- GitHub Releases based auto-update support
- Optional SSL/TLS and SASL/OAUTHBEARER server authentication

## Large Offset Queries

Offset consume supports large limits for operational debugging.

When the offset `Limit` is `10,000` or lower, the app reads and displays the requested range directly.

When the offset `Limit` is greater than `10,000`, the app switches to paged viewing:

- The screen loads up to `5,000` messages per page.
- `Prev` and `Next` move through the offset range without keeping all messages in renderer memory.
- `Newest` starts from the high offset captured when `Consume` is clicked.
- `Oldest` starts from the entered offset.
- The captured high offset is reused for paging and full export, so newly arriving Kafka messages do not change the current query session.

The download menu has two groups in large offset mode:

- `Current page`: exports only the currently displayed page.
- `Full offset range`: exports the full requested offset range directly from the Electron main process.

This keeps the UI responsive while still allowing large exports such as 60,000 messages.

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
4. Save and connect.

For Keycloak client credentials, the token endpoint usually looks like this:

```text
https://{keycloak-host}/realms/{realm-name}/protocol/openid-connect/token
```

The `Client ID` is the Keycloak client name, for example:

```text
nzero-kafka-client
```

Security note: server profiles are stored on the user's PC. Client secrets are currently saved in the local settings file, so treat exported settings files carefully.

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
- TanStack Table
- TanStack Virtual
- Tailwind CSS
- electron-builder
- electron-updater
