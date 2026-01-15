
import React from 'react';
import { type Sentence } from '../types';

interface SentimentDistributionProps {
    sentences: Sentence[];
    level?: string;
    mainEmotions?: string[];
}

const emotionColors: { [key: string]: string } = {
    wut: '#C3443D',
    angst: '#4C94F6',
    freude: '#FFF44F',
    ekel: '#FF9F43',
    trauer: '#222222',
    überraschung: '#3BD39B',
    neutral: '#B8B6B6',
    schuld: '#020404',
    scham: '#535050',
    empörung: '#C3443D',
    verzweiflung: '#8A8787',
    bewunderung: '#B8B6B6',
    default: '#B8B6B6'
};

export const SentimentDistribution: React.FC<SentimentDistributionProps> = ({ sentences, level, mainEmotions }) => {
    const totalSentences: number = sentences.length;
    if (totalSentences === 0) return null;

    const emotionCounts = sentences.reduce((acc, s) => {
        const em = s.emotion.label.toLowerCase().trim();
        acc[em] = (acc[em] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const emotionalSentences = sentences.filter(s => s.emotion.label.toLowerCase() !== 'neutral');
    const emotionalCount: number = emotionalSentences.length;
    const neutralCount: number = totalSentences - emotionalCount;
    
    const emotionalPercentage = (emotionalCount / totalSentences) * 100;
    const neutralPercentage = (neutralCount / totalSentences) * 100;

    const sortedEmotions = Object.entries(emotionCounts)
        .sort((a, b) => (b[1] as number) - (a[1] as number));

    return (
        <div className="w-full space-y-6">
            {/* Unified Top Metadata: Emotionalisierung & Hauptemotionen */}
            <div className="flex flex-col gap-4 pb-5 border-b border-black/5">
                <div className="flex flex-wrap gap-8">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-charcoal/30">Emotionalisierung</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border mt-1 w-fit ${
                            level === 'hoch' ? 'bg-accent-coral/5 text-accent-coral border-accent-coral/10' : 
                            level === 'mittel' ? 'bg-accent-blue/5 text-accent-blue border-accent-blue/10' : 
                            'bg-black/5 text-charcoal/40 border-black/5'
                        }`}>
                            {level || 'unbekannt'}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-charcoal/30">Hauptemotionen</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {mainEmotions?.map(e => (
                                <span key={e} className="px-1.5 py-0.5 bg-black/5 rounded text-[8px] font-black uppercase tracking-widest text-charcoal/50 border border-black/5">
                                    {e}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Percentage Indicators */}
            <div className="space-y-4 pt-1">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-4xl font-black text-charcoal leading-none tracking-tighter">
                                {Math.round(emotionalPercentage)}
                            </span>
                            <span className="text-[14px] font-bold text-charcoal/30">%</span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-charcoal/30 mt-1">Emotionalisiert</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-4xl font-black text-charcoal/20 leading-none tracking-tighter">
                                {Math.round(neutralPercentage)}
                            </span>
                            <span className="text-[14px] font-bold text-charcoal/10">%</span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-charcoal/20 mt-1">Sachlich</span>
                    </div>
                </div>

                {/* Segmented Progress Bar */}
                <div className="relative h-2 w-full bg-black/5 rounded-full overflow-hidden flex shadow-inner">
                    {sortedEmotions.map(([emotion, count]) => {
                        // Fix: Explicitly cast count to number to satisfy TypeScript requirements for division operation
                        const width = ((count as number) / totalSentences) * 100;
                        const color = emotionColors[emotion] || emotionColors.default;
                        return (
                            <div 
                                key={emotion}
                                style={{ 
                                    width: `${width}%`,
                                    backgroundColor: color
                                }} 
                                className="h-full border-r border-white/20 last:border-none"
                            />
                        );
                    })}
                </div>

                {/* Detailed Emotion List */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3.5 pt-3">
                    {sortedEmotions.map(([emotion, count]) => {
                        const color = emotionColors[emotion] || emotionColors.default;
                        // Fix: Explicitly cast count to number to satisfy TypeScript requirements for division operation
                        const pct = Math.round(((count as number) / totalSentences) * 100);
                        return (
                            <div key={emotion} className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/60 truncate">
                                        {emotion}
                                    </span>
                                </div>
                                <span className="text-[10px] font-black text-charcoal/20">{pct}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
