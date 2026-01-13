# App.jsx Complete Integration Guide
# Guia Completo de Integração App.jsx

**Date:** 2026-01-12 20:48  
**Approach:** Methodical, Following POO Patterns  
**Status:** EXECUTION READY

---

## 🏗️ ARCHITECTURE ANALYSIS

### Existing POO Patterns in Project:

**1. Singleton Services:**
```javascript
// Pattern used in SessionService.js, APIClient.js
static #instance = null;
static getInstance() {
  if (!this.#instance) {
    this.#instance = new ClassName();
  }
  return this.#instance;
}
```

**2. Service Usage in App.jsx:**
```javascript
// Line ~429-431 (ALREADY EXISTS)
const api = APIClient.getInstance();
const sessionService = SessionService.getInstance();
const chatService = ChatService.getInstance(); // ✅ ADDED
```

**3. React Hooks for Lifecycle:**
```javascript
// Used throughout App.jsx for effects, state management
useEffect(() => {
  // Setup
  return () => {
    // Cleanup
  };
}, [dependencies]);
```

---

## 📋 STEP-BY-STEP INTEGRATION

### STEP 1: Setup ChatService Event Handlers ✅

**Location:** After line ~756 (after initialize useEffect)

**Code to ADD:**
```javascript
  // ========================================================================
  // ChatService SSE Event Handlers Setup
  // Configuração de Event Handlers SSE do ChatService
  // ========================================================================
  
  useEffect(() => {
    // Setup ChatService event listeners / Configurar event listeners do ChatService
    logger.info('Setting up ChatService event handlers');

    // Handle incoming message chunks / Tratar chunks de mensagem recebidos
    const unsubMessage = chatService.onMessage((chunk) => {
      const { type, content, metadata } = chunk;

      switch (type) {
        case 'text':
          // Append AI text to last block or create new block
          // Adicionar texto IA ao último bloco ou criar novo bloco
          setBlocks(prev => {
            const lastBlock = prev[prev.length - 1];
            
            if (lastBlock && lastBlock.type === 'agent' && !lastBlock.completed) {
              // Append to existing AI block / Adicionar ao bloco IA existente
              return prev.map((block, idx) => 
                idx === prev.length - 1
                  ? { ...block, content: block.content + content }
                  : block
              );
            } else {
              // Create new AI block / Criar novo bloco IA
              return [...prev, {
                id: Date.now(),
                type: 'agent',
                content: content,
                timestamp: new Date().toLocaleTimeString(),
                completed: false
              }];
            }
          });
          break;

        case 'command_proposal':
          // Add command proposal block / Adicionar bloco de proposta de comando
          setBlocks(prev => [...prev, {
            id: Date.now(),
            type: 'command_proposal',
            content: content,
            metadata: metadata,
            timestamp: new Date().toLocaleTimeString()
          }]);
          break;

        case 'command_result':
          // Add command result block / Adicionar bloco de resultado de comando
          setBlocks(prev => [...prev, {
            id: Date.now(),
            type: 'output',
            content: content,
            result: metadata.success ? 'success' : 'error',
            metadata: metadata,
            timestamp: new Date().toLocaleTimeString()
          }]);
          break;

        default:
          logger.warn('Unknown chunk type:', type);
      }
    });

    // Handle errors / Tratar erros
    const unsubError = chatService.onError((error) => {
      logger.error('ChatService error:', error);
      
      setBlocks(prev => [...prev, {
        id: Date.now(),
        type: 'agent',
        content: `⚠️ Error: ${error.message}`,
        timestamp: new Date().toLocaleTimeString(),
        completed: true,
        error: true
      }]);
      
      setLoading(false);
    });

    // Handle completion / Tratar conclusão
    const unsubComplete = chatService.onComplete((metadata) => {
      logger.info('ChatService streaming complete:', metadata);
      
      // Mark last AI block as completed / Marcar último bloco IA como completo
      setBlocks(prev => prev.map((block, idx) => 
        idx === prev.length - 1 && block.type === 'agent'
          ? { ...block, completed: true }
          : block
      ));
      
      setLoading(false);
    });

    // Cleanup on unmount / Limpar ao desmontar
    return () => {
      unsubMessage();
      unsubError();
      unsubComplete();
      logger.info('ChatService event handlers cleaned up');
    };
  }, []); // Empty deps - setup once / Deps vazias - configurar uma vez
```

**Validation:** Check that event handlers are properly set up

---

### STEP 2: Create Helper Function - getContext()

**Location:** Inside App component, before handleSubmit (~line 1120)

**Code to ADD:**
```javascript
  // ========================================================================
  // Helper: Get conversation context for AI
  // Helper: Obter contexto de conversa para IA
  // ========================================================================
  
  const getContext = () => {
    // Get last 5 messages for context (user + agent blocks)
    // Obter últimas 5 mensagens para contexto (blocos user + agent)
    return blocks
      .filter(block => block.type === 'user' || block.type === 'agent')
      .slice(-5)
      .map(block => ({
        role: block.type === 'user' ? 'user' : 'assistant',
        content: block.content
      }));
  };
```

**Validation:** Verify function returns array of {role, content} objects

---

### STEP 3: Replace handleSubmit Logic

**Location:** Line ~1126 (handleSubmit function)

**CURRENT CODE (to identify):**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!input.trim()) return;
  // ... lots of logic ...
```

**STRATEGY:** Keep validation logic, replace AI call at the end

**Find this section (~line 1220-1320):**
```javascript
    // Call backend /chat endpoint with correct payload format
    // Chamar endpoint /chat do backend com formato correto de payload
    try {
      const response = await fetch(api.baseURL + '/chat', {
        method: 'POST',
        // ... fetch logic ...
```

**REPLACE with:**
```javascript
    // Call ChatService with SSE streaming
    // Chamar ChatService com streaming SSE
    try {
      await chatService.sendMessage(cmd, getContext(), {
        autoExecute: aiConfig?.ai?.auto_execute || false,
        maxIterations: unlimitedIterations ? 999 : maxIterations,
        stream: true
      });
      
      // Loading will be set to false by onComplete handler
      // Loading será definido como false pelo handler onComplete
      
    } catch (error) {
      logger.error('Chat submission error:', error);
      setBlocks(prev => [...prev, {
        id: Date.now(),
        type: 'agent',
        content: `Failed to send message: ${error.message}`,
        timestamp: new Date().toLocaleTimeString(),
        error: true
      }]);
      setLoading(false);
    }
```

**Validation:** Test that chat messages trigger SSE streaming

---

### STEP 4: Replace handleContinue Logic

**Location:** Line ~887 (handleContinue function)

**Find the fetch section (~line 916-990):**
```javascript
    try {
      const response = await fetch(api.baseURL + '/chat', {
        method: 'POST',
        // ... fetch logic ...
```

**REPLACE with:**
```javascript
    try {
      await chatService.sendMessage(msg, getContext(), {
        autoExecute: aiConfig?.ai?.auto_execute || false,
        maxIterations: unlimitedIterations ? 999 : maxIters,
        stream: true
      });
      
      // Loading will be set to false by onComplete handler
      // Loading será definido como false pelo handler onComplete
      
    } catch (error) {
      logger.error('Continue error:', error);
      setBlocks(prev => [...prev, {
        id: Date.now(),
        type: 'agent',
        content: `Failed to continue: ${error.message}`,
        timestamp: new Date().toLocaleTimeString(),
        error: true
      }]);
      setLoading(false);
    }
```

**Validation:** Test that continue command works with SSE

---

### STEP 5: Add CommandProposal Rendering

**Location:** Inside the block rendering section (~line 1550-1700)

**Find the block map/render section:**
```javascript
{blocks.map((block, blockIndex) => {
  // ... existing block rendering ...
```

**ADD before the closing of block rendering:**
```javascript
          {/* Command Proposal Block / Bloco de Proposta de Comando */}
          {block.type === 'command_proposal' && (
            <CommandProposal
              command={block.content}
              metadata={block.metadata}
              onApprove={() => handleCommandApprove(block)}
              onReject={() => handleCommandReject(block)}
            />
          )}
```

**Validation:** CommandProposal component renders for command_proposal blocks

---

### STEP 6: Add Command Handlers

**Location:** After handleExecuteProposal (~line 1366)

**Code to ADD:**
```javascript
  // ========================================================================
  // Command Proposal Handlers (for SSE proposed commands)
  // Handlers de Proposta de Comando (para comandos propostos via SSE)
  // ========================================================================
  
  const handleCommandApprove = async (block) => {
    logger.info('Command approved:', block.content);
    
    try {
      // Send execution request to backend
      // Enviar requisição de execução ao backend
      setBlocks(prev => prev.map(b => 
        b.id === block.id 
          ? { ...b, metadata: { ...b.metadata, approved: true, executing: true } }
          : b
      ));
      
      const result = await api.post('/execute', {
        command: block.content
      });
      
      // Add result block / Adicionar bloco de resultado
      setBlocks(prev => [...prev, {
        id: Date.now(),
        type: 'output',
        content: result.output || result.stdout || '',
        result: result.success ? 'success' : 'error',
        timestamp: new Date().toLocaleTimeString()
      }]);
      
    } catch (error) {
      logger.error('Command execution error:', error);
      setBlocks(prev => [...prev, {
        id: Date.now(),
        type: 'output',
        content: `Execution failed: ${error.message}`,
        result: 'error',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };
  
  const handleCommandReject = (block) => {
    logger.info('Command rejected:', block.content);
    
    // Mark as rejected / Marcar como rejeitado
    setBlocks(prev => prev.map(b => 
      b.id === block.id 
        ? { ...b, metadata: { ...b.metadata, rejected: true } }
        : b
    ));
  };
```

**Validation:** Approve/reject buttons work correctly

---

### STEP 7: Update stopGeneration

**Location:** Line ~580 (stopGeneration function)

**CURRENT:**
```javascript
const stopGeneration = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    // ...
  }
};
```

**ADD after abort call:**
```javascript
  // Also abort ChatService SSE connection / Também abortar conexão SSE do ChatService
  chatService.abortCurrentRequest();
```

**Validation:** Stop button cancels SSE streaming

---

## 🧹 CLEANUP TASKS

### TASK 1: Remove Old Fetch Code

After confirming SSE works, remove old fetch() implementations:
- Old handleSubmit fetch block (~line 1220-1320)
- Old handleContinue fetch block (~line 916-990)

**Note:** Keep this for last, after testing!

### TASK 2: Remove abortControllerRef if unused

If no other code uses abortControllerRef, it can be removed since ChatService handles abort.

---

## ✅ VALIDATION CHECKLIST

After each step:
- [ ] Code compiles without errors
- [ ] No TypeScript/ESLint errors
- [ ] React component renders
- [ ] Console has no errors

After complete integration:
- [ ] Chat messages trigger SSE
- [ ] AI responses stream character-by-character
- [ ] Command proposals appear
- [ ] Approve/reject buttons work
- [ ] Stop button cancels streaming
- [ ] No duplicate code remains

---

## 🚨 ROLLBACK PLAN

If anything breaks:
1. Git checkout App.jsx
2. Re-apply only Steps 1-2 (event handlers + helper)
3. Test incrementally

---

**Status:** Ready for execution  
**Next:** Execute Step 1
