import { useDebate } from './hooks/useDebate';
import SettingsPanel from './components/SettingsPanel';
import DebateColumn from './components/DebateColumn';
import DebateCanvas from './components/DebateCanvas';
import { Play, Pause, RotateCcw, Download, AlertTriangle, Activity } from 'lucide-react';

export default function App() {
  const {
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
  } = useDebate();

  const handleExportTranscript = () => {
    if (history.length === 0) return;

    const markdown = `# The Dialectic: Philosophical Clash Transcript
Generated on: ${new Date().toLocaleDateString()}
Topic Thesis: "${topic}"
Rounds Configured: ${rounds}
Core Engine: gemini-3.5-flash

---

${history
  .map(
    (t) => `## Round ${t.round} - ${t.speaker === 'A' ? 'Persona A (Materialist)' : 'Persona B (Existentialist)'}
${t.content}

*Concepts Extracted: ${t.keywords.join(', ')}*
`
  )
  .join('\n---\n\n')}`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `the-dialectic-transcript-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Compute status message
  let statusText = 'SYSTEM_STANDBY';
  let statusColorClass = 'text-zinc-500';
  let lightColorClass = 'bg-zinc-500';

  if (isDebating) {
    if (isPaused) {
      statusText = 'SYSTEM_PAUSED';
      statusColorClass = 'text-amber-500';
      lightColorClass = 'bg-amber-500 animate-pulse';
    } else {
      statusText = `DEBATING.RD_${String(currentRound).padStart(2, '0')}.${currentTurn === 'A' ? 'MATERIALIST' : 'EXISTENTIALIST'}`;
      statusColorClass = currentTurn === 'A' ? 'text-[#00f0ff]' : 'text-[#ff8c00]';
      lightColorClass = currentTurn === 'A' ? 'bg-[#00f0ff] animate-ping' : 'bg-[#ff8c00] animate-ping';
    }
  } else if (history.length > 0) {
    statusText = 'CLASH_COMPLETED';
    statusColorClass = 'text-emerald-500';
    lightColorClass = 'bg-emerald-500';
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0c0c0e] text-[#e3e3e6] scanline-hud font-sans select-none">
      
      {/* Top Banner Control HUD */}
      <header className="flex justify-between items-center px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/80 shrink-0 select-none">
        
        {/* Title and version */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-mono font-black tracking-widest text-[#e3e3e6]">
              THE_DIALECTIC <span className="text-[10px] text-[#00f0ff] font-normal font-mono select-all ml-1">v1.2.0-STABLE</span>
            </span>
            <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">
              AI Philosophical Clash Engine
            </span>
          </div>
        </div>

        {/* Engine Status Panel */}
        <div className="flex items-center gap-3 border border-zinc-800 bg-zinc-900/10 px-3 py-1 font-mono text-[10px]">
          <span className="text-zinc-600">STATUS:</span>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${lightColorClass}`} />
            <span className={`font-bold tracking-wider ${statusColorClass}`}>{statusText}</span>
          </div>
        </div>

        {/* Operational Controllers */}
        <div className="flex items-center gap-2">
          {!isDebating ? (
            <button
              onClick={startDebate}
              className="flex items-center gap-2 text-xs font-mono px-3.5 py-1.5 border border-[#00f0ff] text-[#00f0ff] bg-transparent hover:bg-[#00f0ff]/10 active:bg-[#00f0ff]/20 transition-all rounded-none uppercase"
            >
              <Play className="w-3.5 h-3.5" />
              Initialize Clash
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={resumeDebate}
                  className="flex items-center gap-2 text-xs font-mono px-3.5 py-1.5 border border-amber-500 text-amber-500 bg-transparent hover:bg-amber-500/10 active:bg-amber-500/20 transition-all rounded-none uppercase animate-pulse"
                >
                  <Play className="w-3.5 h-3.5" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={pauseDebate}
                  className="flex items-center gap-2 text-xs font-mono px-3.5 py-1.5 border border-zinc-500 text-zinc-400 bg-transparent hover:bg-zinc-800 active:bg-zinc-700 transition-all rounded-none uppercase"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </button>
              )}
              
              <button
                onClick={resetDebate}
                className="flex items-center gap-2 text-xs font-mono px-3.5 py-1.5 border border-rose-600 text-rose-500 bg-transparent hover:bg-rose-950/20 active:bg-rose-950/40 transition-all rounded-none uppercase"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Terminate
              </button>
            </>
          )}

          {history.length > 0 && !isDebating && (
            <button
              onClick={summarizeDebate}
              disabled={isSummarizing}
              className={`flex items-center gap-2 text-xs font-mono px-3.5 py-1.5 border transition-all rounded-none uppercase ${
                isSummarizing
                  ? 'border-zinc-800 text-zinc-600 bg-transparent cursor-default'
                  : 'border-[#bd00ff] text-[#bd00ff] hover:bg-[#bd00ff]/10 active:bg-[#bd00ff]/20 animate-pulse'
              }`}
              title="Synthesize dense 100-word philosophical summary of this clash"
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Synthesize Summary
            </button>
          )}

          <button
            onClick={handleExportTranscript}
            disabled={history.length === 0}
            className={`flex items-center gap-2 text-xs font-mono px-3.5 py-1.5 border transition-all rounded-none uppercase ${
              history.length > 0
                ? 'border-zinc-500 text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700'
                : 'border-zinc-800 text-zinc-600 cursor-default bg-transparent'
            }`}
            title="Download full debate log as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            Export Log
          </button>
        </div>
      </header>

      {/* Settings configuration container */}
      <SettingsPanel
        apiKey={apiKey}
        onSaveApiKey={saveApiKey}
        rounds={rounds}
        onSetRounds={setRounds}
        isDebating={isDebating}
        topic={topic}
        onSetTopic={setTopic}
      />

      {/* Error Alert HUD (Conditional) */}
      {error && (
        <div className="bg-rose-950/40 border-b border-rose-800/80 px-6 py-2.5 flex items-center gap-3 text-rose-300 font-mono text-xs animate-shake shrink-0">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <div className="flex-1">
            <span className="font-bold text-rose-400 uppercase">[API_EXCEPTION_ERROR]:</span> {error}
          </div>
          <button 
            onClick={resetDebate} 
            className="text-[10px] text-zinc-400 hover:text-white border border-rose-900 px-2 py-0.5"
          >
            ACKNOWLEDGE & CLEAR
          </button>
        </div>
      )}

      {/* Main Workspace (3-Column Layout) */}
      <main className="flex-1 w-full grid grid-cols-12 gap-3 p-3 overflow-hidden select-none bg-zinc-950/40">
        
        {/* Column Left: Persona A (Data-Driven Futurist) */}
        <section className="col-span-12 lg:col-span-3 h-full overflow-hidden">
          <DebateColumn
            speaker="A"
            title="PERSONA_A: THE_MATERIALIST"
            subtitle="computational_substrate_optimization.sys"
            history={history}
            isStreaming={isDebating && !isPaused && currentTurn === 'A'}
            streamingText={currentStreamingText}
            isActive={isDebating && currentTurn === 'A'}
            currentRound={currentRound}
          />
        </section>

        {/* Column Center: D3 semantic visualization canvas */}
        <section className="col-span-12 lg:col-span-6 h-full flex flex-col overflow-hidden relative">
          <DebateCanvas
            nodes={nodes}
            links={links}
            topic={topic}
          />
          {/* Subtle decoration to represent mapping action */}
          {isDebating && !isPaused && (
            <div className="absolute top-10 right-4 flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800/80 px-2.5 py-1 text-[9px] font-mono text-[#00f0ff]">
              <Activity className="w-3 h-3 text-[#00f0ff] animate-pulse" />
              <span>MAPPING_KEYWORDS_IN_REALTIME...</span>
            </div>
          )}

          {/* Summary Overlay (Conditional) */}
          {(isSummarizing || summary) && (
            <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30 transition-all duration-300">
              <div className="blueprint-panel border border-zinc-800 w-full max-w-xl p-5 bg-zinc-950 relative">
                {/* Blueprint fine corners handles */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#bd00ff]" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#bd00ff]" />
                
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5 mb-4 font-mono text-xs text-[#bd00ff]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#bd00ff] rounded-full animate-pulse" />
                    <span>DIALECTICAL_SYNTHESIS_REPORT.SYS</span>
                  </div>
                  {!isSummarizing && (
                    <button 
                      onClick={clearSummary} 
                      className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer text-[10px]"
                    >
                      [CLOSE]
                    </button>
                  )}
                </div>

                <p className="font-mono text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap select-text max-h-72 overflow-y-auto pr-1">
                  {summary}
                  {isSummarizing && <span className="cursor-blink-cyan" />}
                </p>

                {!isSummarizing && (
                  <div className="flex justify-end mt-4 pt-3 border-t border-zinc-900 font-mono text-[9px]">
                    <button
                      onClick={clearSummary}
                      className="border border-zinc-800 hover:border-zinc-700 px-3 py-1 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Dismiss Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Column Right: Persona B (Phenomenological Existentialist) */}
        <section className="col-span-12 lg:col-span-3 h-full overflow-hidden">
          <DebateColumn
            speaker="B"
            title="PERSONA_B: THE_EXISTENTIALIST"
            subtitle="phenomenology_friction_meaning.sys"
            history={history}
            isStreaming={isDebating && !isPaused && currentTurn === 'B'}
            streamingText={currentStreamingText}
            isActive={isDebating && currentTurn === 'B'}
            currentRound={currentRound}
          />
        </section>
      </main>
    </div>
  );
}
