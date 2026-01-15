import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import UnifiedAnalysisView from "./components/UnifiedAnalysisView";
import { AboutView } from './components/AboutView';
import { analyzeArticle, extractArticleFromUrl } from './services/geminiService';
import { type AnalysisResponse } from './types';

const EXAMPLE_ARTICLE = `Die Regierung wurde für ihre heldenhafte Entscheidung gefeiert. Doch Kritiker warnen vor einer Katastrophe, die das Land in den Abgrund stürzen könnte. Man muss sich fragen, ob die einfachen Bürger wieder die Zeche für die Fehler der Eliten zahlen müssen. Die Zukunft unserer Kinder steht auf dem Spiel! Es ist ein Skandal, der seinesgleichen sucht.`;

const App: React.FC = () => {
  const [view, setView] = useState<'tool' | 'about'>('tool');
  const [articleText, setArticleText] = useState<string>('');
  const [articleSource, setArticleSource] = useState<string>('');
  const [selectedSentenceId, setSelectedSentenceId] = useState<string | null>(null);

  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async (mode: 'url' | 'text' = 'url') => {
    const textToAnalyze = articleText.trim();
    const sourceToUse = articleSource.trim();

    if (mode === 'url' && !sourceToUse) return;
    if (mode === 'text' && !textToAnalyze) return;

    setIsLoading(true);
    setError(null);
    setAnalysisData(null);
    setSelectedSentenceId(null);

    setView('tool');

    try {
      let finalArticleText = textToAnalyze;

      if (mode === 'url') {
        finalArticleText = await extractArticleFromUrl(sourceToUse);
        setArticleText(finalArticleText);
      }

      const result = await analyzeArticle(finalArticleText, mode === 'url' ? sourceToUse : "");
      setAnalysisData(result);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  }, [articleText, articleSource]);

  const handleUseExample = () => {
    setArticleText(EXAMPLE_ARTICLE);
    setArticleSource('https://www.beispiel-zeitung.de/politik/artikel-123');
    const runExample = async () => {
      setIsLoading(true);
      setError(null);
      setAnalysisData(null);
      try {
        const result = await analyzeArticle(EXAMPLE_ARTICLE, 'https://www.beispiel-zeitung.de/politik/artikel-123');
        setAnalysisData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden des Beispiels.');
      } finally {
        setIsLoading(false);
      }
    };
    runExample();
  };

  const showHero = view === 'tool' && !analysisData && !isLoading && !error;

  return (
    <div className="min-h-screen flex flex-col relative bg-transparent">
      <Header currentView={view} setView={setView} />
      
      <main className={`flex-grow z-10 bg-transparent ${showHero || view === 'about' ? 'pt-20 lg:pt-28' : 'pt-24 lg:pt-32'}`}>
        {view === 'about' ? (
          <div className="container mx-auto p-4 lg:p-8">
            <AboutView />
          </div>
        ) : showHero ? (
          <Hero 
            articleSource={articleSource}
            setArticleSource={setArticleSource}
            articleText={articleText}
            setArticleText={setArticleText}
            onAnalyze={handleAnalyze}
            onUseExample={handleUseExample}
            isLoading={isLoading}
          />
        ) : (
          <div className="w-full max-w-[1440px] mx-auto px-3 md:px-6">
            <UnifiedAnalysisView
              data={analysisData}
              isLoading={isLoading}
              error={error}
              selectedSentenceId={selectedSentenceId}
              onSelectSentenceId={setSelectedSentenceId}        
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
