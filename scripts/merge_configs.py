#!/usr/bin/env python3
"""
Config Merge Utility for HexAgentGUI
Intelligently merges template configs with user configs
Preserves user customizations while adding new variables
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime

def merge_json(template, user):
    """
    Recursively merge template into user config
    - Preserves user values
    - Adds new template keys
    - Returns merged result
    """
    if isinstance(template, dict) and isinstance(user, dict):
        merged = user.copy()
        for key, value in template.items():
            if key not in merged:
                # New key from template - add it
                merged[key] = value
            elif isinstance(value, dict) and isinstance(merged[key], dict):
                # Recurse into nested dicts
                merged[key] = merge_json(value, merged[key])
            # else: keep user's value
        return merged
    else:
        # Not both dicts - keep user value
        return user

def main():
    if len(sys.argv) != 3:
        print("Usage: merge_configs.py <template_dir> <user_dir>")
        sys.exit(1)
    
    template_root = Path(sys.argv[1])
    user_root = Path(sys.argv[2])
    
    # Create backup
    backup_dir = user_root.parent / f"config.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    if user_root.exists():
        import shutil
        shutil.copytree(user_root, backup_dir)
        print(f"✓ Backup created: {backup_dir}")
    
    changes = []
    
    # Process all JSON files in template
    for template_file in template_root.rglob('*.json'):
        relative = template_file.relative_to(template_root)
        user_file = user_root / relative
        
        with open(template_file) as f:
            template_data = json.load(f)
        
        if user_file.exists():
            # Merge with existing user config
            with open(user_file) as f:
                user_data = json.load(f)
            
            merged = merge_json(template_data, user_data)
            
            # Check if anything changed
            if merged != user_data:
                changes.append(str(relative))
        else:
            # New file - just copy template
            user_file.parent.mkdir(parents=True, exist_ok=True)
            merged = template_data
            changes.append(f"{relative} (NEW)")
        
        # Write merged config
        with open(user_file, 'w') as f:
            json.dump(merged, f, indent=2)
    
    # Report
    if changes:
        print(f"✓ Updated {len(changes)} config file(s):")
        for change in changes:
            print(f"  - {change}")
    else:
        print("✓ All configs up to date")

if __name__ == '__main__':
    main()
