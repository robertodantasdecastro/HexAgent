#!/usr/bin/env python3
"""
Backend Chat Automated Tests
Testes Automatizados do Chat Backend

Runs comprehensive tests on /chat endpoint
Executa testes abrangentes no endpoint /chat

Usage: python3 test_backend_chat.py
"""

import requests
import json
import sys
import os
from datetime import datetime
from typing import Dict, Any, List, Tuple

# ANSI colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'

BASE_URL = "http://localhost:5000"

class TestResult:
    """Test result container"""
    def __init__(self, name: str, passed: bool, message: str, details: Any = None):
        self.name = name
        self.passed = passed
        self.message = message
        self.details = details
    
    def __str__(self):
        status = f"{GREEN}✅ PASS{RESET}" if self.passed else f"{RED}❌ FAIL{RESET}"
        return f"{status} - {self.name}: {self.message}"

class BackendChatTester:
    """Automated tester for backend chat endpoint"""
    
    def __init__(self):
        self.results: List[TestResult] = []
        self.api_key = os.getenv('OPENROUTER_API_KEY') or os.getenv('API_KEY')
        
    def print_header(self, text: str):
        """Print formatted header"""
        print(f"\n{BOLD}{BLUE}{'='*60}{RESET}")
        print(f"{BOLD}{BLUE}{text:^60}{RESET}")
        print(f"{BOLD}{BLUE}{'='*60}{RESET}\n")
    
    def print_test(self, test_num: int, name: str):
        """Print test start message"""
        print(f"{BOLD}[Test {test_num}]{RESET} {name}...", end=" ")
    
    def add_result(self, result: TestResult):
        """Add test result"""
        self.results.append(result)
        status = f"{GREEN}✅{RESET}" if result.passed else f"{RED}❌{RESET}"
        print(status)
        if not result.passed:
            print(f"  {RED}→ {result.message}{RESET}")
    
    def test_1_health_check(self) -> TestResult:
        """Test 1: Health endpoint"""
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') in ['ok', 'healthy', 'degraded']:
                    return TestResult(
                        "Health Check",
                        True,
                        f"Backend is {data.get('status')}",
                        data
                    )
            
            return TestResult(
                "Health Check",
                False,
                f"Unexpected response status: {data.get('status')} (Code: {response.status_code})",
                response.text
            )
            
        except requests.exceptions.ConnectionError:
            return TestResult(
                "Health Check",
                False,
                "Backend not running. Start with: hexagent-gui"
            )
        except Exception as e:
            return TestResult(
                "Health Check",
                False,
                f"Error: {str(e)}"
            )
    
    def test_2_chat_no_key(self) -> TestResult:
        """Test 2: Chat endpoint without API key"""
        try:
            # Temporarily save and remove key
            saved_key = self.api_key
            os.environ.pop('OPENROUTER_API_KEY', None)
            os.environ.pop('API_KEY', None)
            
            response = requests.post(
                f"{BASE_URL}/chat",
                json={
                    "prompt": "Hello, test", 
                    "stream": False
                },
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            # Restore key
            if saved_key:
                os.environ['OPENROUTER_API_KEY'] = saved_key
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('data', {}).get('standalone'):
                    return TestResult(
                        "No API Key (Standalone Mode)",
                        True,
                        "Returned helpful standalone message",
                        data
                    )
                else:
                    return TestResult(
                        "No API Key (Standalone Mode)",
                        False,
                        "Expected standalone mode response",
                        data
                    )
            else:
                return TestResult(
                    "No API Key (Standalone Mode)",
                    False,
                    f"Unexpected status code: {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            return TestResult(
                "No API Key (Standalone Mode)",
                False,
                f"Error: {str(e)}"
            )
    
    def test_3_chat_with_key(self) -> TestResult:
        """Test 3: Chat endpoint with API key"""
        if not self.api_key:
            return TestResult(
                "Chat with API Key",
                False,
                "Skipped: No API key configured. Set OPENROUTER_API_KEY environment variable."
            )
        
        try:
            # Ensure key is in environment
            os.environ['OPENROUTER_API_KEY'] = self.api_key
            
            response = requests.post(
                f"{BASE_URL}/chat",
                json={
                    "prompt": "Say hello in exactly one sentence.",
                    "context": [],
                    "stream": False
                },
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    ai_response = data.get('data', {}).get('response', '')
                    model = data.get('data', {}).get('model', 'unknown')
                    
                    if len(ai_response) > 10:  # Got a real response
                        return TestResult(
                            "Chat with API Key",
                            True,
                            f"AI responded: '{ai_response[:50]}...' (model: {model})",
                            data
                        )
                    else:
                        return TestResult(
                            "Chat with API Key",
                            False,
                            "Response too short or empty",
                            data
                        )
                else:
                    return TestResult(
                        "Chat with API Key",
                        False,
                        f"API error: {data.get('message', 'Unknown')}",
                        data
                    )
            else:
                return TestResult(
                    "Chat with API Key",
                    False,
                    f"HTTP {response.status_code}: {response.text[:100]}",
                    response.text
                )
                
        except requests.exceptions.Timeout:
            return TestResult(
                "Chat with API Key",
                False,
                "Request timed out (>30s)"
            )
        except Exception as e:
            return TestResult(
                "Chat with API Key",
                False,
                f"Error: {str(e)}"
            )
    
    def test_4_chat_with_context(self) -> TestResult:
        """Test 4: Chat with conversation context"""
        if not self.api_key:
            return TestResult(
                "Chat with Context",
                False,
                "Skipped: No API key configured"
            )
        
        try:
            os.environ['OPENROUTER_API_KEY'] = self.api_key
            
            response = requests.post(
                f"{BASE_URL}/chat",
                json={
                    "prompt": "What name did I just tell you?",
                    "context": [
                        {"role": "user", "content": "My name is Alice"},
                        {"role": "assistant", "content": "Hello Alice! Nice to meet you."}
                    ],
                    "stream": False
                },
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    ai_response = data.get('data', {}).get('response', '').lower()
                    
                    # Check if response mentions Alice
                    if 'alice' in ai_response:
                        return TestResult(
                            "Chat with Context",
                            True,
                            f"Correctly remembered context: '{ai_response[:60]}...'",
                            data
                        )
                    else:
                        return TestResult(
                            "Chat with Context",
                            False,
                            f"Did not use context properly. Response: '{ai_response[:60]}...'",
                            data
                        )
                else:
                    return TestResult(
                        "Chat with Context",
                        False,
                        f"API error: {data.get('message', 'Unknown')}",
                        data
                    )
            else:
                return TestResult(
                    "Chat with Context",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            return TestResult(
                "Chat with Context",
                False,
                f"Error: {str(e)}"
            )
    
    def test_5_invalid_request(self) -> TestResult:
        """Test 5: Invalid request (empty prompt)"""
        try:
            response = requests.post(
                f"{BASE_URL}/chat",
                json={"prompt": ""},  # Empty prompt
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code in [400, 422]:  # Bad request
                return TestResult(
                    "Invalid Request Handling",
                    True,
                    "Correctly rejected empty prompt",
                    response.json()
                )
            elif response.status_code == 200:
                data = response.json()
                if not data.get('success'):
                    return TestResult(
                        "Invalid Request Handling",
                        True,
                        "Returned error for empty prompt",
                        data
                    )
                else:
                    return TestResult(
                        "Invalid Request Handling",
                        False,
                        "Should reject empty prompt",
                        data
                    )
            else:
                return TestResult(
                    "Invalid Request Handling",
                    False,
                    f"Unexpected status: {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            return TestResult(
                "Invalid Request Handling",
                False,
                f"Error: {str(e)}"
            )
    
    def run_all_tests(self):
        """Run all tests and generate report"""
        self.print_header("BACKEND CHAT AUTOMATED TESTS")
        
        print(f"Base URL: {BASE_URL}")
        print(f"API Key: {'✅ Configured' if self.api_key else '❌ Not configured'}")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Run tests
        tests = [
            ("1", "Health Check", self.test_1_health_check),
            ("2", "Standalone Mode (No API Key)", self.test_2_chat_no_key),
            ("3", "Chat with API Key", self.test_3_chat_with_key),
            ("4", "Chat with Context", self.test_4_chat_with_context),
            ("5", "Invalid Request Handling", self.test_5_invalid_request),
        ]
        
        for num, name, test_func in tests:
            self.print_test(num, name)
            result = test_func()
            self.add_result(result)
        
        # Print summary
        self.print_summary()
        
        # Return exit code
        passed = sum(1 for r in self.results if r.passed)
        return 0 if passed == len(self.results) else 1
    
    def print_summary(self):
        """Print test summary"""
        self.print_header("TEST SUMMARY")
        
        passed = sum(1 for r in self.results if r.passed)
        total = len(self.results)
        percentage = (passed / total * 100) if total > 0 else 0
        
        print(f"Total Tests: {total}")
        print(f"Passed:      {GREEN}{passed}{RESET}")
        print(f"Failed:      {RED}{total - passed}{RESET}")
        print(f"Success Rate: {GREEN if percentage == 100 else YELLOW}{percentage:.1f}%{RESET}\n")
        
        if passed == total:
            print(f"{GREEN}{BOLD}✅ ALL TESTS PASSED!{RESET}")
            print(f"{GREEN}Backend chat is working correctly.{RESET}\n")
        else:
            print(f"{RED}{BOLD}❌ SOME TESTS FAILED{RESET}")
            print(f"{RED}Review failures above and fix issues.{RESET}\n")
            
            # Print failed tests
            failed = [r for r in self.results if not r.passed]
            if failed:
                print(f"{BOLD}Failed Tests:{RESET}")
                for r in failed:
                    print(f"  • {r.name}: {r.message}")
                print()
        
        # Print recommendations
        if not self.api_key:
            print(f"{YELLOW}ℹ️  Tip: Set OPENROUTER_API_KEY to run AI tests{RESET}")
            print(f"{YELLOW}   Get key at: https://openrouter.ai/keys{RESET}\n")

def main():
    """Main entry point"""
    tester = BackendChatTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
