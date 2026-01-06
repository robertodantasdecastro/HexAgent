# HexAgentGUI - File Management System

**Advanced file management with intelligent path resolution, safe overwrites, and project organization.**

---

## 🚀 Quick Start

### Creating Files

The AI now understands various ways to specify file locations:

```
User: "Create a Python script and save to ./src/main.py"
→ AI will save to ./src/main.py with proper structure

User: "Make a shell script for project automation"
→ AI will create in downloads/ and ask for confirmation

User: "Add this to project myapp"
→ AI will save to ~/.hexagent-gui/projects/myapp/
```

### Using Workspace Panel

1. **Open Workspace:** Click the folder icon (📁) in the header
2. **Browse Projects:** View all your projects in the sidebar
3. **Navigate Files:** Click a project to see its file tree
4. **Collapse:** Use the arrow button to minimize the panel

### Safe File Overwrites

When saving to an existing file:
1. A dialog will appear automatically
2. Review the diff (green = additions, red = deletions)
3. Confirm or cancel the overwrite
4. Original file is backed up automatically

---

## 📚 Features

### Intelligent Path Resolution

Supports multiple path formats:
- **Absolute:** `/home/user/scripts/test.sh`
- **Relative:** `./src/main.py`, `../utils/helper.py`
- **Home:** `~/scripts/automation.sh`
- **Project Context:** Specify project name, files go to project folder

### Automatic Safety Features

✅ **Diff Preview** - See exactly what changes before overwriting  
✅ **Auto Backups** - Timestamped backups in `~/.hexagent-gui/backups/`  
✅ **Execute Permissions** - Scripts with shebangs auto-get +x  
✅ **Path Validation** - Prevents writing to dangerous locations  

### Project Management

Create organized multi-file projects:
```bash
# Projects are stored in ~/.hexagent-gui/projects/
myproject/
├── .hexagent.json  # Project metadata
├── main.py
├── utils/
│   └── helper.py
└── README.md
```

---

## 🎯 Usage Examples

### Example 1: Simple Script

```
User: "Create a backup script"
AI: [generates script]
User: "Save it to ~/scripts/backup.sh"
→ File saved with execute permissions
```

### Example 2: Project Structure

```
User: "Create a Python web app project called mywebapp"
AI: [creates structure]
→ ~/.hexagent-gui/projects/mywebapp/
   ├── app.py
   ├── templates/
   │   └── index.html
   └── static/
       └── style.css
```

### Example 3: Safe Overwrite

```
User: "Update the script we created"
AI: [generates new version]
→ Dialog appears showing:
   - Line-by-line diff
   - +5 additions, -2 deletions
   - File size change
→ User confirms
→ Backup created automatically
→ New version saved
```

---

## 🔧 Technical Details

### Directory Structure

```
~/.hexagent-gui/
├── downloads/          # Default save location
├── projects/           # Multi-file projects
│   └── {project_name}/
│       └── .hexagent.json
├── tmp/
│   └── files/         # Temporary files
├── backups/           # Automatic backups
│   └── {date}/
│       └── {file}.backup_{timestamp}
└── logs/              # Debug logs (if enabled)
```

### API Endpoints

**File Operations:**
- `POST /file/write` - Write file with path resolution
- `POST /file/diff` - Get diff between versions
- `POST /file/read` - Read file content
- `GET /file/backups` - List backups

**Project Operations:**
- `POST /project/create` - Create multi-file project
- `GET /project/list` - List all projects
- `GET /project/{name}/tree` - Get file tree
- `DELETE /project/{name}` - Delete project

---

## 🧪 Testing

Run the E2E test suite:
```bash
cd /home/d4r13n/iatools/HexAgentGUI
./tests/test_file_management.sh
```

Expected output:
```
✓ File write successful
✓ Overwrite protection working
✓ Diff generation successful
✓ Backup listing successful
✓ Project creation successful
...
✓ All tests passed!
```

---

## 🎨 UI Components

### Workspace Panel
- **Location:** Left sidebar (toggle with folder icon)
- **Features:** Project list, file tree, refresh button
- **Collapsible:** Minimize to icon bar

### Overwrite Dialog
- **Trigger:** Automatic when file exists
- **Shows:** Syntax-highlighted diff, statistics
- **Actions:** Confirm (with backup) or Cancel

### File Tree View
- **Display:** Hierarchical with icons
- **Icons:** Color-coded by file type
- **Navigation:** Click to expand/collapse folders

---

## ⚙️ Configuration

File management respects these settings:

```json
{
  "system": {
    "debug_mode": true,      // Enables detailed logging
    "auto_save_session": true // Auto-saves your work
  }
}
```

---

## 🐛 Troubleshooting

### Files not saving?
- Check path permissions
- Verify directory exists
- Review backend logs

### Workspace panel not showing?
- Click folder icon in header
- Check if backend is running
- Refresh project list

### Diff not displaying?
- Ensure file exists first
- Check backend connectivity
- Try manual refresh

---

## 📖 Learn More

- **Implementation Details:** See `final_implementation_report.md`
- **Technical Walkthrough:** See `file_mgmt_walkthrough.md`
- **API Documentation:** See API endpoints section above

---

## 🤝 Contributing

When adding features:
1. Follow POO principles (Single Responsibility)
2. Add bilingual documentation (EN + PT-BR)
3. Write tests for new functionality
4. Update this README

---

## 📝 License

MIT License - See project LICENSE file

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** 2026-01-05
