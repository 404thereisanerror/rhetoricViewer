
import React from 'react';
/* Fix: Replace AnalysisItem with Sentence from types.ts */
import { type Sentence } from '../types';

const emotionStyles: { [key: string]: { color: string; hex: string; bg: string } } = {
    wut: { color: 'text-[#C3443D]', hex: '#C3443D', bg: 'bg-[#C3443D]/10' },
    angst: { color: 'text-[#4C94F6]', hex: '#4C94F6', bg: 'bg-[#4C94F6]/10' },
    freude: { color: 'text-[#FFF44F]', hex: '#FFF44F', bg: 'bg-[#FFF44F]/10' },
    ekel: { color: 'text-[#FF9F43]', hex: '#FF9F43', bg: 'bg-[#FF9F43]/10' },
    trauer: { color: 'text-[#222222]', hex: '#222222', bg: 'bg-[#222222]/10' },
    überraschung: { color: 'text-[#3BD39B]', hex: '#3BD39B', bg: 'bg-[#3BD39B]/10' },
    neutral: { color: 'text-[#71717A]', hex: '#71717A', bg: 'bg-[#71717A]/10' },
    default: { color: 'text-[#8A8787]', hex: '#8A8787', bg: 'bg-black/5' }
};

interface AnalysisCardProps {
  item: Sentence;
}

const EmotionChip: React.FC<{ emotion: string }> = ({ emotion }) => {
    const currentEmotion = emotion.toLowerCase();
    const style = emotionStyles[currentEmotion] || emotionStyles.default;
    
    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill border border-black/5 backdrop-blur-sm ${style.bg} ${style.color}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
            <span className="text-[9px] font-bold uppercase tracking-[0.12em]">{emotion}</span>
        </div>
    );
};

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ item }) => {
  /* Fix: emotion is an object {label, intensity} in Sentence type */
  const currentEmotion = item.emotion.label.toLowerCase();
  const style = emotionStyles[currentEmotion] || emotionStyles.default;

  return (
    <div className="relative group/card w-full flex justify-center h-full">
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl py-6 px-7 border border-black/5 shadow-sm flex flex-col gap-6 
                    w-full overflow-hidden transition-all duration-300 ease-out">
        
        <div className="space-y-4">
           <div className="flex items-center justify-between">
               {/* Fix: Sentence uses devices array instead of rhetorical_device field */}
               <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${style.color}`}>
                  Strategie: {item.devices[0]?.name || "Neutral"}
               </span>
               <div className="h-[1px] flex-grow bg-black/5 mx-4"></div>
               <EmotionChip emotion={item.emotion.label} />
           </div>
           
           <blockquote 
              className="text-[18px] text-charcoal/90 leading-tight font-serif font-medium italic border-l-4 pl-6 py-1"
              style={{ borderColor: style.hex }}
           >
              {/* Fix: Sentence uses 'text' field instead of 'sentence' */}
              "{item.text}"
           </blockquote>
        </div>

        <div className="space-y-4 pt-4 border-t border-black/5 flex-grow">
          <div>
            <h4 className="text-[9px] text-charcoal/30 uppercase tracking-[0.2em] font-black mb-2">Analyse-Bericht</h4>
            <p className="text-[14px] text-charcoal/80 font-light leading-relaxed">
                {/* Fix: Use explanation from devices or fallback to notes */}
                {item.devices[0]?.explanation || item.notes || "Keine detaillierte Erläuterung verfügbar."}
            </p>
          </div>
          
          {/* Fix: Use frames array for topic information */}
          {item.frames[0] && (
            <div>
              <h4 className="text-[9px] text-charcoal/30 uppercase tracking-[0.2em] font-black mb-1">Kontextbereich</h4>
              <p className="text-[12px] text-charcoal/50 font-mono uppercase tracking-wider">{item.frames[0].name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
