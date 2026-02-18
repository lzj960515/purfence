---
name: apple-calendar
description: Apple Calendar.app integration for macOS via AppleScript. CRUD operations for events, search, and multi-calendar support. Use when asked to manage calendar, create events, schedule meetings, search events, list calendars on macOS.
---

# Apple Calendar

Interact with Calendar.app via AppleScript. All operations use the `osascript -e` command.

## Permissions

Grant access in **System Settings → Privacy & Security → Calendar**. Terminal or the running app needs Calendar permission.

## Commands

### List All Calendars

```bash
osascript -e 'tell application "Calendar" to get name of calendars'
```

Returns comma-separated list: `个人, 工作, 生日, ...`

### List Today's Events

```bash
osascript -e '
tell application "Calendar"
    set today to current date
    set hours of today to 0
    set minutes of today to 0
    set seconds of today to 0
    set tomorrow to today + (1 * days)
    set output to ""
    repeat with cal in calendars
        set eventList to (every event whose start date ≥ today and start date < tomorrow)
        repeat with evt in eventList
            set output to output & (summary of evt) & " | " & (start date of evt as string) & " | " & (name of cal) & linefeed
        end repeat
    end repeat
    return output
end tell
'
```

### Create Event

```bash
osascript -e '
tell application "Calendar"
    tell calendar "个人"
        make new event with properties {summary:"Event Title", start date:(current date) + 1 * days, end date:(current date) + 1 * days + 1 * hours}
    end tell
end tell
'
```

Returns event ID on success: `event id FCA05B97-8721-4B55-B67D-51E9B9329F65`

**Event properties:**
- `summary`: Event title (string)
- `start date`: Start time (date object)
- `end date`: End time (date object)
- `location`: Optional location (string)
- `description`: Optional notes (string)
- `allday event`: Set to `true` for all-day events

### Search Events by Summary

```bash
osascript -e '
tell application "Calendar"
    set searchQuery to "meeting"
    set output to ""
    repeat with cal in calendars
        set eventList to (every event whose summary contains searchQuery)
        repeat with evt in eventList
            set output to output & (summary of evt) & " | " & (start date of evt as string) & " | " & (name of cal) & linefeed
        end repeat
    end repeat
    return output
end tell
'
```

### Get Event Details

```bash
osascript -e '
tell application "Calendar"
    tell calendar "个人"
        get properties of event id "FCA05B97-8721-4B55-B67D-51E9B9329F65"
    end tell
end tell
'
```

### Delete Event

```bash
osascript -e '
tell application "Calendar"
    tell calendar "个人"
        delete event id "FCA05B97-8721-4B55-B67D-51E9B9329F65"
    end tell
end tell
'
```

## Date Arithmetic

Use AppleScript date math:
- `(current date) + 1 * days` - Tomorrow
- `(current date) + 2 * hours` - In 2 hours
- `(current date) - 1 * weeks` - Last week

## Best Practices

1. **Calendar names are case-sensitive**: Use exact name from list (e.g., `"个人"` not `"personal"`)
2. **Read-only calendars**: Birthdays, Holidays, subscribed calendars cannot be modified
3. **Synchronize after batch changes**: Add `synchronize` command after multiple creates/updates
4. **Handle missing calendars**: Check calendar exists before operating

## Common Errors

| Error | Solution |
|-------|----------|
| `Calendar got an error` | Check calendar name spelling exactly |
| `Not authorized` | Grant Calendar access in System Settings |
| `Can't get calendar` | Calendar name doesn't exist; list calendars first |

## Example: Create Meeting Tomorrow

```bash
osascript -e '
tell application "Calendar"
    tell calendar "工作"
        set tomorrow to (current date) + 1 * days
        set hours of tomorrow to 10
        set minutes of tomorrow to 0
        set endTime to tomorrow + 1 * hours
        make new event with properties {summary:"Team Meeting", start date:tomorrow, end date:endTime, location:"Conference Room"}
    end tell
end tell
'
```
