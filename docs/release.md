# Release Guide

Kafka Tool releases are published from `main`.

## Branches

- `main`: latest deployable state
- `feature/*`: short-lived feature branches
- `fix/*`: short-lived bug fix branches
- `chore/*`: docs, release, and build maintenance

Delete short-lived branches after they are merged into `main`.

## Version

Update the package version before a release:

```bash
npm version 2.0.1 --no-git-tag-version
```

Verify the build:

```bash
npm run build
```

Commit the version update:

```bash
git add package.json package-lock.json
git commit -m "chore: release 2.0.1"
```

## Tag

Create a release tag from `main`:

```bash
git tag v2.0.1
git push origin main --tags
```

## Windows

Publish the Windows installer:

```powershell
$env:GH_TOKEN="your_github_token"
npm run release:win
Remove-Item Env:GH_TOKEN
```

The release should include:

```text
Kafka-Tool-Setup-{version}.exe
Kafka-Tool-Setup-{version}.exe.blockmap
latest.yml
```

## macOS

Build or publish macOS artifacts from a macOS machine.

Unsigned internal package:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run package:mac
```

Publish to GitHub Releases:

```bash
GH_TOKEN="your_github_token" CSC_IDENTITY_AUTO_DISCOVERY=false npm run release:mac
```

The release should include `latest-mac.yml` if macOS update checks are expected to work.

