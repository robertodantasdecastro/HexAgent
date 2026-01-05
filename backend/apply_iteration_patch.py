#!/usr/bin/env python3
"""
Apply iteration logic patch to server.py
Replaces iteration-based counting with action-based counting
"""

import re

def apply_patch():
    # Read original file
    with open('server.py', 'r') as f:
        content = f.read()
    
    # Backup
    with open('server.py.backup', 'w') as f:
        f.write(content)
    print("✅ Backup created: server.py.backup")
    
    # New iteration logic code
    new_logic = '''        # Track actions vs loops separately
        # Rastrear ações vs loops separadamente
        action_count = 0  # Actual commands executed / Comandos realmente executados
        loop_count = 0    # Internal safety counter / Contador interno de segurança
        max_actions = actual_limit  # User's action budget / Orçamento de ações do usuário
        max_loops = actual_limit * 3  # Safety limit / Limite de segurança
        conversation_history = user_input
        
        while action_count < max_actions and loop_count < max_loops:
            loop_count += 1
            
            # Step 1: Get AI response for current state
            full_response = ""
            for chunk in core.chat_step(conversation_history):
                full_response += chunk
                yield json.dumps({"chunk": chunk}) + "\\n"
            
            # Step 2: Parse bash code blocks from the response
            code_blocks = re.findall(r'```(?:bash)?\\n(.*?)\\n```', full_response, re.DOTALL)
            
            # If no commands found, AI decided task is complete or gave final answer
            if not code_blocks:
                # Check if AI explicitly says task is complete
                if any(phrase in full_response.lower() for phrase in ['tarefa concluída', 'completed', 'finalizado', 'pronto', 'done']):
                    yield json.dumps({"chunk": "\\n✅ Tarefa completada pelo agente!\\n"}) + "\\n"
                break
            
            # CHECK AUTO-EXECUTE: If False, yield proposal and stop
            if not auto_execute:
                 for cmd_block in code_blocks:
                     # Send proposal to frontend
                     yield json.dumps({"proposal": cmd_block}) + "\\n"
                 # Stop the loop here, waiting for user action on frontend
                 break

            # Step 3: Execute commands and collect results
            execution_summary = ""
            
            if core.body and code_blocks:
                # We have commands to execute - these count as actions
                for cmd_block in code_blocks:
                    commands = split_commands_smart(cmd_block)
                    
                    for cmd in commands:
                        action_count += 1  # Increment action counter
                        
                        # Command header with context
                        cmd_header = f"\\n{'='*70}\\n"
                        cmd_header += f"📌 AÇÃO {action_count}/{max_actions} (Loop {loop_count})\\n"
                        cmd_header += f"{'='*70}\\n"
                        cmd_header += f"🔧 Executando: {cmd}\\n"
                        cmd_header += f"{'-'*70}\\n"
                        
                        yield json.dumps({"chunk": cmd_header}) + "\\n"
                        
                        # Execute command
                        result = core.execute_tool(cmd)
                        
                        # Output with clear attribution
                        output_block = f"\\n📤 SAÍDA:\\n{result}\\n"
                        output_block += f"{'='*70}\\n\\n"
                        
                        yield json.dumps({"chunk": output_block}) + "\\n"
                        
                        # Add to execution summary for AI feedback (truncated)
                        execution_summary += f"\\n[Ação {action_count}]: {cmd}\\n"
                        execution_summary += f"[Resultado]: {result[:200]}{'...' if len(result) > 200 else ''}\\n"
                        
                        # Check if we hit action limit mid-command-block
                        if action_count >= max_actions:
                            break
                    
                    # Break outer loop if limit reached
                    if action_count >= max_actions:
                        break
            elif not code_blocks:
                # No commands in this iteration - pure thinking, doesn't count as action
                yield json.dumps({"chunk": "\\n💭 [Thinking - não conta como ação]\\n\\n"}) + "\\n"
            else:
                yield json.dumps({"chunk": "\\n⚠️ HexStrike offline - comandos não executados\\n"}) + "\\n"
                break
            
            # Step 4: Prepare feedback for next iteration (if continuing)
            if execution_summary:
                conversation_history = f"""{user_input}

[Histórico de Execução - Loop {loop_count}, Ações usadas: {action_count}/{max_actions}]:
{execution_summary}

Analise os resultados acima. Se a tarefa original ainda não está completa, sugira o PRÓXIMO comando necessário. Se a tarefa está completa, responda 'Tarefa concluída' e resuma o que foi feito."""
        
        # Loop ended - check why
        if action_count >= max_actions:
            yield json.dumps({"chunk": f"\\n⚠️ Limite de {max_actions} ações atingido.\\n"}) + "\\n"
            yield json.dumps({
                "limit_reached": True, 
                "actions_used": action_count,
                "loops_used": loop_count,
                "max_actions": max_actions
            }) + "\\n"
        elif loop_count >= max_loops:
            yield json.dumps({"chunk": f"\\n⚠️ Limite de segurança de {max_loops} loops atingido.\\n"}) + "\\n"
            yield json.dumps({
                "limit_reached": True,
                "actions_used": action_count, 
                "loops_used": loop_count,
                "reason": "safety_limit"
            }) + "\\n"'''
    
    # Pattern to find and replace the old iteration logic
    # From "iteration = 0" to the "limit_reached" event
    pattern = r'(        iteration = 0\s+conversation_history = user_input\s+while iteration < actual_limit:.*?yield json\.dumps\(\{\"limit_reached\": True, \"iterations\": actual_limit\}\) \+ \"\\n\")'
    
    # Try to find the pattern
    if re.search(pattern, content, re.DOTALL):
        new_content = re.sub(pattern, new_logic, content, count=1, flags=re.DOTALL)
        
        # Write the modified content
        with open('server.py', 'w') as f:
            f.write(new_content)
        
        print("✅ Patch applied successfully!")
        print("📝 Changes:")
        print("   - iteration → action_count")
        print("   - Added loop_count for safety")
        print("   - Thinking doesn't count as action")
        print("   - Added command context headers")
        return True
    else:
        print("❌ Could not find the pattern to replace")
        print("Will try manual line-based replacement...")
        return False

if __name__ == '__main__':
    apply_patch()
