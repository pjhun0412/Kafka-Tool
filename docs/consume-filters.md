# Consume Filters

Consume filters support plain text, field filters, regex, and JSON path comparisons.

## Plain Text

```text
error
!timeout
```

## Field Filters

```text
key:PR1001
value:OK
headers.traceId exists
empty:headers
```

## Regex

```text
/timeout|failed/i
```

## JSON Path Comparisons

```text
decoded.speed >= 50
value.proc_id == "PR0116"
headers.traceId exists
```

## Modes

- `Hide`: hide non-matching rows
- `Highlight`: keep all rows visible and highlight matches

