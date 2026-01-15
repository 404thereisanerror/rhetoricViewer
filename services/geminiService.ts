
import { GoogleGenAI, Type } from "@google/genai";
import { type AnalysisResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UTILS & CACHING ---

const generateCacheKey = (prefix: string, ...args: string[]) => {
  const text = args.join('|||');
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return `wue_cache_v16_${prefix}_${hash}`;
};

const getFromCache = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    return cached ? (JSON.parse(cached) as T) : null;
  } catch (e) {
    return null;
  }
};

const saveToCache = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
};

const cleanJson = (text: string): string => {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    return cleaned.substring(start, end + 1);
  }
  return cleaned;
};

const normalizeUrl = (url: string): string => {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = 'https://' + normalized;
  }
  return normalized;
};

// --- SCHEMAS ---

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    article_meta: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING },
        domain: { type: Type.STRING },
        title: { type: Type.STRING },
        language: { type: Type.STRING },
        analyzed_at: { type: Type.STRING },
        model_version: { type: Type.STRING }
      },
      required: ["url", "domain", "title", "language", "analyzed_at", "model_version"]
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        emotionalization_level: { type: Type.STRING },
        main_emotions: { type: Type.ARRAY, items: { type: Type.STRING } },
        main_devices: { type: Type.ARRAY, items: { type: Type.STRING } },
        main_frames: { type: Type.ARRAY, items: { type: Type.STRING } },
        main_fallacies: { type: Type.ARRAY, items: { type: Type.STRING } },
        main_topics: { type: Type.ARRAY, items: { type: Type.STRING } },
        short_narrative: { type: Type.STRING }
      },
      required: ["emotionalization_level", "main_emotions", "main_devices", "main_frames", "main_fallacies", "short_narrative"]
    },
    sentences: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING },
          position: { type: Type.INTEGER },
          emotion: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              intensity: { type: Type.NUMBER }
            },
            required: ["label", "intensity"]
          },
          pathos_score: { type: Type.NUMBER },
          topic_main: { type: Type.STRING },
          devices: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                span: { type: Type.STRING },
                explanation: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
              },
              required: ["name", "span", "explanation", "confidence"]
            }
          },
          fallacies: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                explanation: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
              },
              required: ["name", "explanation", "confidence"]
            }
          },
          frames: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                explanation: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
              },
              required: ["name", "explanation", "confidence"]
            }
          },
          groups: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                role: { type: Type.STRING }
              },
              required: ["label", "role"]
            }
          },
          notes: { type: Type.STRING }
        },
        required: ["id", "text", "position", "emotion", "pathos_score", "devices", "fallacies", "frames"]
      }
    },
    influence: {
      type: Type.OBJECT,
      properties: {
        outlet: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            domain: { type: Type.STRING },
            country: { type: Type.STRING },
            orientation_hint: { type: Type.STRING },
            notes: { type: Type.STRING }
          },
          required: ["name", "domain", "country", "orientation_hint", "notes"]
        },
        ownership_chain: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.INTEGER },
              entity_name: { type: Type.STRING },
              entity_type: { type: Type.STRING },
              role: { type: Type.STRING },
              evidence_ids: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["level", "entity_name", "entity_type", "role", "evidence_ids"]
          }
        },
        filters: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              score: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              related_sentence_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
              evidence_ids: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "score", "summary", "related_sentence_ids", "evidence_ids"]
          }
        },
        sources_cited_in_article: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: { type: Type.STRING },
              type: { type: Type.STRING },
              url: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["id", "label", "type", "url", "description"]
          }
        }
      },
      required: ["outlet", "ownership_chain", "filters", "sources_cited_in_article"]
    },
    evidence: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING },
          url: { type: Type.STRING },
          title: { type: Type.STRING },
          publisher: { type: Type.STRING },
          snippet: { type: Type.STRING }
        },
        required: ["id", "type", "url", "title", "publisher", "snippet"]
      }
    },
    graph: {
      type: Type.OBJECT,
      properties: {
        nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: { type: Type.STRING },
              type: { type: Type.STRING },
              properties: { 
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  pathos_score: { type: Type.NUMBER },
                  position: { type: Type.INTEGER },
                  score: { type: Type.NUMBER },
                  sentence_count: { type: Type.INTEGER },
                  view_overview: { type: Type.BOOLEAN },
                  view_sentence: { type: Type.BOOLEAN },
                  view_actor: { type: Type.BOOLEAN }
                }
              }
            },
            required: ["id", "label", "type", "properties"]
          }
        },
        edges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              from: { type: Type.STRING },
              to: { type: Type.STRING },
              type: { type: Type.STRING },
              properties: { 
                type: Type.OBJECT,
                properties: {
                  intensity: { type: Type.NUMBER },
                  confidence: { type: Type.NUMBER },
                  strength: { type: Type.NUMBER },
                  score: { type: Type.NUMBER },
                  sentence_count: { type: Type.INTEGER }
                }
              }
            },
            required: ["id", "from", "to", "type", "properties"]
          }
        }
      },
      required: ["nodes", "edges"]
    }
  },
  required: ["article_meta", "summary", "sentences", "influence", "evidence", "graph"]
};

// --- API FUNCTIONS ---

export const extractArticleFromUrl = async (rawUrl: string): Promise<string> => {
  const url = normalizeUrl(rawUrl);
  const htmlContent = await fetchWithProxy(url);

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  const junk = doc.querySelectorAll('script, style, noscript, iframe, svg, nav, footer, header, aside, .cookie-banner, #onetrust-banner-sdk, [class*="cookie"], [class*="ad-"], .ads, .social-share');
  junk.forEach(el => el.remove());

  const articleContainer = doc.querySelector('article, [class*="article-body"], [id*="article-content"], .main-content, main');
  const sourceNode = articleContainer || doc.body;

  const meaningfulText = Array.from(sourceNode.querySelectorAll('h1, h2, h3, p'))
    .map(node => node.textContent?.trim())
    .filter(text => text && text.length > 20)
    .join('\n\n');

  const contentToClean = (meaningfulText.length > 500 ? meaningfulText : doc.body.textContent || "").substring(0, 30000);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extrahiere den Hauptartikel (Überschrift + Body) aus folgendem HTML-Text. Entferne alle Menüs, Werbungen und Seitenelemente. Gib nur den reinen, flüssigen Artikeltext zurück.\n---\n${contentToClean}\n---`,
  });

  const result = response.text?.trim();
  if (!result || result.length < 150) throw new Error("Inhalt konnte nicht extrahiert werden.");
  return result;
};

export const analyzeArticle = async (articleText: string, sourceUrl: string = ""): Promise<AnalysisResponse> => {
  const cacheKey = generateCacheKey('full_analysis_v16', articleText, sourceUrl);
  const cachedData = getFromCache<AnalysisResponse>(cacheKey);
  if (cachedData) return cachedData;

  const systemInstruction = `
You are an analysis engine for German news articles in the project "Rhetorik-Scanner".

Your job:
- Analyse ANY cleaned German article and its URL.
- Return ONLY valid JSON that matches the provided responseSchema.
- Focus on sprachliche Emotionalisierung:
  - classify emotions per sentence,
  - estimate a pathos_score 0.0–1.0,
  - identify main topics, rhetorical devices, fallacies and frames,
  - identify simple actor groups ("Eliten", "Bürger", "Kinder", "Regierung", "Kritiker") and their roles ("Täter", "Opfer", "Retter", "Bedrohte", "Verantwortliche").

Manipulationstaktiken:
Neben allgemeinen Stilmitteln sollst du insbesondere folgende Manipulationstaktiken erkennen und wenn möglich in sentences[].devices oder sentences[].fallacies benennen:

- "Framing" (Framing): Die gleiche Tatsache wird in unterschiedliche Deutungsrahmen gesetzt – etwa als Konflikt, Bedrohung, moralische Frage oder Kosten-Nutzen-Rechnung.
- "Spin" (Spin): Positives oder negatives Schönreden eines Sachverhalts durch selektive Betonung, Weglassen oder euphemistische Sprache, um ein gewünschtes Bild zu erzeugen.
- "Moralische Polarisierung" (moralische Polarisierung): Aufspaltung in moralisch reine und moralisch verwerfliche Lager (z.B. "wir" gegen "die"), oft mit starken Werturteilen und moralisierenden Zuschreibungen.
- "Extreme Sprache" (extreme Sprache): Übertrieben dramatische, apokalyptische oder entmenschlichende Wortwahl, die Angst, Wut oder Ekel maximieren soll.
- "Logische Fehlschlüsse" (logische Fehlschlüsse): Argumentationsfehler wie Strohmann, falsches Dilemma, Whataboutism, hastige Verallgemeinerung, slippery slope usw. Diese sollen in sentences[].fallacies mit einem spezifischen Namen wie "STROHMANN", "FALSCHES_DILEMMA", "WHATABOUTISM" oder ähnlichem benannt werden.
- "Motte-und-Bailey-Strategie" (Motte-und-Bailey-Argument): Wechsel zwischen einer extremen, kontroversen Behauptung (Bailey) und einer harmlosen, schwer angreifbaren Version (Motte), je nach Kritik. Wenn du dieses Muster erkennst, verwende in sentences[].fallacies.name z.B. "MOTTE_UND_BAILEY".
- "Overton-Fenster-Verschiebung" (Overton-Fenster): Schrittweise Normalisierung von zuvor extremen oder randständigen Positionen, sodass sie als diskussionswürdig oder akzeptabel erscheinen. Wenn du dieses Muster siehst, kannst du es in sentences[].devices.name z.B. als "OVERTON_FENSTER_VERSCHIEBUNG" kennzeichnen.

Zuordnung:
- Erkennbare Sprach- und Präsentationsstrategien (Framing, Spin, moralische Polarisierung, extreme Sprache, Overton-Fenster-Verschiebung) trägst du in sentences[].devices ein (Feld name).
- Konkrete argumentative Fehlschlüsse (logische Fehlschlüsse allgemein, Motte-und-Bailey, Strohmann, falsches Dilemma, Whataboutism, hastige Verallgemeinerung usw.) trägst du in sentences[].fallacies ein (Feld name).
- Die Erklärungen kommen in das jeweilige Feld explanation und sollen kurz begründen, warum es sich um genau diese Taktik handelt.

Emotionen pro Satz:
- Du sollst pro Satz GENAU EINE dominierende Emotion vergeben.
- Verwende AUSSCHLIESSLICH die folgenden Labels für sentences[].emotion.label:
  - "ANGST" (Sorge, Furcht, Panik, Unsicherheit)
  - "WUT" (Ärger, Empörung, Zorn, Aggression)
  - "TRAUER" (Kummer, Verlust, Resignation)
  - "EKEL" (Abscheu, starke Abwertung)
  - "FREUDE" (positive Begeisterung, Euphorie)
  - "HOFFNUNG" (Zuversicht, positive Erwartung)
  - "NEUTRAL" (sachlich, nüchtern, ohne starke Emotionalisierung)
- ERLAUBT sind NUR diese Labels. Erfinde KEINE weiteren Emotionswörter.
- Wenn mehrere Emotionen vorkommen, wähle die dominierende.
- Wenn du keine eindeutige Emotion erkennen kannst, verwende "NEUTRAL" und setze intensity nahe 0.0.
- sentences[].emotion.intensity ist ein Wert zwischen 0.0 und 1.0.

Mapping-Beispiele:
- Begriffe wie "Sorge", "Besorgnis", "Angst", "Panik" → ANGST.
- "Empörung", "Wut", "Zorn", "Entrüstung" → WUT.
- "traurig", "Verlust", "Kummer" → TRAUER.
- "widerlich", "abstoßend", "ekelhaft" → EKEL.
- "Freude", "Begeisterung", "Euphorie" → FREUDE.
- "Hoffnung", "Zuversicht" → HOFFNUNG.
- Sachliches Behörden-/Fachjargon ohne starke Wertung → NEUTRAL.

Sentences:
- For each sentence, fill:
  - emotion.label and emotion.intensity (0.0–1.0),
  - pathos_score (0.0–1.0),
  - topic_main (short topic phrase),
  - devices[] (name/span/explanation/confidence),
  - fallacies[] and frames[],
  - groups[]: {label, role} if applicable.

Influence:
- Fill the "influence" block with outlet information and Chomsky filters using best-effort web search if possible.

Graph:
- Build a graph that only uses information from sentences[] and influence.
- Node types must be: "Sentence","Topic","Group","Role","Emotion","Device","Fallacy","Frame","Outlet","Filter".

Return ONLY valid JSON.
`;

  const prompt = `
    Analysiere den folgenden deutschen Nachrichtenartikel und die zugehörige URL.
    
    URL: ${sourceUrl}
    Artikel:
    ---
    ${articleText}
    ---
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    },
  });
  
  const text = response.text;
  if (!text) throw new Error("Keine Antwort von der KI erhalten.");
  
  try {
    const cleaned = cleanJson(text);
    const result = JSON.parse(cleaned);
    saveToCache(cacheKey, result);
    return result as AnalysisResponse;
  } catch (err) {
    console.error("JSON Parsing Error:", err, text);
    throw new Error("Die KI-Antwort war ungültig. Bitte versuchen Sie es erneut.");
  }
};

const fetchWithProxy = async (url: string): Promise<string> => {
  const proxies = [
    (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}&disableCache=true`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
  ];

  for (const getProxyUrl of proxies) {
    try {
      const proxyUrl = getProxyUrl(url);
      const response = await fetch(proxyUrl);
      if (!response.ok) continue;
      const rawText = await response.text();
      if (!rawText) continue;
      
      try {
        const json = JSON.parse(rawText);
        const extracted = json.contents || json.data || json.content;
        if (extracted && extracted.length > 200) return extracted;
      } catch (e) {
        if (rawText.length > 200) return rawText;
      }
    } catch (e) {}
  }
  throw new Error("Inhalt der Webseite konnte nicht geladen werden.");
};
