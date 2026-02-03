# Verification Plan: Branching & Command Mode

## 1. Branching Feature Test
- [ ] **Start Chat**: Send a message "Hello A".
- [ ] **Verify Block**: Ensure "Hello A" appears as a frozen user block.
- [ ] **Edit Block**: Click the pencil icon on "Hello A".
- [ ] **Verify Fork**:
    - [ ] Input should populate with "Hello A".
    - [ ] Confirmation dialog should appear (if enabled) or branch should visibly switch.
    - [ ] Verify `currentBranchId` changes in React DevTools or logs.
- [ ] **Send New Message**: Change input to "Hello B" and send.
- [ ] **Verify History**: The chat history should now show "Hello B" instead of "Hello A" for this new branch.
- [ ] **Switch Branch**: (Feature pending UI) Verify if the previous branch "Hello A" is preserved in state.

## 2. Command Mode Test
- [ ] **Switch Mode**: Click "Command Mode" tab.
- [ ] **Execute Command**: Type `ls -la` and hit Enter.
- [ ] **Verify Output**: See directory listing.
- [ ] **Check CWD**: Verify the CWD footer updates if directory changes `cd ..`.
- [ ] **History Navigation**:
    - [ ] Press Arrow Up: Should show `ls -la`.
    - [ ] Press Arrow Down: Should cycle back to empty input.

## 3. Configuration & Startup
- [ ] **Install Script**: Run `./install.sh` and verify no errors.
- [ ] **Config Files**: Check `~/.hexagent-gui/profile.json` allows edits.
- [ ] **VS Code Debug**: Launch via F5 and verify app starts on `DISPLAY=:0`.

## 4. User Message Rendering Fix
- [ ] **Type Message**: Enter a long query.
- [ ] **Send**: Ensure the user block appears immediately and text is not empty.
- [ ] **Reload**: Refresh page and ensure history persists.
