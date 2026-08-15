import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { DebateTurn, GraphNode, GraphLink } from '../types';
import { extractKeywords } from '../utils/nlp';

const SYSTEM_A = `You are "Persona A", a Data-driven Materialist and Futurist philosopher.
Your perspective is physicalist, computational, and emergent. You view the universe and consciousness as computational complexity.
Focus on complex systems, scientific optimization, intelligence emergence, and physical substrate transitions.
Reject existential dread, phenomenology, or mystical explanations.
You express yourself in precise, sharp, technical, and analytical monospaced language.
Keep your response dense, intellectual, and short (strictly under 140 words / 1 paragraph).
Directly address the topic and refute your opponent's points using systemic, information-theoretic, and materialist arguments.`;

const SYSTEM_B = `You are "Persona B", a Classical Existentialist philosopher.
Your perspective is grounded in phenomenology, subjective experience, individual meaning, human agency, and systemic friction.
Highlight the lived experience, the absurdity of existence, the qualitative gap that data can never bridge, and the necessity of suffering or friction for consciousness. Reject reductionism.
You express yourself in poetic, piercing, and deeply human language.
Keep your response dense, intellectual, and short (strictly under 140 words / 1 paragraph).
Directly address the topic and refute your opponent's points using existential and phenomenological arguments.`;

export function useDebate() {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_key') || '');
  const [topic, setTopic] = useState<string>('Will uploading consciousness preserve the self?');
  const [rounds, setRounds] = useState<number>(3);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentTurn, setCurrentTurn] = useState<'A' | 'B' | null>(null);
  const [isDebating, setIsDebating] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [history, setHistory] = useState<DebateTurn[]>([]);
  const [currentStreamingText, setCurrentStreamingText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

  // D3 Graph Nodes & Links
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);

  // Refs to keep track of mutable state in async debate loop
  const debateStateRef = useRef({
    isDebating: false,
    isPaused: false,
    history: [] as DebateTurn[],
    currentRound: 1,
    topic: '',
    apiKey: '',
  });

  // Sync refs with state
  useEffect(() => {
    debateStateRef.current = {
      isDebating,
      isPaused,
      history,
      currentRound,
      topic,
      apiKey,
    };
  }, [isDebating, isPaused, history, currentRound, topic, apiKey]);

  // Save API key
  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_key', key);
  };

  // Helper: check if debate is active and wait if paused
  const checkPauseAndStatus = async () => {
    while (debateStateRef.current.isPaused && debateStateRef.current.isDebating) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (!debateStateRef.current.isDebating) {
      throw new Error('Debate stopped');
    }
  };

  // Reset Graph to initial states
  const initGraph = (currentTopic: string) => {
    const initialNodes: GraphNode[] = [
      {
        id: 'thesis',
        label: currentTopic.length > 40 ? currentTopic.slice(0, 37) + '...' : currentTopic,
        group: 'thesis',
        count: 2,
        roundFirstSeen: 0,
        fx: 400,
        fy: 250,
        x: 400,
        y: 250,
      },
      {
        id: 'speaker_A',
        label: 'Persona A (Materialist)',
        group: 'speaker_A',
        count: 3,
        roundFirstSeen: 0,
        fx: 180,
        fy: 250,
        x: 180,
        y: 250,
      },
      {
        id: 'speaker_B',
        label: 'Persona B (Existentialist)',
        group: 'speaker_B',
        count: 3,
        roundFirstSeen: 0,
        fx: 620,
        fy: 250,
        x: 620,
        y: 250,
      },
    ];
    setNodes(initialNodes);
    setLinks([]);
  };

  const startDebate = async () => {
    if (!apiKey.trim()) {
      setError('API Key is required in settings.');
      return;
    }
    setError(null);
    setIsDebating(true);
    setIsPaused(false);
    setCurrentRound(1);
    setCurrentTurn('A');
    setHistory([]);
    setCurrentStreamingText('');
    initGraph(topic);

    // Give state a brief moment to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const ai = new GoogleGenAI({ apiKey });

      for (let r = 1; r <= rounds; r++) {
        setCurrentRound(r);

        // --- Turn A (Materialist) ---
        setCurrentTurn('A');
        await checkPauseAndStatus();
        await streamTurn(ai, r, 'A');
        
        await checkPauseAndStatus();

        // --- Turn B (Existentialist) ---
        setCurrentTurn('B');
        await checkPauseAndStatus();
        await streamTurn(ai, r, 'B');

        await checkPauseAndStatus();
      }

      setIsDebating(false);
      setCurrentTurn(null);
    } catch (err: any) {
      if (err.message !== 'Debate stopped') {
        console.error('Debate Error:', err);
        setError(err.message || 'An unexpected error occurred during the debate.');
        setIsDebating(false);
        setCurrentTurn(null);
      }
    }
  };

  const streamTurn = async (ai: GoogleGenAI, round: number, speaker: 'A' | 'B'): Promise<string> => {
    setCurrentStreamingText('');
    
    // Construct debate prompt with historical context
    const currentHistory = debateStateRef.current.history;
    const systemInstruction = speaker === 'A' ? SYSTEM_A : SYSTEM_B;

    let historyText = '';
    if (currentHistory.length > 0) {
      historyText = currentHistory
        .map((t) => `Round ${t.round} - ${t.speaker === 'A' ? 'Materialist' : 'Existentialist'}: "${t.content}"`)
        .join('\n\n');
    }

    const prompt = `Topic Thesis: "${debateStateRef.current.topic}"

${historyText ? `Prior Debate Turns:\n${historyText}\n\n` : ''}
Round ${round} - Speaker ${speaker} (${speaker === 'A' ? 'Materialist' : 'Existentialist'}).
Formulate your current statement. Remember to directly engage the topic/history and keep your counter-argument sharp, dense, and under 140 words (exactly 1 paragraph).`;

    // Setup incremental keyword variables
    let accumulatedText = '';
    let processedTextLength = 0;
    let lastKeywordInTurn: string | null = null;

    try {
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.8,
        },
      });

      for await (const chunk of responseStream) {
        // Ensure debate wasn't stopped mid-stream
        if (!debateStateRef.current.isDebating) {
          throw new Error('Debate stopped');
        }
        // If paused mid-stream, we wait
        await checkPauseAndStatus();

        const text = chunk.text || '';
        accumulatedText += text;
        setCurrentStreamingText(accumulatedText);

        // Process incremental keywords
        const newSlice = accumulatedText.slice(processedTextLength);
        
        // Find last separator in the new slice to avoid cutting words
        const lastSeparatorIndex = Math.max(
          newSlice.lastIndexOf(' '),
          newSlice.lastIndexOf('\n'),
          newSlice.lastIndexOf(','),
          newSlice.lastIndexOf('.'),
          newSlice.lastIndexOf(';'),
          newSlice.lastIndexOf('?'),
          newSlice.lastIndexOf('!')
        );

        if (lastSeparatorIndex > 0) {
          const textToProcess = newSlice.substring(0, lastSeparatorIndex);
          processedTextLength += lastSeparatorIndex;

          const words = extractKeywords(textToProcess);
          if (words.length > 0) {
            updateGraphWithKeywords(words, speaker, round, lastKeywordInTurn, (keyword) => {
              lastKeywordInTurn = keyword;
            });
          }
        }
      }

      // Process any remaining tail characters at the end of the stream
      const remainingText = accumulatedText.slice(processedTextLength);
      if (remainingText.trim()) {
        const words = extractKeywords(remainingText);
        if (words.length > 0) {
          updateGraphWithKeywords(words, speaker, round, lastKeywordInTurn, (keyword) => {
            lastKeywordInTurn = keyword;
          });
        }
      }

      // Add turn to history
      const turnKeywords = extractKeywords(accumulatedText);
      const newTurn: DebateTurn = {
        round,
        speaker,
        content: accumulatedText,
        keywords: turnKeywords,
      };

      setHistory((prev) => [...prev, newTurn]);
      setCurrentStreamingText('');
      return accumulatedText;
    } catch (err: any) {
      if (err.message === 'Debate stopped') {
        throw err;
      }
      throw new Error(`API stream error for Persona ${speaker}: ${err.message || err}`);
    }
  };

  const updateGraphWithKeywords = (
    words: string[],
    speaker: 'A' | 'B',
    round: number,
    lastKeywordInTurn: string | null,
    setLastKeyword: (word: string) => void
  ) => {
    setNodes((prevNodes) => {
      const updatedNodes = [...prevNodes];
      
      words.forEach((word) => {
        // Exclude anchor IDs
        if (word.toLowerCase() === 'thesis' || word.toLowerCase() === 'speaker_a' || word.toLowerCase() === 'speaker_b') {
          return;
        }

        const existingNode = updatedNodes.find((n) => n.id === word);
        if (existingNode) {
          existingNode.count += 1;
          // If word was used by the other speaker previously, mark it neutral
          if (
            (existingNode.group === 'A' && speaker === 'B') ||
            (existingNode.group === 'B' && speaker === 'A')
          ) {
            existingNode.group = 'neutral';
          }
        } else {
          // Add new node
          const anchorX = speaker === 'A' ? 180 : 620;
          updatedNodes.push({
            id: word,
            label: word,
            group: speaker, // 'A' or 'B'
            count: 1,
            roundFirstSeen: round,
            x: anchorX + (Math.random() - 0.5) * 60,
            y: 250 + (Math.random() - 0.5) * 60,
          });
        }
      });

      return updatedNodes;
    });

    setLinks((prevLinks) => {
      const updatedLinks = [...prevLinks];

      words.forEach((word) => {
        if (word.toLowerCase() === 'thesis' || word.toLowerCase() === 'speaker_a' || word.toLowerCase() === 'speaker_b') {
          return;
        }

        const speakerAnchorId = speaker === 'A' ? 'speaker_A' : 'speaker_B';

        // Helper to check match regardless of Node object conversion by D3
        const isMatch = (targetId: string, item: string | any) => {
          return (typeof item === 'string' ? item : item.id) === targetId;
        };

        // 1. Link to Speaker Anchor
        const hasSpeakerLink = updatedLinks.some(
          (l) => isMatch(speakerAnchorId, l.source) && isMatch(word, l.target)
        );
        if (!hasSpeakerLink) {
          updatedLinks.push({
            source: speakerAnchorId,
            target: word,
            value: 1,
          });
        }

        // 2. Link to Central Thesis (weaker link)
        const hasThesisLink = updatedLinks.some(
          (l) => isMatch('thesis', l.source) && isMatch(word, l.target)
        );
        if (!hasThesisLink) {
          updatedLinks.push({
            source: 'thesis',
            target: word,
            value: 0.5,
          });
        }

        // 3. Link sequentially
        if (lastKeywordInTurn && lastKeywordInTurn !== word) {
          const hasChainLink = updatedLinks.some(
            (l) =>
              (isMatch(lastKeywordInTurn!, l.source) && isMatch(word, l.target)) ||
              (isMatch(word, l.source) && isMatch(lastKeywordInTurn!, l.target))
          );
          if (!hasChainLink) {
            updatedLinks.push({
              source: lastKeywordInTurn,
              target: word,
              value: 1.5,
            });
          }
        }

        setLastKeyword(word);
      });

      return updatedLinks;
    });
  };

  const pauseDebate = () => {
    setIsPaused(true);
  };

  const resumeDebate = () => {
    setIsPaused(false);
  };

  const resetDebate = () => {
    setIsDebating(false);
    setIsPaused(false);
    setCurrentRound(1);
    setCurrentTurn(null);
    setHistory([]);
    setCurrentStreamingText('');
    setNodes([]);
    setLinks([]);
    setSummary('');
    setIsSummarizing(false);
    setError(null);
  };

  const summarizeDebate = async () => {
    if (debateStateRef.current.history.length === 0) return;
    setIsSummarizing(true);
    setSummary('');
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: debateStateRef.current.apiKey });
      const prompt = `You are a neutral, objective philosophic synthesis engine. 
Read the following debate transcript on the topic "${debateStateRef.current.topic}":

${debateStateRef.current.history.map(t => `Round ${t.round} - ${t.speaker === 'A' ? 'Materialist' : 'Existentialist'}: "${t.content}"`).join('\n\n')}

Provide a highly precise, intellectually dense synthesis and summary of the debate in exactly 100 words. Highlight the core dialectical tension and where the two positions clashed most critically. Do not exceed 100 words.`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      let accumulated = '';
      for await (const chunk of responseStream) {
        accumulated += chunk.text || '';
        setSummary(accumulated);
      }
    } catch (err: any) {
      console.error(err);
      setError(`Summary Error: ${err.message || err}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const clearSummary = () => {
    setSummary('');
  };

  return {
    apiKey,
    topic,
    rounds,
    currentRound,
    currentTurn,
    isDebating,
    isPaused,
    history,
    currentStreamingText,
    error,
    nodes,
    links,
    summary,
    isSummarizing,
    setTopic,
    setRounds,
    saveApiKey,
    startDebate,
    pauseDebate,
    resumeDebate,
    resetDebate,
    summarizeDebate,
    clearSummary,
  };
}
