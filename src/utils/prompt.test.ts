import { describe, it, expect } from 'vitest';
import {
  buildDebatePrompt,
  formatHistory,
  speakerLabel,
  systemInstructionFor,
  SYSTEM_A,
  SYSTEM_B,
} from './prompt';
import type { DebateTurn } from '../types';

const turn = (round: number, speaker: 'A' | 'B', content: string): DebateTurn => ({
  round,
  speaker,
  content,
  keywords: [],
});

describe('speakerLabel', () => {
  it('maps speakers to persona labels', () => {
    expect(speakerLabel('A')).toBe('Materialist');
    expect(speakerLabel('B')).toBe('Existentialist');
  });
});

describe('systemInstructionFor', () => {
  it('returns the correct persona system prompt', () => {
    expect(systemInstructionFor('A')).toBe(SYSTEM_A);
    expect(systemInstructionFor('B')).toBe(SYSTEM_B);
  });
});

describe('formatHistory', () => {
  it('formats turns with round, persona and quoted content', () => {
    const text = formatHistory([turn(1, 'A', 'Consciousness is computation.')]);
    expect(text).toBe('Round 1 - Materialist: "Consciousness is computation."');
  });

  it('joins multiple turns with a blank line', () => {
    const text = formatHistory([turn(1, 'A', 'x'), turn(1, 'B', 'y')]);
    expect(text).toBe('Round 1 - Materialist: "x"\n\nRound 1 - Existentialist: "y"');
  });
});

describe('buildDebatePrompt', () => {
  it('includes the topic and the current round/speaker', () => {
    const prompt = buildDebatePrompt({ topic: 'Is the self real?', history: [], round: 2, speaker: 'B' });
    expect(prompt).toContain('Topic Thesis: "Is the self real?"');
    expect(prompt).toContain('Round 2 - Speaker B (Existentialist)');
  });

  it('omits the prior-turns block when there is no history', () => {
    const prompt = buildDebatePrompt({ topic: 't', history: [], round: 1, speaker: 'A' });
    expect(prompt).not.toContain('Prior Debate Turns');
  });

  it('includes the prior-turns block when history exists', () => {
    const prompt = buildDebatePrompt({
      topic: 't',
      history: [turn(1, 'A', 'first point')],
      round: 2,
      speaker: 'B',
    });
    expect(prompt).toContain('Prior Debate Turns:');
    expect(prompt).toContain('first point');
  });
});
