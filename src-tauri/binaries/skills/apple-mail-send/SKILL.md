---
name: apple-mail-send
description: Send emails using Apple Mail on macOS. Supports sending drafts from Drafts folder, composing and sending new emails, and listing drafts for review. Use when asked to send email, send draft, compose email, list drafts, or manage outgoing mail on macOS.
---

# Apple Mail Send

Send emails using Apple Mail on macOS via AppleScript.

## Commands

Execute all commands via `osascript`:

```bash
osascript -e 'APPLESCRIPT_COMMAND'
```

## List Drafts

```bash
osascript << 'EOF'
tell application "Mail"
    set draftMessages to messages of drafts mailbox
    set output to ""
    repeat with msg in draftMessages
        set subj to subject of msg
        if subj is missing value then set subj to "(无主题)"
        set mid to message id of msg
        set recList to ""
        repeat with rec in to recipients of msg
            set recList to recList & (address of rec) & ", "
        end repeat
        set output to output & "主题: " & subj & " | 收件人: " & recList & " | ID: " & mid & linefeed
    end repeat
    return output
end tell
EOF
```

## Send Draft Email

**Note**: Direct `send message id` may fail. Use the workaround below:

```bash
osascript << 'EOF'
tell application "Mail"
    set targetId to "MESSAGE_ID"
    set draftMessages to messages of drafts mailbox
    repeat with msg in draftMessages
        if message id of msg is targetId then
            set subj to subject of msg
            set bodyContent to content of msg
            set recList to {}
            repeat with rec in to recipients of msg
                set end of recList to {addr:(address of rec)}
            end repeat
            set newMsg to make new outgoing message with properties {subject:subj, content:bodyContent, visible:false}
            repeat with recInfo in recList
                tell newMsg
                    make new to recipient at end of to recipients with properties {address:(addr of recInfo)}
                end tell
            end repeat
            send newMsg
            delete msg
            return "Email sent successfully!"
        end if
    end repeat
    return "Draft not found"
end tell
EOF
```

## Compose and Send New Email

```bash
osascript << 'EOF'
tell application "Mail"
    set newMsg to make new outgoing message with properties {subject:"SUBJECT", content:"BODY", visible:false}
    tell newMsg
        make new to recipient at end of to recipients with properties {address:"recipient@example.com"}
    end tell
    send newMsg
    return "Email sent!"
end tell
EOF
```

## Add CC/BCC

```bash
osascript << 'EOF'
tell application "Mail"
    set newMsg to make new outgoing message with properties {subject:"SUBJECT", content:"BODY", visible:false}
    tell newMsg
        make new to recipient at end of to recipients with properties {address:"to@example.com"}
        make new cc recipient at end of cc recipients with properties {address:"cc@example.com"}
        make new bcc recipient at end of bcc recipients with properties {address:"bcc@example.com"}
    end tell
    send newMsg
end tell
EOF
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `send message id` fails | AppleScript limitation | Use the workaround to create new outgoing message |
| `visible of msg` error | Drafts don't support visibility | Use outgoing message with `visible:false` |
| Permission denied | Automation not granted | Grant in System Settings > Privacy & Security > Automation |

## Requirements

- macOS with Apple Mail configured
- At least one email account set up
- Automation permission for Terminal

## Safety

- Always confirm with user before sending emails
- Never send emails without explicit user approval
