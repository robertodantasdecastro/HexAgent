import re

def split_commands_smart(code_block):
    """
    Smart command splitting that respects heredoc blocks
    Divisão inteligente de comandos que respeita blocos heredoc
    
    Handles:
    - cat > file << 'EOF' ... EOF
    - cat > file << EOF ... EOF  
    - cat > file <<-EOF ... EOF (with tab stripping)
    
    Returns list of commands where heredocs are kept as single commands
    """
    commands = []
    current_cmd = []
    in_heredoc = False
    heredoc_delimiter = None
    
    lines = code_block.split('\n')
    
    for line in lines:
        # Skip empty lines and comments when not in heredoc
        if not in_heredoc:
            if not line.strip() or line.strip().startswith('#'):
                continue
        
        # Check if starting heredoc
        if not in_heredoc and ('<<' in line):
            # Extract delimiter (e.g., 'EOF', "END", EOF)
            # Handles: << 'EOF', << "EOF", << EOF, <<-EOF
            match = re.search(r'<<-?\s*[\'"]?(\w+)[\'"]?', line)
            if match:
                heredoc_delimiter = match.group(1)
                in_heredoc = True
                current_cmd.append(line)
                continue
        
        # Check if ending heredoc
        if in_heredoc and line.strip() == heredoc_delimiter:
            current_cmd.append(line)
            # Save heredoc as single command
            commands.append('\n'.join(current_cmd))
            current_cmd = []
            in_heredoc = False
            heredoc_delimiter = None
            continue
        
        # Inside heredoc - accumulate all lines
        if in_heredoc:
            current_cmd.append(line)
            continue
        
        # Normal command (not in heredoc)
        if line.strip():
            commands.append(line.strip())
    
    # Handle any remaining  (incomplete heredoc)
    if current_cmd:
        commands.append('\n'.join(current_cmd))
    
    return commands


# Test cases
if __name__ == '__main__':
    # Test 1: Simple heredoc
    test1 = '''cat > ~/script/test.sh << 'EOF'
#!/bin/bash
echo "Hello World"
EOF'''
    
    result1 = split_commands_smart(test1)
    print("Test 1:", result1)
    assert len(result1) == 1, "Should be 1 command"
    assert 'EOF' in result1[0], "Should contain heredoc"
    
    # Test 2: Mixed commands
    test2 = '''mkdir -p ~/script
cat > ~/script/worknow.sh << 'EOF'
#!/bin/bash
case "$1" in
  start)
    echo "Starting"
    ;;
esac
EOF
chmod +x ~/script/worknow.sh'''
    
    result2 = split_commands_smart(test2)
    print("Test 2:", result2)
    assert len(result2) == 3, f"Should be 3 commands, got {len(result2)}"
    
    # Test 3: Comments
    test3 = '''# This is a comment
ls -la
# Another comment
pwd'''
    
    result3 = split_commands_smart(test3)
    print("Test 3:", result3)
    assert len(result3) == 2, "Should be 2 commands (comments excluded)"
    
    print("\n✅ All tests passed!")
