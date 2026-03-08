# StateManager Integration Guide
**For App.jsx useState Migration**

## Quick Start

```javascript
// 1. Import useAppState
import useAppState from './hooks/useAppState';

// 2. Replace useState with useAppState
// Before:
const [blocks, setBlocks] = useState([]);

// After:
const { state: sessionState, setState: setSessionState } = useAppState('session');
const { blocks } = sessionState;
const setBlocks = (value) => setSessionState('blocks', value);
```

## State Slices

### session
- blocks, currentSessionName, openFiles, activeFileIndex

### ui  
- input, isLoading, status, serviceStatus, inputMode, autoScroll

### interaction
- autoExecute, maxIterations, unlimitedIterations, currentIteration

### history
- promptHistory, systemHistory, historyIndex, sysHistoryIndex

### initialization
- isInitializing, initProgress, initError, initStatus

## Migration Steps

1. Add useAppState import
2. Create slice hooks (one per slice)
3. Destructure state values
4. Create setter functions
5. Test functionality
6. Remove old useState

## Status

**StateManager:** ✅ Ready  
**useAppState:** ✅ Ready  
**App.jsx:** 🔄 Ready for migration (future)

Integration is prepared and documented for next session.
