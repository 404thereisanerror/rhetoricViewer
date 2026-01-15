
export interface ArticleMeta {
  url: string;
  domain: string;
  title: string;
  language: string;
  analyzed_at: string;
  model_version: string;
}

export interface Summary {
  emotionalization_level: 'gering' | 'mittel' | 'hoch';
  main_emotions: string[];
  main_devices: string[];
  main_frames: string[];
  main_fallacies: string[];
  main_topics?: string[];
  short_narrative: string;
}

export interface Device {
  name: string;
  span: string;
  explanation: string;
  confidence: number;
}

export interface Fallacy {
  name: string;
  explanation: string;
  confidence: number;
}

export interface Frame {
  name: string;
  explanation: string;
  confidence: number;
}

export interface Sentence {
  id: string;
  text: string;
  position: number;
  emotion: {
    label: string;
    intensity: number;
  };
  pathos_score: number;
  topic_main?: string;
  devices: Device[];
  fallacies: Fallacy[];
  frames: Frame[];
  groups?: { label: string; role: string }[];
  notes?: string;
}

export interface OwnershipChain {
  level: number;
  entity_name: string;
  entity_type: 'OWNER' | 'HOLDING' | 'FOUNDATION' | 'OTHER';
  role: string;
  evidence_ids: string[];
}

export interface Filter {
  name: 'EIGENTUM' | 'WERBUNG' | 'SOURCING' | 'FLAK' | 'IDEOLOGIE';
  score: number;
  summary: string;
  related_sentence_ids: string[];
  evidence_ids: string[];
}

export interface CitedSourceInArticle {
  id: string;
  label: string;
  type: 'PERSON' | 'INSTITUTION' | 'MEDIUM' | 'UNSPECIFIED';
  url: string;
  description: string;
}

export interface Evidence {
  id: string;
  type: 'OWNERSHIP' | 'SOURCING' | 'CONTEXT' | 'OTHER';
  url: string;
  title: string;
  publisher: string;
  snippet: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  group?: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  properties: Record<string, any>;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Influence {
  outlet: {
    name: string;
    domain: string;
    country: string;
    orientation_hint: string;
    notes: string;
  };
  ownership_chain: OwnershipChain[];
  filters: Filter[];
  sources_cited_in_article: CitedSourceInArticle[];
}

export interface AnalysisResponse {
  article_meta: ArticleMeta;
  summary: Summary;
  sentences: Sentence[];
  influence: Influence;
  evidence: Evidence[];
  graph: Graph;
}
