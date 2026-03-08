import sys
import os
import time
import threading

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.pty_service import PTYService

def test_pty_service():
    print("Testing PTYService...")
    
    service = PTYService()
    
    # Wait for PTY to initialize
    time.sleep(0.5)
    
    print(f"PID: {service.pid}")
    assert service.pid is not None
    assert service.master_fd is not None
    
    # Test Write (Input)
    print("Sending command: 'echo Hello_PTY'")
    service.write("echo Hello_PTY\n")
    
    # Test Read (Output)
    print("Reading output...")
    
    # Simple reader loop
    output_received = False
    start_time = time.time()
    
    # Use the generator
    gen = service.read_generator()
    
    try:
        while time.time() - start_time < 2.0:
            try:
                chunk = next(gen)
                if "Hello_PTY" in chunk:
                    print(f"✓ Found expected output: {chunk.strip()}")
                    output_received = True
                    break
                elif chunk:
                    print(f"  Received: {repr(chunk)}")
            except StopIteration:
                break
            except Exception as e:
                pass
                
    except Exception as e:
        print(f"Read error: {e}")
        
    if output_received:
        print("✓ PTY Read/Write success")
    else:
        print("✗ Failed to receive expected output")
        
    # Resize
    print("Testing Resize...")
    service.resize(100, 30)
    print("✓ Resize called without error")
    
    # Cleanup (Stop PTY)
    print("Stopping PTY...")
    service.stop_pty()
    print("✓ PTY Stopped")

if __name__ == "__main__":
    try:
        test_pty_service()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
