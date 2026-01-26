#!/bin/bash
# File Management System - End-to-End Test Script
# Script de Teste End-to-End do Sistema de Gerenciamento de Arquivos
#
# This script tests all file management features
# Este script testa todas as funcionalidades de gerenciamento de arquivos

set -e  # Exit on error

BASE_URL="http://localhost:5000"
TEST_DIR="/tmp/hexagent_test_$$"

echo "🧪 HexAgent File Management E2E Tests"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Test 1: File Write (new file)
info "Test 1: Writing new file..."
RESPONSE=$(curl -s -X POST "$BASE_URL/file/write" \
    -H "Content-Type: application/json" \
    -d '{
        "content": "#!/bin/bash\necho \"Hello World\"",
        "filename": "test_script.sh",
        "make_executable": true,
        "is_temp": false
    }')

if echo "$RESPONSE" | grep -q '"success": true'; then
    pass "File write successful"
    FILE_PATH=$(echo "$RESPONSE" | grep -o '"path": "[^"]*"' | cut -d'"' -f4)
    info "Created: $FILE_PATH"
else
    fail "File write failed: $RESPONSE"
fi

# Test 2: File Write (overwrite protection)
info "Test 2: Testing overwrite protection..."
RESPONSE=$(curl -s -X POST "$BASE_URL/file/write" \
    -H "Content-Type: application/json" \
    -d '{
        "content": "new content",
        "filename": "test_script.sh",
        "overwrite": false
    }')

if echo "$RESPONSE" | grep -q '"error": "file_exists"'; then
    pass "Overwrite protection working"
else
    fail "Overwrite protection failed: $RESPONSE"
fi

# Test 3: Get Diff
info "Test 3: Getting file diff..."
RESPONSE=$(curl -s -X POST "$BASE_URL/file/diff" \
    -H "Content-Type: application/json" \
    -d "{
        \"path\": \"$FILE_PATH\",
        \"content\": \"#!/bin/bash\necho 'Modified'\"
    }")

if echo "$RESPONSE" | grep -q '"has_changes": true'; then
    pass "Diff generation successful"
    ADDITIONS=$(echo "$RESPONSE" | grep -o '"additions": [0-9]*' | grep -o '[0-9]*')
    DELETIONS=$(echo "$RESPONSE" | grep -o '"deletions": [0-9]*' | grep -o '[0-9]*')
    info "Changes: +$ADDITIONS -$DELETIONS"
else
    fail "Diff generation failed: $RESPONSE"
fi

# Test 4: Force Overwrite
info "Test 4: Force overwriting file..."
RESPONSE=$(curl -s -X POST "$BASE_URL/file/write" \
    -H "Content-Type: application/json" \
    -d "{
        \"content\": \"#!/bin/bash\necho 'Updated'\",
        \"filename\": \"test_script.sh\",
        \"overwrite\": true
    }")

if echo "$RESPONSE" | grep -q '"success": true'; then
    pass "Force overwrite successful"
    BACKUP=$(echo "$RESPONSE" | grep -o '"backup": "[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$BACKUP" ]; then
        info "Backup created: $BACKUP"
    fi
else
    fail "Force overwrite failed: $RESPONSE"
fi

# Test 5: List Backups
info "Test 5: Listing backups..."
RESPONSE=$(curl -s "$BASE_URL/file/backups?filename=test_script.sh")

if echo "$RESPONSE" | grep -q '"count":'; then
    BACKUP_COUNT=$(echo "$RESPONSE" | grep -o '"count": [0-9]*' | grep -o '[0-9]*')
    pass "Backup listing successful ($BACKUP_COUNT backups)"
else
    fail "Backup listing failed: $RESPONSE"
fi

# Test 6: Create Project
info "Test 6: Creating multi-file project..."
RESPONSE=$(curl -s -X POST "$BASE_URL/project/create" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "test_project_'$$'",
        "description": "E2E test project",
        "files": [
            {
                "path": "main.py",
                "content": "print(\"Hello from main\")"
            },
            {
                "path": "utils/helper.py",
                "content": "def help():\n    pass"
            },
            {
                "path": "README.md",
                "content": "# Test Project"
            }
        ]
    }')

if echo "$RESPONSE" | grep -q '"success": true'; then
    pass "Project creation successful"
    PROJECT_PATH=$(echo "$RESPONSE" | grep -o '"project_path": "[^"]*"' | cut -d'"' -f4)
    info "Created: $PROJECT_PATH"
else
    fail "Project creation failed: $RESPONSE"
fi

# Test 7: List Projects
info "Test 7: Listing projects..."
RESPONSE=$(curl -s "$BASE_URL/project/list")

if echo "$RESPONSE" | grep -q "test_project_$$"; then
    PROJECT_COUNT=$(echo "$RESPONSE" | grep -o '"count": [0-9]*' | grep -o '[0-9]*')
    pass "Project listing successful ($PROJECT_COUNT projects)"
else
    fail "Project listing failed: $RESPONSE"
fi

# Test 8: Get Project Tree
info "Test 8: Getting project file tree..."
RESPONSE=$(curl -s "$BASE_URL/project/test_project_$$/tree")

if echo "$RESPONSE" | grep -q '"tree":'; then
    pass "File tree generation successful"
    if echo "$RESPONSE" | grep -q "main.py" && echo "$RESPONSE" | grep -q "helper.py"; then
        info "All files present in tree"
    fi
else
    fail "File tree generation failed: $RESPONSE"
fi

# Test 9: Read File
info "Test 9: Reading file..."
RESPONSE=$(curl -s -X POST "$BASE_URL/file/read" \
    -H "Content-Type: application/json" \
    -d "{\"path\": \"$FILE_PATH\"}")

if echo "$RESPONSE" | grep -q '"success": true'; then
    pass "File read successful"
    SIZE=$(echo "$RESPONSE" | grep -o '"size": [0-9]*' | grep -o '[0-9]*')
    info "File size: $SIZE bytes"
else
    fail "File read failed: $RESPONSE"
fi

# Test 10: Delete Project
info "Test 10: Deleting project (with backup)..."
RESPONSE=$(curl -s -X DELETE "$BASE_URL/project/test_project_$$?backup=true")

if echo "$RESPONSE" | grep -q '"success": true'; then
    pass "Project deletion successful"
    BACKUP=$(echo "$RESPONSE" | grep -o '"backup": "[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$BACKUP" ]; then
        info "Archive created: $BACKUP"
    fi
else
    fail "Project deletion failed: $RESPONSE"
fi

echo ""
echo "======================================"
echo -e "${GREEN}✓ All tests passed!${NC}"
echo "======================================"
echo ""
echo "Summary:"
echo "  - File write/read operations: ✓"
echo "  - Overwrite protection: ✓"
echo "  - Diff generation: ✓"
echo "  - Backup system: ✓"
echo "  - Project creation: ✓"
echo "  - File tree generation: ✓"
echo "  - Project deletion: ✓"
echo ""
echo "File Management System is fully operational! 🚀"
