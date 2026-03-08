#!/bin/bash
# Script to replace console statements with Logger calls in App.jsx
# Script para substituir declarações console por chamadas Logger em App.jsx

FILE="/home/d4r13n/iatools/HexAgentGUI/src/App.jsx"
BACKUP="/home/d4r13n/iatools/HexAgentGUI/src/App.jsx.backup_logger"

# Create backup / Criar backup
cp "$FILE" "$BACKUP"

echo "Substituindo console statements por Logger..."
echo "Backup criado em: $BACKUP"

# Replace console.error with logger.error
# Substituir console.error por logger.error
sed -i 's/console\.error(\x27\[\([^]]*\)\] \([^'"'"']*\)\x27, \([^)]*\));/logger.error("\2", { component: "\1", data: \3 });/g' "$FILE"
sed -i 's/console\.error(\x27\[\([^]]*\)\] \([^'"'"']*\)\x27);/logger.error("\2", { component: "\1" });/g' "$FILE"
sed -i 's/console\.error(\([^)]*\));/logger.error("Error occurred", { error: \1 });/g' "$FILE"

# Replace console.log with logger.debug or logger.info
# Substituir console.log por logger.debug ou logger.info
sed -i 's/console\.log(\x27\[DEBUG\] \([^'"'"']*\)\x27, \([^)]*\));/logger.debug("\1", \2);/g' "$FILE"
sed -i 's/console\.log(\x27\[\([^]]*\)\] \([^'"'"']*\)\x27, \([^)]*\));/logger.debug("\2", { component: "\1", data: \3 });/g' "$FILE"
sed -i 's/console\.log(\x27\[\([^]]*\)\] \([^'"'"']*\)\x27);/logger.info("\2", { component: "\1" });/g' "$FILE"
sed -i 's/console\.log(\x27\([^'"'"']*\)\x27);/logger.info("\1");/g' "$FILE"

# Replace console.warn with logger.warn
# Substituir console.warn por logger.warn  
sed -i 's/console\.warn(\x27\[\([^]]*\)\] \([^'"'"']*\)\x27, \([^)]*\));/logger.warn("\2", { component: "\1", data: \3 });/g' "$FILE"
sed -i 's/console\.warn(\x27\[\([^]]*\)\] \([^'"'"']*\)\x27);/logger.warn("\2", { component: "\1" });/g' "$FILE"

echo "✅ Substituição concluída!"
echo "Verifique o arquivo e compare com o backup se necessário."
echo ""
echo "Total de console.* antes:"
grep -c "console\." "$BACKUP" || echo "0"
echo "Total de console.* depois:"
grep -c "console\." "$FILE" || echo "0"
