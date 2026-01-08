import { beforeEach, describe, expect, it } from 'vitest';
import ConfigManager from '../utils/ConfigManager';

describe('ConfigManager', () => {
  let configManager;

  beforeEach(() => {
    configManager = ConfigManager.getInstance();
  });

  it('should be a singleton', () => {
    const instance1 = ConfigManager.getInstance();
    const instance2 = ConfigManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should get and set config values', () => {
    configManager.set('test.key', 'value');
    expect(configManager.get('test.key')).toBe('value');
  });

  it('should support dot notation', () => {
    configManager.set('nested.deep.value', 123);
    expect(configManager.get('nested.deep.value')).toBe(123);
  });

  it('should notify observers on change', () => {
    let notified = false;
    const unsubscribe = configManager.subscribe('test', () => {
      notified = true;
    });
    
    configManager.set('test.value', 'changed');
    expect(notified).toBe(true);
    unsubscribe();
  });
});
