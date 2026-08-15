import { describe, it, expect } from 'vitest';
import { cleanWord, extractKeywords } from './nlp';

describe('cleanWord', () => {
  it('strips leading and trailing non-alphabetic characters', () => {
    expect(cleanWord('"Hello,"')).toBe('Hello');
    expect(cleanWord('...world!')).toBe('world');
    expect(cleanWord('mid-word')).toBe('mid-word'.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, ''));
  });

  it('returns an empty string for purely symbolic input', () => {
    expect(cleanWord('---')).toBe('');
  });
});

describe('extractKeywords', () => {
  it('returns an empty array for empty input', () => {
    expect(extractKeywords('')).toEqual([]);
  });

  it('drops stop words and short words, and capitalizes results', () => {
    const result = extractKeywords('The consciousness will emerge from complexity');
    expect(result).toContain('Consciousness');
    expect(result).toContain('Emerge');
    // stop words / short words removed
    expect(result).not.toContain('The');
    expect(result).not.toContain('Will');
  });

  it('de-duplicates repeated keywords', () => {
    const result = extractKeywords('Materialism materialism MATERIALISM');
    expect(result.filter((w) => w.toLowerCase() === 'materialism')).toHaveLength(1);
  });

  it('excludes words shorter than 4 characters', () => {
    const result = extractKeywords('cat dog sun mind');
    expect(result).toEqual(['Mind']);
  });
});
