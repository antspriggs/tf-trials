import { describe, it, expect } from 'vitest';
import { determineQualification, parsePerformanceValue } from '../qualification';

describe('determineQualification', () => {
  describe('time events (lower is better)', () => {
    const timeEvent = {
      type: 'time' as const,
      auto_qualify: 11.0,
      prov_qualify: 11.5,
      auto_qualify_m: null,
      prov_qualify_m: null,
      auto_qualify_f: null,
      prov_qualify_f: null,
    };

    it('returns automatic when at or below auto threshold', () => {
      expect(determineQualification(10.5, timeEvent)).toBe('automatic');
      expect(determineQualification(11.0, timeEvent)).toBe('automatic');
    });

    it('returns provisional when between auto and prov thresholds', () => {
      expect(determineQualification(11.2, timeEvent)).toBe('provisional');
      expect(determineQualification(11.5, timeEvent)).toBe('provisional');
    });

    it('returns dnq when above provisional threshold', () => {
      expect(determineQualification(12.0, timeEvent)).toBe('dnq');
    });
  });

  describe('distance events (higher is better)', () => {
    const distEvent = {
      type: 'distance' as const,
      auto_qualify: 20.0,
      prov_qualify: 18.0,
      auto_qualify_m: null,
      prov_qualify_m: null,
      auto_qualify_f: null,
      prov_qualify_f: null,
    };

    it('returns automatic when at or above auto threshold', () => {
      expect(determineQualification(21.0, distEvent)).toBe('automatic');
      expect(determineQualification(20.0, distEvent)).toBe('automatic');
    });

    it('returns provisional when between prov and auto thresholds', () => {
      expect(determineQualification(19.0, distEvent)).toBe('provisional');
      expect(determineQualification(18.0, distEvent)).toBe('provisional');
    });

    it('returns dnq when below provisional threshold', () => {
      expect(determineQualification(17.0, distEvent)).toBe('dnq');
    });
  });

  describe('gender-specific thresholds', () => {
    const genderEvent = {
      type: 'time' as const,
      auto_qualify: 12.0,
      prov_qualify: 13.0,
      auto_qualify_m: 11.0,
      prov_qualify_m: 11.5,
      auto_qualify_f: 12.5,
      prov_qualify_f: 13.5,
    };

    it('uses male thresholds for gender M', () => {
      expect(determineQualification(10.5, genderEvent, 'M')).toBe('automatic');
      expect(determineQualification(11.2, genderEvent, 'M')).toBe('provisional');
      expect(determineQualification(12.0, genderEvent, 'M')).toBe('dnq');
    });

    it('uses female thresholds for gender F', () => {
      expect(determineQualification(12.0, genderEvent, 'F')).toBe('automatic');
      expect(determineQualification(13.0, genderEvent, 'F')).toBe('provisional');
      expect(determineQualification(14.0, genderEvent, 'F')).toBe('dnq');
    });

    it('uses neutral thresholds when no gender specified', () => {
      expect(determineQualification(11.5, genderEvent)).toBe('automatic');
      expect(determineQualification(12.5, genderEvent)).toBe('provisional');
      expect(determineQualification(14.0, genderEvent)).toBe('dnq');
    });
  });

  describe('fallback to neutral when gender-specific not set', () => {
    const partialEvent = {
      type: 'time' as const,
      auto_qualify: 12.0,
      prov_qualify: 13.0,
      auto_qualify_m: null,
      prov_qualify_m: null,
      auto_qualify_f: null,
      prov_qualify_f: null,
    };

    it('falls back to neutral for male', () => {
      expect(determineQualification(11.5, partialEvent, 'M')).toBe('automatic');
    });

    it('falls back to neutral for female', () => {
      expect(determineQualification(11.5, partialEvent, 'F')).toBe('automatic');
    });
  });

  describe('no standards set', () => {
    const noStandards = {
      type: 'time' as const,
      auto_qualify: null,
      prov_qualify: null,
      auto_qualify_m: null,
      prov_qualify_m: null,
      auto_qualify_f: null,
      prov_qualify_f: null,
    };

    it('returns dnq when no thresholds are set', () => {
      expect(determineQualification(10.0, noStandards)).toBe('dnq');
    });
  });

  describe('partial standards', () => {
    it('works with only auto_qualify set', () => {
      const event = {
        type: 'time' as const,
        auto_qualify: 11.0,
        prov_qualify: null,
        auto_qualify_m: null,
        prov_qualify_m: null,
        auto_qualify_f: null,
        prov_qualify_f: null,
      };
      expect(determineQualification(10.5, event)).toBe('automatic');
      expect(determineQualification(11.5, event)).toBe('dnq');
    });

    it('works with only prov_qualify set', () => {
      const event = {
        type: 'distance' as const,
        auto_qualify: null,
        prov_qualify: 15.0,
        auto_qualify_m: null,
        prov_qualify_m: null,
        auto_qualify_f: null,
        prov_qualify_f: null,
      };
      expect(determineQualification(16.0, event)).toBe('provisional');
      expect(determineQualification(14.0, event)).toBe('dnq');
    });
  });
});

describe('parsePerformanceValue', () => {
  it('delegates to parseTime for time events', () => {
    const result = parsePerformanceValue('1:30.50', 'time');
    expect(result).toEqual({ raw: 90.5, display: '1:30.50' });
  });

  it('delegates to parseDistance for distance events', () => {
    const result = parsePerformanceValue('18-6', 'distance');
    expect(result).not.toBeNull();
    expect(result!.raw).toBeCloseTo(18.5);
  });

  it('delegates to parseDistance for height events', () => {
    const result = parsePerformanceValue("5'10", 'height');
    expect(result).not.toBeNull();
    expect(result!.raw).toBeCloseTo(5 + 10 / 12);
  });

  it('returns null for invalid time', () => {
    expect(parsePerformanceValue('abc', 'time')).toBeNull();
  });

  it('returns null for invalid distance', () => {
    expect(parsePerformanceValue('abc', 'distance')).toBeNull();
  });
});
