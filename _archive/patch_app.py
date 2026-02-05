#!/usr/bin/env python3
"""
Patch App.jsx to integrate LoadingScreen
Integra LoadingScreen no App.jsx
"""

import re

# Read the current App.jsx
with open('/home/d4r13n/iatools/HexAgentGUI/src/App.jsx', 'r') as f:
    content = f.read()

# Find the return statement and add LoadingScreen conditional render
# Look for "  return (" at the beginning of the main return
return_pattern = r'(  const handleSubmit[\s\S]*?  };\n\n)(  return \()'

replacement = r'''\1  // Show LoadingScreen during initialization
  if (isInitializing) {
    return (
      <LoadingScreen
        initStatus={initStatus}
        progress={initProgress}
        error={initError}
        onRetry={() => window.location.reload()}
        onContinue={() => setIsInitializing(false)}
      />
    );
  }

\2'''

content = re.sub(return_pattern, replacement, content)

# Now add initialization tracking to the useEffect
# Find the initialize function and replace it with tracking version
init_pattern = r'(    const initialize = async \(\) => \{[\s\S]*?    \};)'

replacement_init = '''    const initialize = async () => {
        try {
            // Step 1: Backend
            setInitStatus(prev => ({ ...prev, backend: { status: 'loading', message: 'Starting Flask...' }}));
            setInitProgress(10);
            
            const backendReady = await waitForBackend();
            if (!backendReady) {
                throw new Error('Backend failed to start');
            }
            setInitStatus(prev => ({ ...prev, backend: { status: 'success', message: 'Running' }}));
            setInitProgress(25);
            
            // Step 2: Brain
            setInitStatus(prev => ({ ...prev, brain: { status: 'loading', message: 'Loading Brain...' }}));
            setInitProgress(40);
            
            const initResult = await initBackend();
            if (!initResult) {
                setInitStatus(prev => ({ ...prev, brain: { status: 'error', message: 'Failed' }}));
                throw new Error('Brain init failed');
            }
            setInitStatus(prev => ({ ...prev, brain: { status: 'success', message: 'Loaded' }}));
            setInitProgress(60);
            
            // Step 3: Config
            setInitStatus(prev => ({ ...prev, config: { status: 'loading', message: 'Loading...' }}));
            setInitProgress(75);
            
            await loadConfig();
            setInitStatus(prev => ({ ...prev, config: { status: 'success', message: 'Loaded' }}));
            setInitProgress(85);
            
            // Step 4: HexStrike
            setInitStatus(prev => ({ ...prev, hexstrike: { status: 'loading', message: 'Checking...' }}));
            setInitProgress(90);
            
            await checkStatus();
            setInitStatus(prev => ({ ...prev, hexstrike: { status: 'pending', message: 'Offline' }}));
            setInitProgress(100);
            
            // Success - hide loading screen
            setTimeout(() => setIsInitializing(false), 500);
            intervalId = setInterval(checkStatus, 5000);
            
        } catch (error) {
            console.error('[Init] Error:', error);
            setInitError({ message: error.message });
        }
    };'''

content = re.sub(init_pattern, replacement_init, content)

# Write the modified content
with open('/home/d4r13n/iatools/HexAgentGUI/src/App.jsx', 'w') as f:
    f.write(content)

print("✅ App.jsx patched successfully!")
print("   - Added LoadingScreen conditional render")
print("   - Added initialization tracking logic")
