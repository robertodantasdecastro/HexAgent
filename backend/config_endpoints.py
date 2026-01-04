"""
New Config Management Endpoints for Phase 5
"""

# These will be inserted after line 613 in server.py

# Endpoint 1: Config Validation
@app.route('/config/validate', methods=['POST'])
def validate_config():
    """
    Validate configuration data against expected schema
    Expects JSON: { "type": "ai/models", "data": {...} }
    """
    try:
        req_data = request.json
        config_type = req_data.get('type')
        config_data = req_data.get('data')
        
        if not config_type or not config_data:
            return jsonify({"valid": False, "error": "Missing 'type' or 'data'"}), 400
        
        # Basic validation: check if it's valid JSON dict
        if not isinstance(config_data, dict):
            return jsonify({"valid": False, "error": "Config data must be a JSON object"}), 400
        
        # Type-specific validation could be added here
        # For now, basic validation passes
        return jsonify({"valid": True, "type": config_type})
        
    except Exception as e:
        return jsonify({"valid": False, "error": str(e)}), 500


# Endpoint 2: Config Merge
@app.route('/config/merge', methods=['POST'])
def merge_config():
    """
    Merge new config with existing user config
    Expects JSON: { "type": "ai/models", "data": {...} }
    """
    try:
        req_data = request.json
        config_type = req_data.get('type')
        new_data = req_data.get('data')
        
        if not config_type or not new_data:
            return jsonify({"success": False, "error": "Missing 'type' or 'data'"}), 400
        
        user_config_dir = os.path.join(home_dir, ".hexagent-gui", "config")
        config_file = os.path.join(user_config_dir, f"{config_type}.json")
        
        # Load existing config if exists
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                existing_data = json.load(f)
        else:
            existing_data = {}
        
        # Simple merge: update existing with new
        def deep_merge(base, updates):
            if isinstance(base, dict) and isinstance(updates, dict):
                for key, value in updates.items():
                    if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                        base[key] = deep_merge(base[key], value)
                    else:
                        base[key] = value
            return base
        
        merged = deep_merge(existing_data, new_data)
        
        # Save merged config
        os.makedirs(os.path.dirname(config_file), exist_ok=True)
        with open(config_file, 'w') as f:
            json.dump(merged, f, indent=2)
        
        return jsonify({"success": True, "merged": merged, "path": config_file})
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# Endpoint 3: List Backups
@app.route('/config/backup/list', methods=['GET'])
def list_backups():
    """
    List all available config backups
    Returns: [{"timestamp": "20260104_152542", "path": "..."}, ...]
    """
    try:
        backup_parent = os.path.join(home_dir, ".hexagent-gui")
        backups = []
        
        if os.path.exists(backup_parent):
            for item in os.listdir(backup_parent):
                if item.startswith("config.backup."):
                    timestamp = item.replace("config.backup.", "")
                    backup_path = os.path.join(backup_parent, item)
                    backups.append({
                        "timestamp": timestamp,
                        "path": backup_path,
                        "size": sum(os.path.getsize(os.path.join(backup_path, f)) 
                                  for f in os.listdir(backup_path) if os.path.isfile(os.path.join(backup_path, f)))
                    })
        
        # Sort by timestamp descending
        backups.sort(key=lambda x: x['timestamp'], reverse=True)
        return jsonify({"backups": backups})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Endpoint 4: Restore from Backup
@app.route('/config/backup/restore/<timestamp>', methods=['POST'])
def restore_backup(timestamp):
    """
    Restore configuration from a specific backup
    Creates new backup of current config before restoring
    """
    try:
        import shutil
        from datetime import datetime
        
        backup_dir = os.path.join(home_dir, ".hexagent-gui", f"config.backup.{timestamp}")
        current_config_dir = os.path.join(home_dir, ".hexagent-gui", "config")
        
        if not os.path.exists(backup_dir):
            return jsonify({"success": False, "error": f"Backup {timestamp} not found"}), 404
        
        # Create backup of current config first
        new_backup_timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        new_backup_dir = os.path.join(home_dir, ".hexagent-gui", f"config.backup.{new_backup_timestamp}")
        
        if os.path.exists(current_config_dir):
            shutil.copytree(current_config_dir, new_backup_dir)
        
        # Remove current config
        if os.path.exists(current_config_dir):
            shutil.rmtree(current_config_dir)
        
        # Restore from backup
        shutil.copytree(backup_dir, current_config_dir)
        
        return jsonify({
            "success": True,
            "restored_from": timestamp,
            "backup_created": new_backup_timestamp,
            "message": "Config restored successfully. Previous config backed up."
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
