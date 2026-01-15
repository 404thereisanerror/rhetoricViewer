
import React, { useState, useMemo } from 'react';
/* Fix: Use AnalysisResponse from types.ts */
import { type AnalysisResponse } from '../types';
import { PropagandaGraph, type GraphViewMode } from './PropagandaGraph';
import { buildEmotionTopicActorAggregates, type EmotionLabel } from '../utils/emotionTopicActor';

interface PropagandaModelViewProps {
  /* Fix: This component needs the full analysis to pass to PropagandaGraph */
  data: AnalysisResponse;
  articleTitle: string;
  /* Add optional interactive props to pass down to PropagandaGraph and resolve missing properties error */
  selectedSentenceId?: string | null;
  onSelectNode?: (id: string | null) => void;
}

export const PropagandaModelView: React.FC<PropagandaModelViewProps> = ({ 
  data, 
  articleTitle,
  selectedSentenceId = null,
  // Fix: The default parameter for onSelectNode must match the expected signature with a parameter
  onSelectNode = (id: string | null) => {}
}) => {
  // Fix: Added local state to manage the graph's view mode and selection states within this tab
  const [viewMode, setViewMode] = useState<GraphViewMode>("overview");
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionLabel | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Fix: Compute the Emotion-Topic-Actor aggregates required by PropagandaGraph
  const eta = useMemo(
    () => buildEmotionTopicActorAggregates(data.sentences),
    [data.sentences]
  );

  const handleSelectSentence = (id: string | null) => {
    // Fix: onSelectNode now correctly expects a string | null argument
    onSelectNode(id);
    if (id) {
      setViewMode("sentence");
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
    } else {
      setViewMode("overview");
    }
  };

  const handleSelectTopic = (topicId: string | null) => {
    setSelectedTopicId(topicId);
    if (topicId) {
      setViewMode("topic");
    } else if (selectedEmotion) {
      setViewMode("emotion");
    } else {
      setViewMode("overview");
    }
  };

  const handleResetOverview = () => {
    setViewMode("overview");
    setFocusedNodeId(null);
    setSelectedEmotion(null);
    setSelectedTopicId(null);
    // Fix: onSelectNode now correctly expects a string | null argument
    onSelectNode(null);
  };

  return (
    <div className="space-y-12 animate-fade-in text-left">
      {/* Introduction Header - Compact for focus */}
      <div className="p-8 lg:p-12 bg-white/40 border border-black/5 rounded-xl shadow-card relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-coral/5 blur-[120px] -z-10 rounded-full"></div>
        
        <div className="flex flex-col mb-6">
          <h4 className="text-accent-coral text-[11px] uppercase font-bold tracking-[0.25em] mb-3 opacity-90">
            STRUKTUR-ANALYSE
          </h4>
          <h1 className="text-2xl lg:text-4xl font-black text-charcoal uppercase tracking-tight leading-tight mb-4">
            Propagandamodell
          </h1>
          <div className="max-w-4xl">
            <p className="text-[17px] text-charcoal/60 leading-relaxed font-light font-sans italic border-l-2 border-black/5 pl-6">
                {/* Fix: Access summary from the response object */}
                {data.summary.short_narrative}
            </p>
          </div>
        </div>
      </div>

      {/* Main Graph Component */}
      <div className="w-full">
        {/* Fix: Added all missing required props to PropagandaGraph and corrected prop names. */}
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

      {/* Methodological Footnote */}
      <div className="p-8 border border-dashed border-black/10 rounded-xl bg-black/5 backdrop-blur-sm opacity-60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1.5 h-1.5 bg-black/20 rounded-full"></div>
          <h4 className="text-[10px] text-charcoal/40 uppercase tracking-[0.2em] font-black">Methodik: Chomsky's Filter</h4>
        </div>
        <p className="text-[12px] text-charcoal/50 leading-relaxed font-sans italic max-w-5xl">
          Diese Ebene dekonstruiert Filter 1 (Eigentum) und Filter 3 (Sourcing) des Propagandamodells. Wir untersuchen, welche institutionellen Mächte hinter dem Medium stehen und welche Quellen privilegierten Zugang zur Berichterstattung erhalten. "Flak" und "Feindbilder" sind in die rhetorische Sprachanalyse integriert.
        </p>
      </div>
    </div>
  );
};
