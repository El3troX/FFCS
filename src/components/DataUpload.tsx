import React, { useState, useRef, useCallback } from 'react';
import { useTimetableStore } from '../store/timetableStore';

type DataUploadProps = {
  onLoadData: (file?: File) => Promise<any>;
};

export function DataUpload({ onLoadData }: DataUploadProps) {
  const { dataLoaded, parsedData, dataError } = useTimetableStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.json')) {
      useTimetableStore.getState().addToast({
        message: 'Please upload a .json file',
        type: 'error',
      });
      return;
    }
    setIsLoading(true);
    await onLoadData(file);
    setIsLoading(false);
  }, [onLoadData]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // If data is loaded, show summary
  if (dataLoaded && parsedData) {
    const electiveGroups = new Set<string>();
    parsedData.subjects.forEach(s => { if (s.group) electiveGroups.add(s.group); });

    return (
      <div className="glass-card rounded-xl p-5 space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-emerald/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-100">Data Loaded</h3>
            <p className="text-xs text-surface-400">Ready to generate timetables</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-surface-800/40 text-center">
            <p className="text-lg font-bold text-brand-400">{parsedData.subjects.length}</p>
            <p className="text-[0.65rem] text-surface-400">Subjects</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-800/40 text-center">
            <p className="text-lg font-bold text-accent-cyan">{parsedData.totalOptions}</p>
            <p className="text-[0.65rem] text-surface-400">Options</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-800/40 text-center">
            <p className="text-lg font-bold text-accent-purple">{parsedData.allFaculty.length}</p>
            <p className="text-[0.65rem] text-surface-400">Faculty</p>
          </div>
        </div>

        {electiveGroups.size > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {[...electiveGroups].map(g => (
              <span key={g} className="px-2 py-0.5 rounded-full text-[0.65rem] bg-accent-purple/15 text-purple-300 border border-purple-500/15 font-medium">
                {g}
              </span>
            ))}
          </div>
        )}

        {(parsedData.errors.length > 0 || parsedData.warnings.length > 0) && (
          <div className="space-y-1">
            {parsedData.errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/15 text-xs text-red-300/80">
                <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {err}
              </div>
            ))}
            {parsedData.warnings.map((warn, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/15 text-xs text-amber-300/80">
                <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {warn}
              </div>
            ))}
          </div>
        )}

        {/* Re-upload option */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full text-center text-xs text-surface-500 hover:text-surface-300 transition-colors py-1 cursor-pointer"
        >
          Upload different file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer
          transition-all duration-300 group
          ${isDragging
            ? 'drop-zone-active border-brand-400 bg-brand-500/5'
            : 'border-surface-600/30 hover:border-surface-500/50 hover:bg-surface-800/30'
          }
          ${isLoading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full border-2 border-brand-500/30 border-t-brand-400 animate-spin" />
            <p className="text-sm text-surface-300">Loading data...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`
              w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
              ${isDragging ? 'bg-brand-500/20 scale-110' : 'bg-surface-800/50 group-hover:bg-surface-700/50'}
            `}>
              <svg
                className={`w-7 h-7 transition-colors ${isDragging ? 'text-brand-400' : 'text-surface-500 group-hover:text-surface-300'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-surface-200">
                Drop your <span className="text-brand-400">data.json</span> here
              </p>
              <p className="text-xs text-surface-500 mt-1">
                or click to browse
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {/* Auto-load option */}
      <div className="flex gap-2">
        <button
          onClick={async () => {
            setIsLoading(true);
            await onLoadData();
            setIsLoading(false);
          }}
          className="flex-1 py-2.5 rounded-lg text-xs font-medium text-surface-400
            hover:text-surface-200 bg-surface-800/30 hover:bg-surface-800/50
            border border-surface-600/20 transition-all cursor-pointer"
        >
          Load Example Data (B.Tech CSE/DS 4th Year)
        </button>

        <a
          href="/datatemplate.json"
          download="datatemplate.json"
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium 
            text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20
            border border-brand-500/20 transition-all cursor-pointer"
          title="Download the JSON schema template"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download Template
        </a>
      </div>

      <div className="mt-4 pt-4 border-t border-surface-600/30">
        <details className="group">
          <summary className="text-xs font-medium text-surface-400 hover:text-surface-200 cursor-pointer flex items-center gap-1.5 transition-colors">
            <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            View JSON Data Schema Template
          </summary>
          <div className="mt-3 p-3 bg-[#0d1117] rounded-lg border border-surface-700/50 overflow-x-auto">
            <pre className="text-[10px] leading-relaxed text-surface-300 font-mono">
{`{
  "Example Theory Subject": {
    "credits": 3,
    "type": "THEORY",
    "mandatory": true,
    "options": [
      {
        "faculty": "Dr. Alan Turing",
        "slot": "A1+TA1",
        "venue": "SJT101"
      }
    ]
  },
  "Example Elective": {
    "credits": 3,
    "type": "THEORY",
    "mandatory": false,
    "group": "Professional Elective",
    "options": [
      {
        "faculty": "Dr. Grace Hopper",
        "slot": "C1+TC1",
        "venue": "PRP301"
      }
    ]
  }
}`}
            </pre>
          </div>
        </details>
        
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs text-brand-200/90">
          <svg className="w-4 h-4 shrink-0 mt-0.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="leading-relaxed">
            <strong>Pro Tip:</strong> You can copy this data template and give it to an AI like ChatGPT along with your university's course list and teachers. Just ask it to <span className="text-brand-300 font-medium">"Create a data.json file following this exact schema based on my course list. Don't forget to mention what subjects are mandatory!"</span> and you'll have your personalized dataset ready in seconds.
          </p>
        </div>
      </div>

      {dataError && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/15 text-xs text-red-300/80 animate-slide-up">
          <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {dataError}
        </div>
      )}
    </div>
  );
}

export default DataUpload;
