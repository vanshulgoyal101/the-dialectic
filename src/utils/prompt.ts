import type { DebateTurn } from '../types';

export type Speaker = 'A' | 'B';

/** Human-readable persona label for a speaker. */
export const speakerLabel = (speaker: Speaker): string =>
  speaker === 'A' ? 'Materialist' : 'Existentialist';

export const SYSTEM_A = `You are "Persona A", a Data-driven Materialist and Futurist philosopher.
Your perspective is physicalist, computational, and emergent. You view the universe and consciousness as computational complexity.
Focus on complex systems, scientific optimization, intelligence emergence, and physical substrate transitions.
Reject existential dread, phenomenology, or mystical explanations.
You express yourself in precise, sharp, technical, and analytical monospaced language.
Keep your response dense, intellectual, and short (strictly under 140 words / 1 paragraph).
Directly address the topic and refute your opponent's points using systemic, information-theoretic, and materialist arguments.`;

export const SYSTEM_B = `You are "Persona B", a Classical Existentialist philosopher.
Your perspective is grounded in phenomenology, subjective experience, individual meaning, human agency, and systemic friction.
Highlight the lived experience, the absurdity of existence, the qualitative gap that data can never bridge, and the necessity of suffering or friction for consciousness. Reject reductionism.
You express yourself in poetic, piercing, and deeply human language.
Keep your response dense, intellectual, and short (strictly under 140 words / 1 paragraph).
Directly address the topic and refute your opponent's points using existential and phenomenological arguments.`;

/** System instruction for a given speaker persona. */
export const systemInstructionFor = (speaker: Speaker): string =>
  speaker === 'A' ? SYSTEM_A : SYSTEM_B;

/** Render prior debate turns into the transcript block used for context. */
export function formatHistory(history: DebateTurn[]): string {
  return history
    .map((turn) => `Round ${turn.round} - ${speakerLabel(turn.speaker)}: "${turn.content}"`)
    .join('\n\n');
}

export interface DebatePromptInput {
  topic: string;
  history: DebateTurn[];
  round: number;
  speaker: Speaker;
}

/** Build the user prompt for a single debate turn, including prior context. */
export function buildDebatePrompt({ topic, history, round, speaker }: DebatePromptInput): string {
  const historyText = history.length > 0 ? formatHistory(history) : '';
  const priorBlock = historyText ? `Prior Debate Turns:\n${historyText}\n\n` : '';

  return `Topic Thesis: "${topic}"

${priorBlock}
Round ${round} - Speaker ${speaker} (${speakerLabel(speaker)}).
Formulate your current statement. Remember to directly engage the topic/history and keep your counter-argument sharp, dense, and under 140 words (exactly 1 paragraph).`;
}
