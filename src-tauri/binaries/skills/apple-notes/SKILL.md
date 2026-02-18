---
name: apple-notes
description: Manage Apple Notes on macOS via AppleScript. Create, view, edit, delete, and search notes. Use when asked to manage notes, create notes, search notes, list notes, or organize notes on macOS.
---

# Apple Notes

Manage Apple Notes on macOS via AppleScript.

## Commands

Execute all commands via `osascript`:

```bash
osascript -e 'APPLESCRIPT_COMMAND'
```

## List All Notes

```bash
osascript << 'EOF'
tell application "Notes"
    set noteList to {}
    set allNotes to notes
    repeat with n in allNotes
        set noteTitle to name of n
        set noteId to id of n
        set end of noteList to noteTitle & " | ID: " & noteId
    end repeat
    return noteList as string
end tell
EOF
```

## List Notes with Preview

```bash
osascript << 'EOF'
tell application "Notes"
    set output to ""
    set allNotes to notes
    repeat with n in allNotes
        set noteTitle to name of n
        set noteBody to body of n
        set bodyLen to length of noteBody
        if bodyLen > 100 then set bodyLen to 100
        set bodyPreview to text 1 thru bodyLen of noteBody
        set output to output & "标题: " & noteTitle & linefeed & "ID: " & (id of n) & linefeed & "预览: " & bodyPreview & linefeed & "---" & linefeed
    end repeat
    return output
end tell
EOF
```

## Create Note

```bash
osascript << 'EOF'
tell application "Notes"
    set newNote to make new note with properties {name:"NOTE_TITLE", body:"NOTE_CONTENT"}
    return "Created: " & name of newNote & " | ID: " & id of newNote
end tell
EOF
```

## Create Note in Specific Folder

```bash
osascript << 'EOF'
tell application "Notes"
    tell folder "FOLDER_NAME"
        set newNote to make new note with properties {name:"NOTE_TITLE", body:"NOTE_CONTENT"}
        return "Created: " & name of newNote
    end tell
end tell
EOF
```

## Search Notes

```bash
osascript << 'EOF'
tell application "Notes"
    set searchQuery to "SEARCH_TERM"
    set foundNotes to {}
    set allNotes to notes
    repeat with n in allNotes
        set noteTitle to name of n
        set noteBody to body of n
        if noteTitle contains searchQuery or noteBody contains searchQuery then
            set end of foundNotes to noteTitle & " | ID: " & (id of n)
        end if
    end repeat
    return foundNotes as string
end tell
EOF
```

## Get Note Content

```bash
osascript << 'EOF'
tell application "Notes"
    set targetNote to first note whose name is "NOTE_TITLE"
    return "Title: " & name of targetNote & linefeed & "Body: " & body of targetNote
end tell
EOF
```

## Delete Note

```bash
osascript << 'EOF'
tell application "Notes"
    set targetNote to first note whose name is "NOTE_TITLE"
    delete targetNote
    return "Note deleted"
end tell
EOF
```

## List Folders

```bash
osascript -e 'tell application "Notes" to get name of every folder'
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Can't get note` | Note not found | Use exact title match or search first |
| Permission denied | Automation not granted | Grant in System Settings > Privacy & Security > Automation |
| Timeout on list | Too many notes | Use pagination or filter by folder |

## Body Format

Note body is HTML. Example:

```
<div>Note content here</div>
<div><br></div>
<div>Second paragraph</div>
```

## Requirements

- macOS with Apple Notes
- Automation permission for Terminal

## Note

The `memo` CLI tool is optional. AppleScript provides full functionality without additional installation.
