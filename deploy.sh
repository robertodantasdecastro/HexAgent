#!/bin/bash
# HexAgentGUI - Production Deployment Script
# Script de Deploy para Produção (Standalone App)

set -e

echo "🚀 HexAgentGUI Standalone Deployment"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Must run from HexAgentGUI directory${NC}"
  exit 1
fi

echo -e "${BLUE}📦 Building standalone application...${NC}"

# Clean previous builds
if [ -d "dist" ]; then
  echo "Cleaning previous builds..."
  rm -rf dist
fi

# Build
echo -e "${BLUE}🔨 Running production build...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build failed. Deployment aborted.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Package with Electron Builder
echo -e "${BLUE}📦 Packaging Electron app...${NC}"
npx electron-builder --linux --x64 --arm64

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Packaging failed.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Packaging complete${NC}"
echo ""

# Show output
echo -e "${BLUE}📂 Build artifacts:${NC}"
ls -lh dist/*.AppImage dist/*.deb 2>/dev/null || echo "  (Check dist/ directory)"
echo ""

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Next Steps:${NC}"
echo ""
echo "1. Test the packaged application:"
echo "   ./dist/linux-unpacked/hexagent-gui"
echo ""
echo "2. Install system-wide (optional):"
echo "   sudo dpkg -i dist/*.deb"
echo "   # or"
echo "   chmod +x dist/*.AppImage && sudo mv dist/*.AppImage /opt/"
echo ""
echo "3. Deploy to users:"
echo "   - Distribute .AppImage (portable)"
echo "   - Distribute .deb (Debian/Ubuntu)"
echo ""
echo "4. Configure production environment:"
echo "   - Set up SSL certificates"
echo "   - Configure firewall rules"
echo "   - Set up monitoring/logging"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}🎉 HexAgentGUI is now STANDALONE!${NC}"
echo "   ✅ No external dependencies required"
echo "   ✅ Backend and frontend bundled together"
echo "   ✅ Ready for distribution"
echo ""

