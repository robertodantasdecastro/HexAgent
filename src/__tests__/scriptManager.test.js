/**
 * ScriptManager Unit Tests
 * Testes Unitários do ScriptManager
 * 
 * @jest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import APIClient from '../utils/APIClient';
import ScriptManager from '../utils/scriptManager';

describe('ScriptManager', () => {
  let scriptManager;
  let mockApi;

  beforeEach(() => {
    // Get singleton instance / Obter instância singleton
    scriptManager = ScriptManager.getInstance();
    
    // Mock APIClient / Mockar APIClient
    mockApi = APIClient.getInstance();
    jest.spyOn(mockApi, 'post');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple getInstance() calls', () => {
      const instance1 = ScriptManager.getInstance();
      const instance2 = ScriptManager.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(ScriptManager);
    });

    it('should throw error when trying to instantiate directly', () => {
      expect(() => {
        new ScriptManager();
      }).toThrow('ScriptManager is a singleton');
    });
  });

  describe('saveScript()', () => {
    it('should call APIClient with correct endpoint and payload', async () => {
      const testPath = '/home/user/test.sh';
      const testContent = '#!/bin/bash\necho "Hello World"';
      const makeExecutable = true;

      mockApi.post.mockResolvedValue({ success: true, path: testPath });

      const result = await scriptManager.saveScript(testPath, testContent, makeExecutable);

      expect(mockApi.post).toHaveBeenCalledWith('/script/save', {
        path: testPath,
        content: testContent,
        make_executable: makeExecutable
      });
      
      expect(result).toEqual({ success: true, path: testPath });
    });

    it('should default makeExecutable to false', async () => {
      const testPath = '/test.sh';
     const testContent = 'echo "test"';

      mockApi.post.mockResolvedValue({ success: true });

      await scriptManager.saveScript(testPath, testContent);

      expect(mockApi.post).toHaveBeenCalledWith('/script/save', {
        path: testPath,
        content: testContent,
        make_executable: false
      });
    });

    it('should throw error on API failure', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));

      await expect(
        scriptManager.saveScript('/test.sh', 'content')
      ).rejects.toThrow('Failed to save script');
    });
  });

  describe('executeScript()', () => {
    it('should call APIClient with correct parameters', async () => {
      const testPath = '/home/user/script.sh';
      const testArgs = ['arg1', 'arg2'];
      const workingDir = '/home/user/project';

      mockApi.post.mockResolvedValue({
        stdout: 'Success',
        stderr: '',
        exit_code: 0
      });

      const result = await scriptManager.executeScript(testPath, testArgs, workingDir);

      expect(mockApi.post).toHaveBeenCalledWith('/script/execute', {
        path: testPath,
        args: testArgs,
        working_dir: workingDir
      });

      expect(result).toEqual({
        stdout: 'Success',
        stderr: '',
        exit_code: 0
      });
    });

    it('should use empty array for args if not provided', async () => {
      mockApi.post.mockResolvedValue({ exit_code: 0 });

      await scriptManager.executeScript('/test.sh');

      expect(mockApi.post).toHaveBeenCalledWith('/script/execute', {
        path: '/test.sh',
        args: [],
        working_dir: null
      });
    });

    it('should throw error on execution failure', async () => {
      mockApi.post.mockRejectedValue(new Error('Execution failed'));

      await expect(
        scriptManager.executeScript('/test.sh')
      ).rejects.toThrow('Failed to execute script');
    });
  });

  describe('debugScript()', () => {
    it('should call APIClient with debug endpoint', async () => {
      const testPath = '/debug.sh';
      const testArgs = ['--verbose'];

      mockApi.post.mockResolvedValue({
        stdout: 'Debug output',
        stderr: '',
        exit_code: 0
      });

      const result = await scriptManager.debugScript(testPath, testArgs);

      expect(mockApi.post).toHaveBeenCalledWith('/script/debug', {
        path: testPath,
        args: testArgs
      });

      expect(result.stdout).toBe('Debug output');
    });

    it('should default args to empty array', async () => {
      mockApi.post.mockResolvedValue({ exit_code: 0 });

      await scriptManager.debugScript('/test.sh');

      expect(mockApi.post).toHaveBeenCalledWith('/script/debug', {
        path: '/test.sh',
        args: []
      });
    });
  });

  describe('suggestPath()', () => {
    it('should return mentioned path if provided in context', () => {
      const context = { mentionedPath: '/explicit/path/script.sh' };
      
      const result = scriptManager.suggestPath('test.sh', context);
      
      expect(result).toBe('/explicit/path/script.sh');
    });

    it('should use project root if no mentioned path', () => {
      const context = { projectRoot: '/home/user/project' };
      
      const result = scriptManager.suggestPath('test.sh', context);
      
      expect(result).toBe('/home/user/project/test.sh');
    });

    it('should default to ~/scripts if no context', () => {
      const result = scriptManager.suggestPath('test.sh');
      
      expect(result).toBe('~/scripts/test.sh');
    });

    it('should handle empty context object', () => {
      const result = scriptManager.suggestPath('myfile.sh', {});
      
      expect(result).toBe('~/scripts/myfile.sh');
    });
  });

  describe('getExtension()', () => {
    it('should return file extension without dot', () => {
      expect(scriptManager.getExtension('test.sh')).toBe('sh');
      expect(scriptManager.getExtension('script.py')).toBe('py');
      expect(scriptManager.getExtension('file.txt')).toBe('txt');
    });

    it('should handle multiple dots', () => {
      expect(scriptManager.getExtension('archive.tar.gz')).toBe('gz');
      expect(scriptManager.getExtension('config.conf.bak')).toBe('bak');
    });

    it('should return empty string for no extension', () => {
      expect(scriptManager.getExtension('README')).toBe('');
      expect(scriptManager.getExtension('Makefile')).toBe('');
    });

    it('should handle filenames starting with dot', () => {
      expect(scriptManager.getExtension('.bashrc')).toBe('bashrc');
      expect(scriptManager.getExtension('.config')).toBe('config');
    });
  });

  describe('needsExecutePermission()', () => {
    it('should return true for scripts with shebang', () => {
      expect(scriptManager.needsExecutePermission('#!/bin/bash\necho "test"')).toBe(true);
      expect(scriptManager.needsExecutePermission('#!/usr/bin/env python3\nprint("test")')).toBe(true);
      expect(scriptManager.needsExecutePermission('#!/bin/sh\n')).toBe(true);
    });

    it('should return false for scripts without shebang', () => {
      expect(scriptManager.needsExecutePermission('echo "test"')).toBe(false);
      expect(scriptManager.needsExecutePermission('# Just a comment\necho "test"')).toBe(false);
    });

    it('should handle whitespace before shebang', () => {
      expect(scriptManager.needsExecutePermission('   #!/bin/bash\necho "test"')).toBe(false);
      expect(scriptManager.needsExecutePermission('\n#!/bin/bash')).toBe(false);
    });

    it('should trim content and check', () => {
      expect(scriptManager.needsExecutePermission('  \n  #!/bin/bash  ')).toBe(true);
    });

    it('should handle empty content', () => {
      expect(scriptManager.needsExecutePermission('')).toBe(false);
      expect(scriptManager.needsExecutePermission('   ')).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete save-execute workflow', async () => {
      const path = '/tmp/test.sh';
      const content = '#!/bin/bash\necho "Integration test"';

      // Mock save
      mockApi.post.mockResolvedValueOnce({ success: true, path });
      
      // Mock execute
      mockApi.post.mockResolvedValueOnce({
        stdout: 'Integration test\n',
        stderr: '',
        exit_code: 0
      });

      // Save script
      const saveResult = await scriptManager.saveScript(path, content, true);
      expect(saveResult.success).toBe(true);

      // Execute script
      const execResult = await scriptManager.executeScript(path);
      expect(execResult.exit_code).toBe(0);
      expect(execResult.stdout).toContain('Integration test');
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages', async () => {
      mockApi.post.mockRejectedValue(new Error('Connection refused'));

      await expect(
        scriptManager.saveScript('/test.sh', 'content')
      ).rejects.toThrow('Failed to save script: Connection refused');
    });

    it('should handle API errors gracefully', async () => {
      mockApi.post.mockRejectedValue(new Error('404 Not Found'));

      await expect(
        scriptManager.executeScript('/nonexistent.sh')
      ).rejects.toThrow('Failed to execute script');
    });
  });
});
