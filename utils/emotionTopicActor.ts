
import { type AnalysisResponse, type Sentence } from '../types';

export type EmotionLabel =
  | "ANGST"
  | "WUT"
  | "TRAUER"
  | "EKEL"
  | "FREUDE"
  | "HOFFNUNG"
  | "NEUTRAL";

export interface GroupRoleAggregate {
  groupLabel: string;
  role: string;
  sentenceIds: string[];
  avgPathos: number;
}

export interface TopicAggregate {
  id: string;
  label: string;
  emotion: EmotionLabel;
  sentenceIds: string[];
  avgPathos: number;
  groups: GroupRoleAggregate[];
}

export interface EmotionAggregate {
  emotion: EmotionLabel;
  topics: TopicAggregate[];
  totalSentenceCount: number;
  avgPathos: number;
}

export interface EmotionTopicActorAggregates {
  emotions: EmotionAggregate[];
}

const slugify = (text: string) => (text || 'general').toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);

export function buildEmotionTopicActorAggregates(
  sentences: Sentence[]
): EmotionTopicActorAggregates {
  const emotionMap = new Map<EmotionLabel, Map<string, TopicAggregate>>();

  if (!sentences || !Array.isArray(sentences)) return { emotions: [] };

  sentences.forEach((s) => {
    if (!s || !s.emotion) return;

    const label = (s.emotion.label?.toUpperCase() || "NEUTRAL") as EmotionLabel;
    const topicText = s.topic_main || "Allgemein";
    // Unique ID: combine emotion and topic to avoid D3 collision if same topic exists in multiple emotions
    const topicSlug = slugify(topicText);
    const topicId = `${label}_topic_${topicSlug}`;

    if (!emotionMap.has(label)) {
      emotionMap.set(label, new Map());
    }

    const topicsForEmotion = emotionMap.get(label)!;
    if (!topicsForEmotion.has(topicId)) {
      topicsForEmotion.set(topicId, {
        id: topicId,
        label: topicText,
        emotion: label,
        sentenceIds: [],
        avgPathos: 0,
        groups: []
      });
    }

    const topic = topicsForEmotion.get(topicId)!;
    topic.sentenceIds.push(s.id);
    topic.avgPathos += (s.pathos_score || 0);

    if (s.groups && Array.isArray(s.groups)) {
      s.groups.forEach((g) => {
        if (!g || !g.label) return;
        let groupAgg = topic.groups.find(
          (ga) => ga.groupLabel === g.label && ga.role === g.role
        );
        if (!groupAgg) {
          groupAgg = {
            groupLabel: g.label,
            role: g.role || 'Akteur',
            sentenceIds: [],
            avgPathos: 0
          };
          topic.groups.push(groupAgg);
        }
        groupAgg.sentenceIds.push(s.id);
        groupAgg.avgPathos += (s.pathos_score || 0);
      });
    }
  });

  const emotions: EmotionAggregate[] = [];

  emotionMap.forEach((topicsMap, label) => {
    const topics = Array.from(topicsMap.values());
    
    topics.forEach(t => {
      if (t.sentenceIds.length > 0) {
        t.avgPathos = t.avgPathos / t.sentenceIds.length;
      }
      t.groups.forEach(g => {
        if (g.sentenceIds.length > 0) {
          g.avgPathos = g.avgPathos / g.sentenceIds.length;
        }
      });
    });

    const totalSentences = topics.reduce((acc, t) => acc + t.sentenceIds.length, 0);
    const totalPathos = topics.reduce((acc, t) => acc + (t.avgPathos * t.sentenceIds.length), 0);

    emotions.push({
      emotion: label,
      topics,
      totalSentenceCount: totalSentences,
      avgPathos: totalSentences > 0 ? totalPathos / totalSentences : 0
    });
  });

  return { emotions };
}
