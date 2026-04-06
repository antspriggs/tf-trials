import { describe, it, expect } from 'vitest';
import { parseDistance, formatDistance } from '../distance-parser';

describe('parseDistance', () => {
  it('parses dash format (18-6)', () => {
    const result = parseDistance('18-6');
    expect(result).not.toBeNull();
    expect(result!.raw).toBeCloseTo(18.5);
    expect(result!.display).toBe('18-6');
  });

  it('parses dash format with decimal inches (18-6.5)', () => {
    const result = parseDistance('18-6.5');
    expect(result).not.toBeNull();
    expect(result!.raw).toBeCloseTo(18 + 6.5 / 12);
  });

  it('parses feet-inches with quotes (5\'10")', () => {
    const result = parseDistance('5\'10"');
    expect(result).not.toBeNull();
    expect(result!.raw).toBeCloseTo(5 + 10 / 12);
  });

  it('parses feet-inches without closing quote (5\'10)', () => {
    const result = parseDistance("5'10");
    expect(result).not.toBeNull();
    expect(result!.raw).toBeCloseTo(5 + 10 / 12);
  });

  it('parses feet-inches with space (5\' 10")', () => {
    const result = parseDistance('5\' 10"');
    expect(result).not.toBeNull();
    expect(result!.raw).toBeCloseTo(5 + 10 / 12);
  });

  it('parses feet-only with apostrophe (5\')', () => {
    const result = parseDistance("5'");
    expect(result).not.toBeNull();
    expect(result!.raw).toBe(5);
  });

  it('parses meters (1.5m)', () => {
    const result = parseDistance('1.5m');
    expect(result).not.toBeNull();
    expect(result!.raw).toBeCloseTo(1.5 * 3.28084);
  });

  it('parses meters case-insensitive (2M)', () => {
    const result = parseDistance('2M');
    expect(result).not.toBeNull();
    expect(result!.raw).toBeCloseTo(2 * 3.28084);
  });

  it('parses plain number', () => {
    const result = parseDistance('18.5');
    expect(result).toEqual({ raw: 18.5, display: '18.5' });
  });

  it('returns null for empty string', () => {
    expect(parseDistance('')).toBeNull();
  });

  it('returns null for whitespace', () => {
    expect(parseDistance('   ')).toBeNull();
  });

  it('returns null for non-numeric input', () => {
    expect(parseDistance('abc')).toBeNull();
  });

  it('returns null for negative number', () => {
    expect(parseDistance('-5')).toBeNull();
  });
});

describe('formatDistance', () => {
  it('formats whole feet', () => {
    expect(formatDistance(5)).toBe("5'");
  });

  it('formats feet and inches', () => {
    expect(formatDistance(5.5)).toBe('5\' 6"');
  });

  it('formats with decimal inches', () => {
    const result = formatDistance(18 + 6.5 / 12);
    expect(result).toBe('18\' 6.5"');
  });

  it('rounds tiny remainders to whole feet', () => {
    // 5.004 feet -> inches = 0.048, which is < 0.05 threshold
    expect(formatDistance(5.004)).toBe("5'");
  });
});
