import { useEffect, useRef } from 'react';
import type { DebateTurn } from '../types';
import { Terminal, Cpu, Landmark } from 'lucide-react';

interface DebateColumnProps {
  speaker: 'A' | 'B';
  title: string;
  subtitle: string;
  history: DebateTurn[];
  isStreaming: boolean;
  streamingText: string;
  isActive: boolean;
  currentRound: number;
}

export default function DebateColumn({
  speaker,
  title,
  subtitle,
  history,
  isStreaming,
  streamingText,
  isActive,
  currentRound,
}: DebateColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Filter history for this speaker
  const speakerHistory = history.filter((turn) => turn.speaker === speaker);

  // Auto-scroll to bottom of column on stream chunk or history updates
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [streamingText, speakerHistory.length]);

  const isA = speaker === 'A';
  const accentColorClass = isA ? 'text-[#00f0ff]' : 'text-[#ff8c00]';

  const glowBorderClass = isA 
    ? 'border-[#00f0ff]/30 shadow-[0_0_8px_rgba(0,240,255,0.05)]' 
    : 'border-[#ff8c00]/30 shadow-[0_0_8px_rgba(255,140,0,0.05)]';

  return (
    <div
      className={`flex flex-col h-full blueprint-panel border transition-all duration-300 ${
        isActive ? glowBorderClass : 'border-zinc-800/80'
      }`}
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/60`}>
        <div className="flex items-center gap-2">
          {isA ? (
            <Cpu className={`w-4 h-4 ${accentColorClass}`} />
          ) : (
            <Landmark className={`w-4 h-4 ${accentColorClass}`} />
          )}
          <div className="flex flex-col">
            <span className={`text-xs font-mono font-bold tracking-wide ${accentColorClass}`}>
              {title}
            </span>
            <span className="text-[9px] text-zinc-500 font-mono tracking-wider">
              {subtitle}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isActive ? (isA ? 'bg-[#00f0ff] animate-pulse' : 'bg-[#ff8c00] animate-pulse') : 'bg-zinc-700'
            }`}
          />
          <span className={isActive ? 'text-zinc-300' : 'text-zinc-500'}>
            {isActive ? 'ACTIVE_PROCESS' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Text Logs Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 font-mono-debate space-y-4 select-text scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* If no history yet and not streaming */}
        {speakerHistory.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 font-mono text-[10px] py-12 text-center">
            <Terminal className="w-5 h-5 mb-2 opacity-30" />
            <span>NO_DIALOGUE_STREAM_CONNECTED</span>
            <span>AWAITING THESIS TRIGGER...</span>
          </div>
        )}

        {/* Render prior turns */}
        {speakerHistory.map((turn) => (
          <div
            key={turn.round}
            className={`p-3 bg-zinc-950/40 border border-zinc-900/60 rounded-none relative overflow-hidden group hover:border-zinc-800 transition-colors`}
          >
            {/* Fine decoration lines representing blueprint aesthetics */}
            <div className={`absolute top-0 left-0 w-[2px] h-full ${isA ? 'bg-[#00f0ff]/40' : 'bg-[#ff8c00]/40'}`} />
            
            <div className="flex justify-between items-center text-[9px] text-zinc-500 mb-2 font-mono border-b border-zinc-900 pb-1">
              <span>RD_{String(turn.round).padStart(2, '0')}</span>
              <span>{isA ? 'TRANSCRIPT_A_STREAM' : 'TRANSCRIPT_B_STREAM'}</span>
            </div>
            
            <p className="text-zinc-300 leading-relaxed font-mono-debate text-xs whitespace-pre-wrap select-text">
              {turn.content}
            </p>

            {turn.keywords.length > 0 && (
              <div className="mt-3 pt-2 border-t border-zinc-900/80 flex flex-wrap gap-1">
                <span className="text-[8px] text-zinc-600 font-mono self-center mr-1">EXTRACTS:</span>
                {turn.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className={`text-[8px] font-mono px-1 py-0.5 rounded-none ${
                      isA 
                        ? 'bg-[#00f0ff]/5 text-[#00f0ff]/60 border border-[#00f0ff]/10' 
                        : 'bg-[#ff8c00]/5 text-[#ff8c00]/60 border border-[#ff8c00]/10'
                    }`}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Render current streaming turn */}
        {isStreaming && (
          <div
            className={`p-3 bg-zinc-950/80 border border-zinc-900 rounded-none relative overflow-hidden`}
          >
            {/* Live border glow for active stream */}
            <div className={`absolute top-0 left-0 w-[2px] h-full ${isA ? 'bg-[#00f0ff]' : 'bg-[#ff8c00]'}`} />

            <div className="flex justify-between items-center text-[9px] text-zinc-400 mb-2 font-mono border-b border-zinc-900/80 pb-1">
              <span className="flex items-center gap-1">
                <span className={`w-1 h-1 rounded-full ${isA ? 'bg-[#00f0ff]' : 'bg-[#ff8c00]'} animate-ping`} />
                RD_{String(currentRound).padStart(2, '0')} [STREAMING...]
              </span>
              <span className={isA ? 'text-[#00f0ff]' : 'text-[#ff8c00]'}>
                {isA ? 'INTEL_CORE_A.DLL' : 'INTEL_CORE_B.DLL'}
              </span>
            </div>
            
            <p className="text-zinc-200 leading-relaxed font-mono-debate text-xs whitespace-pre-wrap select-text">
              {streamingText}
              <span className={isA ? 'cursor-blink-cyan' : 'cursor-blink-amber'} />
            </p>
          </div>
        )}
      </div>
      
      {/* HUD footer count */}
      <div className="px-3 py-1.5 border-t border-zinc-900 bg-zinc-950/40 flex justify-between items-center text-[9px] text-zinc-500 font-mono">
        <span>BUFFER_OK: 100%</span>
        <span>TURNS_RECORDED: {speakerHistory.length}</span>
      </div>
    </div>
  );
}
