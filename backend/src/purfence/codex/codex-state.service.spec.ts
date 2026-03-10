import { Test, TestingModule } from '@nestjs/testing';
import { StateService } from './codex-state.service';
import { StateData } from './types/state.types';

describe('StateService', () => {
  let service: StateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StateService],
    }).compile();

    service = module.get<StateService>(StateService);

    // Clear any existing states before each test
    service.clear();
  });

  afterEach(() => {
    // Cleanup after each test
    if (service) {
      service.clear();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set and get', () => {
    it('should store and retrieve state data', () => {
      const state = 'test-state-123';
      const data: StateData = {
        redirectUri: 'http://localhost:3000/oauth/callback',
        timestamp: Date.now(),
        provider: 'openai',
      };

      service.set(state, data);
      const retrieved = service.get(state);

      expect(retrieved).toBeDefined();
      expect(retrieved?.redirectUri).toBe(data.redirectUri);
      expect(retrieved?.provider).toBe(data.provider);
    });

    it('should remove state after retrieval (one-time use)', () => {
      const state = 'test-state-456';
      const data: StateData = {
        redirectUri: 'http://localhost:3000/oauth/callback',
        timestamp: Date.now(),
      };

      service.set(state, data);
      service.get(state);
      const retrievedAgain = service.get(state);

      expect(retrievedAgain).toBeNull(); // State should be removed after first get
    });

    it('should return null for non-existent state', () => {
      const result = service.get('non-existent-state');
      expect(result).toBeNull();
    });

    it('should return null for expired state', () => {
      const state = 'expired-state';
      const data: StateData = {
        redirectUri: 'http://localhost:3000/oauth/callback',
        timestamp: Date.now() - 11 * 60 * 1000, // 11 minutes ago (expired)
      };

      service.set(state, data);
      const result = service.get(state);

      expect(result).toBeNull();
    });
  });

  describe('validateWithRedirectUri', () => {
    it('should validate state with matching redirect URI', () => {
      const state = 'test-state-789';
      const redirectUri = 'http://localhost:3000/oauth/callback';
      const data: StateData = {
        redirectUri,
        timestamp: Date.now(),
      };

      service.set(state, data);
      const result = service.validateWithRedirectUri(state, redirectUri);

      expect(result).toBeDefined();
      expect(result?.redirectUri).toBe(redirectUri);
    });

    it('should return null for mismatched redirect URI', () => {
      const state = 'test-state-mismatch';
      const data: StateData = {
        redirectUri: 'http://localhost:3000/oauth/callback',
        timestamp: Date.now(),
      };

      service.set(state, data);
      const result = service.validateWithRedirectUri(
        state,
        'http://evil.com/callback',
      );

      expect(result).toBeNull();
    });

    it('should return null for non-existent state', () => {
      const result = service.validateWithRedirectUri(
        'non-existent',
        'http://localhost:3000/oauth/callback',
      );

      expect(result).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing state', () => {
      const state = 'existing-state';
      const data: StateData = {
        redirectUri: 'http://localhost:3000/oauth/callback',
        timestamp: Date.now(),
      };

      service.set(state, data);
      expect(service.has(state)).toBe(true);
    });

    it('should return false for non-existent state', () => {
      expect(service.has('non-existent')).toBe(false);
    });
  });

  describe('getCount', () => {
    it('should return zero initially', () => {
      expect(service.getCount()).toBe(0);
    });

    it('should return correct count after adding states', () => {
      service.set('state1', {
        redirectUri: 'http://localhost:3000/callback',
        timestamp: Date.now(),
      });
      service.set('state2', {
        redirectUri: 'http://localhost:3000/callback',
        timestamp: Date.now(),
      });

      expect(service.getCount()).toBe(2);
    });

    it('should decrease count after retrieving state', () => {
      const state = 'count-test';
      service.set(state, {
        redirectUri: 'http://localhost:3000/callback',
        timestamp: Date.now(),
      });

      expect(service.getCount()).toBe(1);
      service.get(state);
      expect(service.getCount()).toBe(0);
    });
  });

  describe('cleanExpiredStates', () => {
    it('should remove expired states', () => {
      const expiredState = 'expired';
      const validState = 'valid';

      service.set(expiredState, {
        redirectUri: 'http://localhost:3000/callback',
        timestamp: Date.now() - 11 * 60 * 1000, // 11 minutes ago
      });

      service.set(validState, {
        redirectUri: 'http://localhost:3000/callback',
        timestamp: Date.now(),
      });

      const cleaned = service.cleanExpiredStates();

      expect(cleaned).toBe(1);
      expect(service.has(expiredState)).toBe(false);
      expect(service.has(validState)).toBe(true);
    });

    it('should return zero when no expired states', () => {
      service.set('state1', {
        redirectUri: 'http://localhost:3000/callback',
        timestamp: Date.now(),
      });

      const cleaned = service.cleanExpiredStates();

      expect(cleaned).toBe(0);
      expect(service.getCount()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all states', () => {
      service.set('state1', {
        redirectUri: 'http://localhost:3000/callback',
        timestamp: Date.now(),
      });
      service.set('state2', {
        redirectUri: 'http://localhost:3000/callback',
        timestamp: Date.now(),
      });

      expect(service.getCount()).toBe(2);

      const cleared = service.clear();

      expect(cleared).toBe(2);
      expect(service.getCount()).toBe(0);
    });

    it('should return zero when no states', () => {
      const cleared = service.clear();
      expect(cleared).toBe(0);
    });
  });

  describe('configure', () => {
    it('should update expiry time', () => {
      service.configure({ expiryMs: 5000 });

      const state = 'test-expiry';
      service.set(state, {
        redirectUri: 'http://localhost:3000/callback',
        timestamp: Date.now() - 6000, // 6 seconds ago
      });

      const result = service.get(state);
      expect(result).toBeNull(); // Should be expired with new config
    });

    it('should update max states limit', () => {
      service.configure({ maxStates: 10 });

      // Add 10 states (at limit)
      for (let i = 0; i < 10; i++) {
        service.set(`state-${i}`, {
          redirectUri: 'http://localhost:3000/callback',
          timestamp: Date.now(),
        });
      }

      expect(service.getCount()).toBe(10);

      // Adding 11th state should trigger cleanup (removes oldest 10% = 1 state)
      service.set('state-10', {
        redirectUri: 'http://localhost:3000/callback',
        timestamp: Date.now(),
      });

      // After cleanup: 10 existing + 1 new - 1 oldest = 10
      expect(service.getCount()).toBe(10);
    });
  });

  describe('maximum states limit', () => {
    it('should enforce maximum states limit', () => {
      const defaultMaxStates = 1000;

      // Add many states
      for (let i = 0; i < defaultMaxStates + 10; i++) {
        service.set(`state-${i}`, {
          redirectUri: 'http://localhost:3000/callback',
          timestamp: Date.now(),
        });
      }

      // Should not exceed maximum
      expect(service.getCount()).toBeLessThanOrEqual(defaultMaxStates);
    });
  });

  describe('state data with metadata', () => {
    it('should store and retrieve state with metadata', () => {
      const state = 'metadata-test';
      const data: StateData = {
        redirectUri: 'http://localhost:3000/callback',
        timestamp: Date.now(),
        userId: 'user-123',
        provider: 'openai',
        metadata: {
          customField: 'custom-value',
          anotherField: 42,
        },
      };

      service.set(state, data);
      const retrieved = service.get(state);

      expect(retrieved).toBeDefined();
      expect(retrieved?.userId).toBe('user-123');
      expect(retrieved?.metadata?.customField).toBe('custom-value');
      expect(retrieved?.metadata?.anotherField).toBe(42);
    });
  });

  describe('concurrent state operations', () => {
    it('should handle multiple rapid state operations', () => {
      const operations = 100;
      const states: string[] = [];

      // Add many states rapidly
      for (let i = 0; i < operations; i++) {
        const state = `concurrent-${i}`;
        states.push(state);
        service.set(state, {
          redirectUri: 'http://localhost:3000/callback',
          timestamp: Date.now(),
        });
      }

      expect(service.getCount()).toBe(operations);

      // Retrieve all states
      let retrieved = 0;
      for (const state of states) {
        if (service.get(state)) {
          retrieved++;
        }
      }

      expect(retrieved).toBe(operations);
      expect(service.getCount()).toBe(0); // All should be removed
    });
  });
});
