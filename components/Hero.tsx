import React, { useState } from 'react';
import { Spinner } from './Spinner';

interface HeroProps {
  articleSource: string;
  setArticleSource: (source: string) => void;
  articleText: string;
  setArticleText: (text: string) => void;
  onAnalyze: (mode: 'url' | 'text') => void;
  onUseExample: () => void;
  isLoading: boolean;
}

const MiniEmotionCircle = ({ 
  label, 
  topic, 
  color, 
  nodeAngle = 180 // Bottom by default
}: { 
  label: string; 
  topic: string; 
  color: string; 
  nodeAngle?: number;
}) => {
  return (
    <div className="flex flex-col items-center gap-5 group">
      {/* Emotion Label */}
      <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-center" style={{ color }}>
        {label}
      </h5>
      
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Outer Orbit (Dashed) */}
        <div className="absolute inset-0 rounded-full border border-dashed border-black/10 scale-100 group-hover:scale-105 transition-transform duration-700"></div>
        
        {/* Inner Subtle Circle */}
        <div className="absolute w-24 h-24 rounded-full border border-black/5 bg-black/[0.01]"></div>
        
        {/* Indicator Node */}
        <div 
          className="absolute w-3 h-3 rounded-full border-2 border-white shadow-sm z-20"
          style={{ 
            backgroundColor: color,
            transform: `rotate(${nodeAngle}deg) translate(72px) rotate(-${nodeAngle}deg)` 
          }}
        ></div>

        {/* Center Topic Text */}
        <div className="relative z-10 px-4 text-center max-w-[110px]">
          <p className="text-[12px] font-bold text-charcoal/80 uppercase tracking-[0.04em] leading-[1.3] transition-colors group-hover:text-charcoal">
            {topic}
          </p>
        </div>
      </div>
    </div>
  );
};

const AnalysisPreviewGrid = () => {
  return (
    <div className="flex flex-col gap-y-12 py-6 items-center">
      {/* Top Row: 3 Items */}
      <div className="flex flex-wrap justify-center gap-x-12 gap-y-12">
        <MiniEmotionCircle 
          label="FREUDE (OBERFLÄCHLICH)" 
          topic="REGIERUNGSHANDELN" 
          color="#8A8787" 
          nodeAngle={180} 
        />
        <MiniEmotionCircle 
          label="ANGST" 
          topic="ZUKUNFTSSZENARIO" 
          color="#4C94F6" 
          nodeAngle={180} 
        />
        <MiniEmotionCircle 
          label="WUT" 
          topic="SOZIALE GERECHTIGKEIT" 
          color="#C3443D" 
          nodeAngle={180} 
        />
      </div>
      
      {/* Bottom Row: 2 Items */}
      <div className="flex flex-wrap justify-center gap-x-12 gap-y-12">
        <MiniEmotionCircle 
          label="ANGST / SCHUTZINSTINKT" 
          topic="BEDROHUNG DER NACHKOMMEN" 
          color="#8A8787" 
          nodeAngle={180} 
        />
        <MiniEmotionCircle 
          label="WUT / EKEL" 
          topic="MORALISCHE BEWERTUNG" 
          color="#8A8787" 
          nodeAngle={180} 
        />
      </div>
    </div>
  );
};

export const Hero: React.FC<HeroProps> = ({
  articleSource,
  setArticleSource,
  articleText,
  setArticleText,
  onAnalyze,
  onUseExample,
  isLoading
}) => {
  const [activeInputTab, setActiveInputTab] = useState<'url' | 'text'>('url');

  return (
    <div className="relative pt-16 pb-16 lg:pt-32 lg:pb-32 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
      
      <div className="flex flex-col">
        <h4 className="text-accent-coral text-[9px] uppercase animate-fade-in font-bold tracking-[0.12em] mb-3 opacity-90">
          ... EIN EXPERIMENTELLES MEDIEN-ANALYSE-TOOL
        </h4>
        
        <h1 className="text-h1 max-w-[16ch] sm:max-w-[20ch] md:max-w-2xl leading-[1.15] mb-10 tracking-tight text-charcoal">
          Wie emotional ist dieser Nachrichtenartikel?
        </h1>
        
        <p className="text-[1.1rem] text-charcoal/85 max-w-[54ch] leading-relaxed mb-4 font-light">
          Diese Anwendung analysiert Artikel auf emotionale Sprache und klassische rhetorische Strategien. 
          Die Auswertung zeigt Hinweise auf Manipulation und Framingstrategien in Medientexten.
        </p>
        
        <p className="text-[1.1rem] text-charcoal/40 max-w-[54ch] leading-relaxed mb-20">
          Wählen Sie eine URL oder kopieren Sie den Text manuell für die Analyse.
        </p>

        <div className="space-y-8">
          <div className="flex gap-8 border-b border-black/10 pb-2 px-2">
            <button 
              onClick={() => setActiveInputTab('url')}
              className={`text-[10px] uppercase tracking-[0.12em] font-black pb-2 transition-all ${activeInputTab === 'url' ? 'text-charcoal border-b-2 border-charcoal' : 'text-charcoal/20 hover:text-charcoal/40'}`}
            >
              URL-Scraper
            </button>
            <button 
              onClick={() => setActiveInputTab('text')}
              className={`text-[10px] uppercase tracking-[0.12em] font-black pb-2 transition-all ${activeInputTab === 'text' ? 'text-charcoal border-b-2 border-charcoal' : 'text-charcoal/20 hover:text-charcoal/40'}`}
            >
              Text-Eingabe
            </button>
          </div>

          <div className="space-y-6">
            {activeInputTab === 'url' ? (
              <div className="space-y-4">
                <label className="text-[10px] text-charcoal/30 uppercase tracking-[0.1em] font-black block pl-2">
                  Artikel-URL
                </label>
                <div className="url-panel shadow-hero-input transition-all duration-300 focus-within:ring-2 focus-within:ring-accent-coral/10 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={articleSource}
                    onChange={(e) => setArticleSource(e.target.value)}
                    placeholder="z.B. https://www.tagesschau.de/..."
                    className="url-input placeholder:text-charcoal/20 outline-none font-sans"
                    onKeyDown={(e) => e.key === 'Enter' && onAnalyze('url')}
                  />
                  <button
                    onClick={() => onAnalyze('url')}
                    disabled={isLoading || !articleSource.trim()}
                    className="url-button transition-all duration-300 disabled:opacity-50 min-w-[210px] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] shadow-lg"
                  >
                    {isLoading ? <Spinner size="sm" /> : "ARTIKEL LADEN"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <label className="text-[10px] text-charcoal/30 uppercase tracking-[0.1em] font-black block pl-2">
                  Artikel-Text hier einfügen
                </label>
                <div className="bg-white/40 border border-black/10 rounded-xl p-6 focus-within:border-accent-coral/40 transition-all shadow-hero-input">
                  <textarea
                    value={articleText}
                    onChange={(e) => setArticleText(e.target.value)}
                    placeholder="Kopieren Sie den Text des Artikels hier hinein..."
                    className="w-full h-48 bg-transparent outline-none text-charcoal/80 resize-none font-sans leading-relaxed text-[0.95rem] placeholder:text-charcoal/10"
                  />
                  <div className="flex justify-end pt-4 border-t border-black/5">
                    <button
                      onClick={() => onAnalyze('text')}
                      disabled={isLoading || articleText.length < 100}
                      className="url-button transition-all duration-300 disabled:opacity-50 min-w-[210px] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98]"
                    >
                      {isLoading ? <Spinner size="sm" /> : "TEXT ANALYSIEREN"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={onUseExample}
            className="text-charcoal/25 hover:text-charcoal/80 transition-all duration-300 text-[10px] uppercase tracking-[0.08em] font-black flex items-center gap-4 pl-2 group"
          >
            <span className="w-6 h-[1px] bg-black/10 group-hover:bg-accent-coral/40 transition-colors"></span>
            Keine URL? [Beispielartikel laden]
          </button>
        </div>
      </div>

      <div className="relative animate-fade-in">
        <div className="bg-white border-2 border-charcoal p-8 lg:p-14 brutalist-window overflow-hidden">
          <div className="space-y-12">
            <h2 className="text-[11px] text-charcoal/25 uppercase tracking-[0.12em] font-black text-center">
              INTERFACE VORSCHAU
            </h2>
            
            <div className="flex justify-center">
              <AnalysisPreviewGrid />
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t border-black/5 border-x border-charcoal rounded-none px-10">
              <p className="text-charcoal text-xl lg:text-3xl italic font-medium leading-tight font-serif">
                „Wir stehen vor dem Abgrund.“
              </p>
              
              <div className="flex items-center gap-4">
                <span className="text-[9px] text-charcoal/30 uppercase tracking-[0.1em] font-black w-36">Emotion</span>
                <span className="text-[9px] text-accent-coral font-black uppercase tracking-[0.1em]">Wut</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[9px] text-charcoal/30 uppercase tracking-[0.1em] font-black w-36">Sprachliches Mittel</span>
                <span className="text-[9px] text-charcoal/80 font-black uppercase tracking-[0.1em]">Angstappell</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};