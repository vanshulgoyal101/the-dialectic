export interface DebateTurn {
  round: number;
  speaker: 'A' | 'B';
  content: string;
  keywords: string[];
}

export interface DebateState {
  topic: string;
  apiKey: string;
  rounds: number;
  currentRound: number;
  currentTurn: 'A' | 'B' | null;
  isDebating: boolean;
  isPaused: boolean;
  history: DebateTurn[];
  currentStreamingText: string;
  error: string | null;
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  group: 'A' | 'B' | 'neutral' | 'thesis' | 'speaker_A' | 'speaker_B';
  count: number;
  roundFirstSeen: number;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
}
