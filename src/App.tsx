import React from 'react';
import { useTimetableStore } from './store/timetableStore';
import { GeneratorPage } from './pages/GeneratorPage';
import { ViewerPage } from './pages/ViewerPage';
import { SavedPage } from './pages/SavedPage';
import { DarkModeToggle } from './components/DarkModeToggle';

function App() {
  const { activePage, setActivePage } = useTimetableStore();

  return (
    <div className="min-h-screen bg-surface-900 text-surface-50 selection:bg-brand-500/30 font-sans">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-surface-800/80 backdrop-blur-md border-b border-surface-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo area */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center shadow-lg shadow-brand-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight hidden sm:block">TimetableGen</span>
            </div>

            {/* Nav links */}
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={() => setActivePage('generator')}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'generator' ? 'text-white' : 'text-surface-300 hover:text-white hover:bg-surface-700/50'
                }`}
              >
                Generate
                {activePage === 'generator' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-brand-400 to-accent-cyan rounded-t-full" />
                )}
              </button>
              
              <button
                onClick={() => setActivePage('viewer')}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'viewer' ? 'text-white' : 'text-surface-300 hover:text-white hover:bg-surface-700/50'
                }`}
              >
                View Results
                {activePage === 'viewer' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-brand-400 to-accent-cyan rounded-t-full" />
                )}
              </button>

              <button
                onClick={() => setActivePage('saved')}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'saved' ? 'text-white' : 'text-surface-300 hover:text-white hover:bg-surface-700/50'
                }`}
              >
                Saved
                {activePage === 'saved' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-brand-400 to-accent-cyan rounded-t-full" />
                )}
              </button>
            </div>

            {/* Right side actions */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <DarkModeToggle />
            </div>

          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`transition-opacity duration-300 ${activePage === 'generator' ? 'block opacity-100' : 'hidden opacity-0'}`}>
          <GeneratorPage />
        </div>
        <div className={`transition-opacity duration-300 ${activePage === 'viewer' ? 'block opacity-100' : 'hidden opacity-0'}`}>
          <ViewerPage />
        </div>
        <div className={`transition-opacity duration-300 ${activePage === 'saved' ? 'block opacity-100' : 'hidden opacity-0'}`}>
          <SavedPage />
        </div>
      </div>
    </div>
  );
}

export default App;
