---
name: apple-reminders
description: Manage Apple Reminders on macOS via AppleScript or remindctl CLI. Supports lists, CRUD operations, date filters, and completion tracking. Use when asked to manage reminders, todo lists, or tasks on macOS.
---

# Apple Reminders

Manage Apple Reminders via AppleScript (always available) or `remindctl` CLI (if installed).

## Method Selection

- **AppleScript**: Always available, no dependencies
- **remindctl CLI**: Better output formatting, requires `brew install steipete/tap/remindctl`

## Permissions

Grant access in **System Settings → Privacy & Security → Reminders**. Terminal or the running app needs Reminders permission.

---

## AppleScript Commands (Recommended)

### List All Reminder Lists

```bash
osascript -e 'tell application "Reminders" to get name of lists'
```

Returns list names.

### List Reminders in a List

```bash
osascript -e '
tell application "Reminders"
    tell list "提醒"
        get {name, completed, due date} of every reminder
    end tell
end tell
'
```

### Create Reminder

```bash
osascript -e '
tell application "Reminders"
    tell list 1
        make new reminder with properties {name:"Task Title", body:"Optional notes"}
    end tell
end tell
'
```

Returns reminder ID: `reminder id x-apple-reminder://AEEE72F6-9A8E-4FEF-A55F-FA711397E5CA`

**Reminder properties:**
- `name`: Task title (string, required)
- `body`: Notes/description (string, optional)
- `due date`: Due date (date object, optional)
- `priority`: 0=none, 1=low, 5=medium, 9=high

### Create Reminder with Due Date

```bash
osascript -e '
tell application "Reminders"
    tell list "提醒"
        set tomorrow to (current date) + 1 * days
        make new reminder with properties {name:"Due tomorrow", due date:tomorrow}
    end tell
end tell
'
```

### Complete a Reminder

```bash
osascript -e '
tell application "Reminders"
    tell list "提醒"
        set theReminder to reminder id "x-apple-reminder://AEEE72F6-9A8E-4FEF-A55F-FA711397E5CA"
        set completed of theReminder to true
    end tell
end tell
'
```

### Delete a Reminder

```bash
osascript -e '
tell application "Reminders"
    tell list "提醒"
        delete reminder id "x-apple-reminder://AEEE72F6-9A8E-4FEF-A55F-FA711397E5CA"
    end tell
end tell
'
```

---

## remindctl CLI (Alternative)

If `remindctl` is installed, it provides cleaner output.

### Setup

```bash
brew install steipete/tap/remindctl
```

Check permissions: `remindctl status`

### View Reminders

```bash
remindctl              # Today
remindctl today        # Today
remindctl tomorrow     # Tomorrow
remindctl week         # This week
remindctl overdue      # Overdue
remindctl all          # All
```

### Manage Lists

```bash
remindctl list                    # List all lists
remindctl list Work               # Show list
remindctl list Projects --create  # Create
remindctl list Work --delete      # Delete
```

### Create & Complete

```bash
remindctl add "Buy milk"
remindctl add --title "Call mom" --list Personal --due tomorrow
remindctl complete 1 2 3
remindctl delete 4A83 --force
```

### Output Formats

```bash
remindctl today --json    # JSON
remindctl today --plain   # TSV
remindctl today --quiet   # Counts only
```

---

## Best Practices

1. **Use `list 1` for default list**: Avoids hardcoding list names
2. **Check list exists**: Some accounts may have different default list names
3. **AppleScript for reliability**: Works even without remindctl installed
4. **remindctl for scripting**: Use `--json` for parseable output

## Common Errors

| Error | Solution |
|-------|----------|
| `Reminders got an error` | Check list name exists |
| `Not authorized` | Grant Reminders access in System Settings |
| `Can't get list` | List name doesn't exist; list lists first |

## Example: Create Reminder with Priority

```bash
osascript -e '
tell application "Reminders"
    tell list "提醒"
        set tomorrow to (current date) + 1 * days
        set hours of tomorrow to 9
        set minutes of tomorrow to 0
        make new reminder with properties {name:"Important meeting", body:"Prepare slides", due date:tomorrow, priority:9}
    end tell
end tell
'
```
