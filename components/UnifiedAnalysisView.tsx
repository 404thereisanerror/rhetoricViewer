
import React, { useMemo, useRef, useState, useEffect } from "react";
import { SentimentDistribution } from "./SentimentDistribution";
import { PropagandaGraph, type GraphViewMode } from "./PropagandaGraph";
import { buildEmotionTopicActorAggregates, type EmotionLabel } from "../utils/emotionTopicActor";
import type { AnalysisResponse } from "../types";

type Props = {
  data: AnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedSentenceId: string | null;
  onSelectSentenceId: (id: string | null) => void;
};

const emotionColorMap: Record<string, string> = {
  ANGST: 'rgba(76, 148, 246, 1)',
  WUT: 'rgba(195, 68, 61, 1)',
  FREUDE: 'rgba(255, 244, 79, 1)',
  EKEL: 'rgba(255, 159, 67, 1)',
  TRAUER: 'rgba(34, 34, 34, 1)',
  NEUTRAL: 'rgba(113, 113, 122, 1)',
  HOFFNUNG: 'rgba(59, 211, 155, 1)',
};

const getEmotionColor = (label: string | undefined): string => {
  if (!label) return 'rgba(113, 113, 122, 1)';
  const upper = label.toUpperCase();
  return emotionColorMap[upper] || 'rgba(113, 113, 122, 1)';
};

export default function UnifiedAnalysisView({
  data,
  isLoading,
  error,
  selectedSentenceId,
  onSelectSentenceId,
}: Props) {
  const [viewMode, setViewMode] = useState<GraphViewMode>("overview");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionLabel | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  
  const articleRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sentences = data?.sentences ?? [];
  const summary = data?.summary;

  const eta = useMemo(
    () => data ? buildEmotionTopicActorAggregates(data.sentences) : { emotions: [] },
    [data]
  );

  const handleSelectSentence = (id: string | null) => {
    onSelectSentenceId(id);
    if (id) {
      setViewMode("sentence");
      setFocusedNodeId(null);
      setSelectedEmotion(null);
      setSelectedTopicId(null);
    } else if (viewMode === "sentence") {
      setViewMode("overview");
    }
  };

  const handleFocusActorNode = (id: string | null) => {
    setFocusedNodeId(id);
    if (id) {
      setViewMode("actor");
      onSelectSentenceId(null);
      setSelectedEmotion(null);
      setSelectedTopicId(null);
    } else if (viewMode === "actor") {
      setViewMode("overview");
    }
  };

  const handleSelectEmotion = (emotion: EmotionLabel | null) => {
    setSelectedEmotion(emotion);
    if (emotion) {
      setViewMode("emotion");
      setSelectedTopicId(null);
      onSelectSentenceId(null);
      setFocusedNodeId(null);
    } else {
      setViewMode("overview");
    }
  };

  const handleSelectTopic = (topicId: string | null) => {
    setSelectedTopicId(topicId);
    if (topicId) {
      setViewMode("topic");
      onSelectSentenceId(null);
      setFocusedNodeId(null);
    } else if (selectedEmotion) {
      setViewMode("emotion");
    } else {
      setViewMode("overview");
    }
  };

  const handleResetOverview = () => {
    setViewMode("overview");
    onSelectSentenceId(null);
    setFocusedNodeId(null);
    setSelectedEmotion(null);
    setSelectedTopicId(null);
  };

  useEffect(() => {
    if (selectedSentenceId && sentenceRefs.current[selectedSentenceId]) {
      sentenceRefs.current[selectedSentenceId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedSentenceId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[200] bg-bgDark flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-fade-in flex flex-col items-center gap-8 max-w-[520px]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/20 border-t-charcoal" />
          <div className="space-y-6">
            <p className="text-charcoal font-bold tracking-[0.3em] text-[13px] uppercase animate-pulse">Analyse wird erstellt</p>
            <p className="text-sm text-black/40 italic">Wir dekonstruieren rhetorische Muster und emotionale Pfade...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start justify-start h-full text-left p-4">
        <div className="border border-charcoal/20 bg-charcoal/5 text-charcoal px-8 py-6 w-full rounded-xl backdrop-blur-md">
          <h3 className="text-label mb-2 opacity-50 uppercase tracking-[0.18em]">Analyse unterbrochen</h3>
          <p className="font-mono text-[14px] leading-relaxed italic opacity-80">„{error}“</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full pb-12 pt-4 animate-fade-in flex flex-col gap-4">
      <div className="rounded-3xl bg-white/80 shadow-sm p-4 border border-black/5 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch gap-4">
          
          <section className="col-span-12 lg:col-span-4 flex flex-col min-w-0 bg-white/40 rounded-2xl border border-black/5 overflow-hidden shadow-inner">
            <div className="p-4 border-b border-black/5 bg-white/20">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-charcoal/40">Artikel & Emotionalisierung</h4>
            </div>
            
            <div className="p-6 bg-white/50 border-b border-black/5 backdrop-blur-sm space-y-4">
                <SentimentDistribution 
                  sentences={sentences} 
                  level={summary?.emotionalization_level}
                  mainEmotions={summary?.main_emotions}
                />
            </div>

            <div ref={articleRef} className="flex-grow overflow-auto custom-scrollbar p-6 space-y-1.5 bg-white/10 h-[500px] lg:h-[calc(100vh-450px)] min-h-[400px]">
              {sentences.map((s) => {
                if (!s) return null;
                const color = getEmotionColor(s.emotion?.label);
                const isActive = selectedSentenceId === s.id;
                
                // Robust background color generation: find the RGB parts and rebuild with dynamic alpha
                const rgbMatch = color.match(/\d+/g);
                const baseOpacity = 0.05 + ((s.pathos_score || 0) * 0.15);
                const bgColor = rgbMatch 
                  ? `rgba(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}, ${baseOpacity})`
                  : 'rgba(113, 113, 122, 0.05)';
                
                return (
                  <div
                    key={s.id}
                    ref={el => { sentenceRefs.current[s.id] = el; }}
                    onClick={() => handleSelectSentence(s.id)}
                    className={`relative p-2.5 rounded-lg cursor-pointer transition-all duration-300 group hover:ring-1 hover:ring-black/5 ${
                      isActive ? 'ring-2 ring-black/10 shadow-sm z-10 scale-[1.01] bg-white' : ''
                    }`}
                    style={{
                      backgroundColor: isActive ? 'white' : bgColor,
                      borderLeft: isActive ? `4px solid ${color}` : `1px solid rgba(0,0,0,0.05)`,
                    }}
                  >
                    <span className={`font-serif leading-relaxed text-[16px] transition-colors ${
                      isActive ? 'text-charcoal font-medium' : 'text-charcoal/70'
                    }`}>
                      {s.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="col-span-12 lg:col-span-8 flex flex-col min-w-0 bg-white rounded-2xl border border-black/5 overflow-hidden relative shadow-2xl h-[500px] lg:h-[calc(100vh-220px)] min-h-[520px]">
            <div className="absolute top-5 left-6 z-20 flex flex-col gap-3">
              <div className="flex bg-white/90 backdrop-blur-md rounded-xl border border-black/5 p-1 shadow-sm">
                <button
                  onClick={handleResetOverview}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    viewMode === 'overview' ? 'bg-charcoal text-white shadow-md' : 'text-charcoal/40 hover:text-charcoal hover:bg-black/5'
                  }`}
                >
                  Übersicht
                </button>
                {selectedEmotion && (
                  <>
                    <div className="w-[1px] h-4 bg-black/10 self-center mx-1" />
                    <button
                      onClick={() => handleSelectEmotion(selectedEmotion)}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        viewMode === 'emotion' ? 'bg-charcoal text-white shadow-md' : 'text-charcoal/40 hover:text-charcoal hover:bg-black/5'
                      }`}
                    >
                      {selectedEmotion}
                    </button>
                  </>
                )}
                {selectedTopicId && (
                  <>
                    <div className="w-[1px] h-4 bg-black/10 self-center mx-1" />
                    <button
                      className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-accent-blue/10 text-accent-blue cursor-default"
                    >
                      Thema-Fokus
                    </button>
                  </>
                )}
              </div>
              
              <div className="px-3 py-1 bg-white/60 backdrop-blur-sm rounded-lg border border-black/5 w-fit">
                 <p className="text-[8px] font-black text-charcoal/30 uppercase tracking-[0.2em]">Navigiere: Emotion → Thema → Akteur</p>
              </div>
            </div>

            <div className="flex-grow w-full h-full relative bg-[#F9F9F9]/30">
              <PropagandaGraph 
                data={data} 
                eta={eta}
                viewMode={viewMode}
                selectedEmotion={selectedEmotion}
                selectedTopicId={selectedTopicId}
                selectedSentenceId={selectedSentenceId}
                focusedNodeId={focusedNodeId}
                onSelectSentenceId={handleSelectSentence}
                onFocusActorNode={handleFocusActorNode}
                onSelectEmotion={handleSelectEmotion}
                onSelectTopic={handleSelectTopic}
                onResetOverview={handleResetOverview}
              />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
