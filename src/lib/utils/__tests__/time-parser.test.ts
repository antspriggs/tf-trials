import { describe, it, expect } from 'vitest';
import { parseTime, formatTime } from '../time-parser';

describe('parseTime', () => {
  it('parses mm:ss.xx format', () => {
    const result = parseTime('1:30.50');
    expect(result).toEqual({ raw: 90.5, display: '1:30.50' });
  });

  it('parses m:ss.xx format', () => {
    const result = parseTime('2:05.33');
    expect(result).toEqual({ raw: 125.33, display: '2:05.33' });
  });

  it('parses plain seconds with decimal', () => {
    const result = parseTime('11.45');
    expect(result).toEqual({ raw: 11.45, display: '11.45' });
  });

  it('parses plain integer seconds', () => {
    const result = parseTime('60');
    expect(result).toEqual({ raw: 60, display: '60' });
  });

  it('returns null for empty string', () => {
    expect(parseTime('')).toBeNull();
  });

  it('returns null for whitespace-only', () => {
    expect(parseTime('   ')).toBeNull();
  });

  it('returns null when seconds >= 60 in mm:ss format', () => {
    expect(parseTime('1:60.00')).toBeNull();
  });

  it('returns null for negative numbers', () => {
    expect(parseTime('-5')).toBeNull();
  });

  it('returns null for non-numeric input', () => {
    expect(parseTime('abc')).toBeNull();
  });

  it('trims whitespace before parsing', () => {
    const result = parseTime('  10.5  ');
    expect(result).toEqual({ raw: 10.5, display: '10.5' });
  });

  it('handles zero correctly', () => {
    const result = parseTime('0');
    expect(result).toEqual({ raw: 0, display: '0' });
  });

  it('handles multi-digit minutes', () => {
    const result = parseTime('12:30.00');
    expect(result).toEqual({ raw: 750, display: '12:30.00' });
  });
});

describe('formatTime', () => {
  it('formats seconds under 60 as plain number', () => {
    expect(formatTime(11.45)).toBe('11.45');
  });

  it('formats exactly 60 seconds as 1:00.00', () => {
    expect(formatTime(60)).toBe('1:00.00');
  });

  it('formats 90.5 seconds as 1:30.50', () => {
    expect(formatTime(90.5)).toBe('1:30.50');
  });

  it('pads seconds to 5 characters (2 digits, dot, 2 decimals)', () => {
    expect(formatTime(61)).toBe('1:01.00');
  });

  it('formats large times correctly', () => {
    expect(formatTime(750)).toBe('12:30.00');
  });

  it('removes trailing zeros for sub-60 times', () => {
    expect(formatTime(10)).toBe('10');
  });
});
