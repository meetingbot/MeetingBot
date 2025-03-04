import { describe, expect, it } from '@jest/globals';
import { extractCount } from '../../utils/database';

describe('Database Utils', () => {
  describe('extractCount', () => {
    it('should throw error when count result is undefined', () => {
      expect(() => extractCount(undefined)).toThrow('Database count result is missing or malformed');
    });

    it('should throw error when count result is an empty array', () => {
      expect(() => extractCount([])).toThrow('Database count result is missing or malformed');
    });

    it('should extract count from count result', () => {
      expect(extractCount([{ count: 5 }])).toBe(5);
    });

    it('should convert string count to number', () => {
      expect(extractCount([{ count: '10' }])).toBe(10);
    });

    it('should handle zero count', () => {
      expect(extractCount([{ count: 0 }])).toBe(0);
    });
  });
}); 