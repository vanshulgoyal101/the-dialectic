import React, { useState } from 'react';
import { Settings, ChevronDown, ChevronUp, Eye, EyeOff, Info } from 'lucide-react';

interface SettingsPanelProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  rounds: number;
  onSetRounds: (rounds: number) => void;
  isDebating: boolean;
  topic: string;
  onSetTopic: (topic: string) => void;
}

const PRESET_TOPICS = [
  'Will uploading consciousness preserve the self?',
  'Does a fully automated society destroy human meaning?',
  'Can an emergent superintelligence experience authentic suffering?',
  'Should organic biology be completely replaced by optimized computational substrates?',
  'Is free will a physical emergence or a phenomenological necessity?',
];

export default function SettingsPanel({
  apiKey,
  onSaveApiKey,
  rounds,
  onSetRounds,
  isDebating,
  topic,
  onSetTopic,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(keyInput);
  };

  return (
    <div className="w-full blueprint-panel border-b border-zinc-800 transition-all duration-300">
      {/* Header Bar */}
      <div
        className="flex items-center justify-between px-6 py-3 cursor-pointer select-none hover:bg-zinc-900/40"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00f0ff]">
          <Settings className="w-4 h-4 animate-spin-slow" />
          <span>SYSTEM_CONFIGURATION.CFG</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <span>{isOpen ? 'COLLAPSE [▲]' : 'EXPAND [▼]'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Settings Content */}
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-zinc-900/60 grid grid-cols-1 md:grid-cols-12 gap-6 text-sm font-mono">
          {/* Column 1: API Key Config (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
              [01] GOOGLE_AI_STUDIO_AUTH
            </span>
            <form onSubmit={handleSaveKey} className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400">GEMINI_API_KEY:</label>
              <div className="relative flex items-center">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste AI Studio API Key..."
                  disabled={isDebating}
                  className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-[#00f0ff]/50 px-3 py-2 rounded-none text-xs font-mono text-zinc-300 outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 text-zinc-500 hover:text-[#00f0ff] outline-none"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={isDebating || apiKey === keyInput}
                className={`w-full py-1.5 text-xs text-center border transition-all rounded-none uppercase ${
                  apiKey === keyInput
                    ? 'border-zinc-800 text-zinc-600 bg-transparent cursor-default'
                    : 'border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff]/10 active:bg-[#00f0ff]/20'
                }`}
              >
                Save & Authenticate
              </button>
            </form>
            <div className="flex gap-2 items-start mt-1 p-2 bg-zinc-950/40 border border-zinc-900 text-zinc-500 text-[10px] leading-relaxed">
              <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <span>
                API Key is stored locally in your browser's <code>localStorage</code> and never sent to any external server other than the Google Gemini API endpoint.
              </span>
            </div>
          </div>

          {/* Column 2: Parameters (3 cols) */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
              [02] ENGINE_PARAMETERS
            </span>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>DEBATE_ROUNDS:</span>
                  <span className="text-[#00f0ff]">{rounds} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rounds}
                  disabled={isDebating}
                  onChange={(e) => onSetRounds(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#00f0ff] border border-zinc-800 disabled:opacity-50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-zinc-400">CORE_MODEL:</span>
                <div className="px-3 py-2 bg-zinc-950/60 border border-zinc-900 text-xs text-zinc-400 font-mono">
                  gemini-3.5-flash
                </div>
              </div>
              <div className="flex flex-col gap-1 text-[10px] leading-relaxed text-zinc-500">
                <span className="text-[#00f0ff] font-bold">PERSONA_A:</span> Futurist/Materialist
                <br />
                <span className="text-[#ff8c00] font-bold">PERSONA_B:</span> Existentialist
              </div>
            </div>
          </div>

          {/* Column 3: Thesis/Presets (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
              [03] THESIS_INPUT
            </span>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400">CUSTOM_THESIS_STATEMENT:</label>
              <textarea
                value={topic}
                disabled={isDebating}
                onChange={(e) => onSetTopic(e.target.value)}
                placeholder="Type custom thesis to debate..."
                className="w-full h-16 bg-zinc-950/80 border border-zinc-800 focus:border-[#00f0ff]/50 p-2 rounded-none text-xs font-mono text-zinc-300 outline-none resize-none"
              />
              <span className="text-[10px] text-zinc-500">PRESET_DATABANKS:</span>
              <div className="flex flex-col gap-1 max-h-24 overflow-y-auto border border-zinc-900 bg-zinc-950/40 p-1.5">
                {PRESET_TOPICS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={isDebating}
                    onClick={() => onSetTopic(preset)}
                    className={`text-[10px] text-left px-1.5 py-1 transition-colors font-mono truncate hover:text-[#00f0ff] hover:bg-zinc-900/40 ${
                      topic === preset ? 'text-[#00f0ff] bg-[#00f0ff]/5 border-l border-[#00f0ff]' : 'text-zinc-400'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
