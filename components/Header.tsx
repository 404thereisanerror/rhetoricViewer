import React from 'react';

interface HeaderProps {
    currentView: 'tool' | 'about';
    setView: (view: 'tool' | 'about') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-xl bg-bgDark/60 border-b border-black/5 h-20 lg:h-28">
      <div className="container mx-auto px-6 h-full flex justify-between items-center lg:px-12">
        <div 
          className="cursor-pointer group flex items-center" 
          onClick={() => setView('tool')}
        >
          <h1 className="text-[13px] uppercase tracking-[0.18em] leading-none flex flex-col font-black">
            <span className="text-charcoal opacity-90">Rhetorik</span> 
            <span className="text-charcoal mt-1">Scanner</span>
          </h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-12">
          <button 
            onClick={() => setView('tool')}
            className={`text-[10px] transition-all duration-300 uppercase tracking-[0.15em] font-black ${currentView === 'tool' ? 'text-charcoal' : 'text-charcoal/40 hover:text-charcoal'}`}
          >
            Analyse-Tool
          </button>
          <button 
            onClick={() => setView('about')}
            className={`text-[10px] transition-all duration-300 uppercase tracking-[0.15em] font-black ${currentView === 'about' ? 'text-charcoal' : 'text-charcoal/40 hover:text-charcoal'}`}
          >
            Methodik
          </button>
          <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-black/5 transition-all cursor-pointer">
            <svg className="w-5 h-5 text-charcoal/40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.841 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </div>
        </nav>
      </div>
    </header>
  );
};