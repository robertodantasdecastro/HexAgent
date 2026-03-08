
import unittest
from unittest.mock import MagicMock, ANY
import logging
from backend.core.orchestrator import AgentOrchestrator
from backend.core.command_executor import CommandExecutor
from backend.core.mcp_manager import MCPManager

# Configure logging to see orchestrator output
logging.basicConfig(level=logging.INFO)

class TestOrchestratorLoop(unittest.TestCase):
    def setUp(self):
        self.mock_provider = MagicMock()
        self.mock_executor = MagicMock()
        self.mock_mcp = MagicMock()
        self.orchestrator = AgentOrchestrator(self.mock_provider, self.mock_executor, self.mock_mcp)

    def test_step_by_step_execution_with_auto_execute(self):
        """
        Verify that when auto_execute is True, the Orchestrator:
        1. Truncates multiple commands to 1.
        2. Executes that 1 command.
        3. Breaks the inner loop to force re-evaluation (new iteration).
        """
        # Setup simulated AI responses
        # Iteration 1: AI proposes 2 commands (Discovery + Scan)
        # Iteration 2: AI proposes next command based on feedback (simulated)
        
        # We need to simulate the generator behavior of chat_step
        def chat_step_generator_1(*args, **kwargs):
            yield "To map the network, I will start by checking the IP.\n"
            yield "```bash\nifconfig\n```\n"
            yield "Then I will scan the subnet.\n"
            yield "```bash\nnmap 192.168.1.0/24\n```"

        def chat_step_generator_2(*args, **kwargs):
            yield "I see the IP is 10.0.0.1. Now scanning.\n"
            yield "```bash\nnmap 10.0.0.0/24\n```"
            
        # Configure provider to return different responses per call
        self.mock_provider.chat_step.side_effect = [chat_step_generator_1(), chat_step_generator_2()]
        
        # Configure executor to simulate success
        self.mock_executor.is_available.return_value = True
        self.mock_executor.execute_command.return_value = {
            "success": True, 
            "stdout": "inet 10.0.0.1", 
            "error": "", 
            "exit_code": 0
        }

        # Run process
        # We expect 2 iterations:
        # 1. AI generates ifconfig + nmap. Orchestrator executes ONLY ifconfig. Loops back.
        # 2. AI generates nmap 10.0.0.0. Orchestrator executes nmap.
        
        # We collect the yielded blocks to verify behavior
        blocks = list(self.orchestrator.process(
            user_input="Map network",
            auto_execute=True,
            max_iterations=2
        ))
        
        # VERIFICATIONS
        
        # 1. Verify Command Execution Count in Iteration 1
        # We should see execution of "ifconfig" but NOT "nmap 192.168.1.0/24" in the first pass
        executed_commands = [
            b['content']['command'] for b in blocks 
            if b['type'] == 'lifecycle' and b['event'] == 'block_start' and b['content'] == 'shell'
        ]
        
        # Note: block_start content for shell is {'command': '...'} but my mock extraction logic above is simplified
        # Let's look at the CommandExecutor mock calls instead, it's more reliable.
        
        self.assertEqual(self.mock_executor.execute_command.call_count, 2, "Should have executed exactly 2 commands total (1 per iteration)")
        
        # Check actual commands executed
        args_list = self.mock_executor.execute_command.call_args_list
        cmd1 = args_list[0][0][0]
        cmd2 = args_list[1][0][0]
        
        print(f"Command 1 Executed: {cmd1}")
        print(f"Command 2 Executed: {cmd2}")
        
        self.assertIn("ifconfig", cmd1)
        self.assertIn("nmap 10.0.0.0/24", cmd2)
        self.assertNotIn("nmap 192.168.1.0/24", cmd1, "Should NOT have executed the second pre-planned command from iteration 1")

if __name__ == '__main__':
    unittest.main()
