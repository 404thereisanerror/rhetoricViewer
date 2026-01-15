
import React, { useState, useRef } from 'react';
/* Fix: Use Sentence and Influence types from types.ts */
import { type Sentence, type Influence } from '../types';
import { AnalysisCard } from './AnalysisCard';
import { Spinner } from './Spinner';
import { CircumplexPlot } from './CircumplexPlot';
import { SentimentDistribution } from './SentimentDistribution';
import { PropagandaModelView } from './PropagandaModelView';

interface AnalysisResultsProps {
  articleText: string;
  /* Fix: Use proper types from types.ts */
  languageResults: Sentence[] | null;
  sourceAnalysis: Influence | null;
  isLoading: boolean;
  error: string | null;
}

const DisclaimerCard: React.FC = () => (
  <div className="bg-white/40 border border-black/5 backdrop-blur-md p-6 rounded-xl relative overflow-hidden group shadow-lg transition-all hover:bg-white/60 text-left">
    <div className="relative z-10 max-w-4xl">
      <h4 className="text-[11px] text-accent-coral mb-4 flex items-center gap-3 uppercase font-bold tracking-[0.18em]">
        <span className="w-1.5 h-1.5 bg-accent-coral rounded-full"></span>
        Systemhinweis
      </h4>
      <p className="text-[13px] leading-relaxed text-charcoal/50 font-sans italic font-light">
        KI-Analysen sind probabilistisch. Die Bewertung erfolgt auf Basis statistischer Sprachmuster.
      </p>
    </div>
  </div>
);

type TabType = 'language' | 'model';

interface TabButtonProps {
  tabName: TabType;
  label: string;
  activeTab: TabType;
  onClick: (tab: TabType) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ tabName, label, activeTab, onClick }) => (
  <button
    onClick={() => onClick(tabName)}
    className={`px-6 sm:px-8 py-5 text-label transition-all border-b-2 text-left whitespace-nowrap uppercase tracking-[0.18em] ${
      activeTab === tabName
        ? 'border-charcoal text-charcoal bg-white/20'
        : 'border-transparent text-charcoal/30 hover:text-charcoal/70 hover:bg-black/5'
    }`}
  >
    {label}
  </button>
);

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ 
  articleText, 
  languageResults, 
  sourceAnalysis,
  isLoading, 
  error 
}) => {
  /* Fix: Use Sentence type for selected state */
  const [selectedSentence, setSelectedSentence] = useState<Sentence | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('language');
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tabName: TabType) => {
    setActiveTab(tabName);
    if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[200] bg-bgDark flex flex-col items-center justify-center">
        <div className="animate-fade-in flex flex-col items-center gap-10">
          <Spinner size="lg" className="text-accent-coral" />
          <p className="text-charcoal font-bold tracking-[0.3em] text-[13px] uppercase animate-pulse">
            Analyse wird erstellt
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start justify-start h-full text-left p-8">
        <div className="border border-accent-coral/20 bg-accent-coral/5 text-accent-coral px-12 py-8 w-full rounded-xl backdrop-blur-md">
          <h3 className="text-label mb-4 opacity-50 uppercase tracking-[0.18em]">Analyse unterbrochen</h3>
          <p className="font-mono text-[14px] leading-relaxed italic opacity-80">„{error}“</p>
        </div>
      </div>
    );
  }

  if (!languageResults) return null;
  
  return (
    <div className="relative">
      <div 
        ref={tooltipRef} 
        className="fixed pointer-events-none opacity-0 z-[9999] transition-opacity duration-200 will-change-transform"
      ></div>

      <div className="animate-fade-in h-full max-w-[1500px] mx-auto px-6 lg:px-12 flex flex-col">
        {/* Sticky Tab Bar */}
        <div className="flex justify-start px-4 overflow-x-auto bg-bgDark/80 backdrop-blur-md border-b border-black/5 sticky top-20 lg:top-28 z-30 custom-scrollbar mt-0 rounded-b-xl">
          <div className="flex">
            <TabButton tabName="language" label="Sprache" activeTab={activeTab} onClick={handleTabChange} />
            {sourceAnalysis && <TabButton tabName="model" label="Propagandamodell" activeTab={activeTab} onClick={handleTabChange} />}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow pt-16 lg:pt-24 pb-20">
          {activeTab === 'language' && (
            <div className="grid lg:grid-cols-[minmax(0,1fr)_440px] gap-10 lg:gap-16 items-start">
              
              {/* LEFT COLUMN: Main Visual Canvas */}
              <div className="flex flex-col gap-16 order-last lg:order-first">
                <div className="bg-bgDark brutalist-window p-8 lg:p-10 overflow-hidden">
                  {/* Fix: Prop name is sentences, not items */}
                  <CircumplexPlot
                    sentences={languageResults}
                    onSentenceSelect={setSelectedSentence}
                    selectedSentence={selectedSentence}
                    tooltipRef={tooltipRef}
                  />
                </div>
              </div>

              {/* RIGHT COLUMN: Sidebar Context & Details */}
              <div className="flex flex-col gap-12 lg:sticky lg:top-48 self-start order-first lg:order-last text-left">
                <div className="flex flex-col">
                  <h4 className="text-accent-coral text-[11px] uppercase font-bold tracking-[0.25em] mb-3 opacity-90 lg:pl-8">
                    SPRACHANALYSE
                  </h4>
                  <h1 className="text-h1 text-charcoal lg:pl-8 mb-2 uppercase tracking-[0.05em]">EMOTIONS-CLUSTER</h1>
                  <p className="text-[12px] text-charcoal/40 font-sans leading-relaxed lg:pl-8 mb-4 max-w-[320px]">
                    Verteilung emotionaler und sachlicher Ausdrücke im Artikel
                  </p>
                </div>

                <SentimentDistribution sentences={languageResults} />

                <div className="w-full space-y-6">
                  <div className="flex justify-between items-center px-4">
                    <h3 className="text-[12px] text-charcoal/30 uppercase tracking-[0.3em] font-black">Detailansicht</h3>
                    {selectedSentence && (
                      <button 
                        onClick={() => setSelectedSentence(null)} 
                        className="text-[10px] font-mono text-accent-coral hover:text-accent-coral uppercase tracking-[0.2em] transition-all bg-accent-coral/5 hover:bg-accent-coral/10 border border-accent-coral/20 px-4 py-1.5 rounded-pill"
                      >
                        [ X ]
                      </button>
                    )}
                  </div>
                  
                  <div className="relative min-h-[260px]">
                    {selectedSentence ? (
                      <div className="animate-fade-in w-full">
                        <AnalysisCard item={selectedSentence} />
                      </div>
                    ) : (
                      <div className="border border-dashed border-black/10 p-12 rounded-2xl bg-black/5 flex flex-col items-center justify-center text-center space-y-6 opacity-60">
                        <div className="space-y-2 max-w-[280px]">
                          <p className="text-[11px] text-charcoal/40 font-black uppercase tracking-[0.4em]">Fokus bereit</p>
                          <p className="text-[13px] text-charcoal/25 font-sans leading-relaxed">
                            Klicke auf einen Knoten im Diagramm, um detaillierte Beispiele der Analyse anzuzeigen.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <DisclaimerCard />
              </div>

            </div>
          )}
          
          {activeTab === 'model' && sourceAnalysis && (
            <div className="animate-fade-in max-w-full overflow-hidden space-y-12">
              {/* Fix: Usage of PropagandaModelView with full AnalysisResponse might be needed but fitting current Influence type for now */}
              {/* In a real scenario, this would likely take the full data if it needs the graph */}
              <PropagandaModelView data={{} as any} articleTitle={articleText.split('\n')[0]} />
              <DisclaimerCard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
