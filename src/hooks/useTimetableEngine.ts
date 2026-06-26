import { useCallback, useEffect, useRef } from 'react';
import { useTimetableStore } from '../store/timetableStore';
import type {
  DataJson,
  WorkerInMessage,
  WorkerOutMessage,
  ParseResult,
  NormalizedSubject,
} from '../types';

/**
 * Hook that bridges the Zustand store with the timetable generation Web Worker.
 * Provides loadData, startGeneration, cancelGeneration utilities.
 */
export function useTimetableEngine() {
  const store = useTimetableStore();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load & parse data ──
  const loadData = useCallback(async (file?: File) => {
    try {
      let rawJson: DataJson;

      if (file) {
        const text = await file.text();
        rawJson = JSON.parse(text) as DataJson;
      } else {
        // Try to load from public/data.json or bundled data
        const resp = await fetch('/data.json');
        if (!resp.ok) throw new Error('No data.json found. Please upload a file.');
        rawJson = (await resp.json()) as DataJson;
      }

      // Dynamically import the parser module
      const { parseDataJson } = await import('../engine/parser');
      const result: ParseResult = parseDataJson(rawJson);

      store.setParsedData(result);

      if (result.errors.length > 0) {
        store.addToast({
          message: `Parsed with ${result.errors.length} error(s)`,
          type: 'warning',
        });
      } else {
        store.addToast({
          message: `Loaded ${result.subjects.length} subjects with ${result.totalOptions} options`,
          type: 'success',
        });
      }

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      store.setDataError(msg);
      store.addToast({ message: msg, type: 'error' });
      return null;
    }
  }, [store]);

  // ── Start generation ──
  const startGeneration = useCallback(() => {
    const { parsedData, blacklist, electiveGroupRequirements } = useTimetableStore.getState();
    if (!parsedData) return;

    store.startGeneration();

    // Create the web worker
    const worker = new Worker(
      new URL('../engine/timetableGenerator.worker.ts', import.meta.url),
      { type: 'module' }
    );

    store.setWorker(worker);

    // Listen for messages from the worker
    worker.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
      const msg = e.data;
      const currentState = useTimetableStore.getState();

      switch (msg.type) {
        case 'PROGRESS':
          currentState.setProgress(msg.payload);
          break;

        case 'RESULT':
          currentState.addResults([msg.payload.timetable]);
          break;

        case 'BATCH_RESULT':
          currentState.addResults(msg.payload.timetables);
          break;

        case 'COMPLETE':
          currentState.setGenerationComplete(
            msg.payload.totalValid,
            msg.payload.truncated,
            msg.payload.durationMs
          );
          currentState.addToast({
            message: `Generation complete! ${msg.payload.totalValid} valid timetables found in ${(msg.payload.durationMs / 1000).toFixed(1)}s`,
            type: 'success',
          });
          if (msg.payload.totalValid > 0) {
            currentState.setActivePage('viewer');
          }
          break;

        case 'ERROR':
          currentState.setGenerationError(msg.payload.message);
          currentState.addToast({
            message: msg.payload.message,
            type: 'error',
          });
          break;

        case 'WARNING':
          currentState.addToast({
            message: msg.payload.message,
            type: 'warning',
          });
          break;
      }
    };

    worker.onerror = (err) => {
      const currentState = useTimetableStore.getState();
      currentState.setGenerationError(err.message || 'Worker error');
      currentState.addToast({
        message: 'Generation worker error: ' + (err.message || 'Unknown'),
        type: 'error',
      });
    };

    // Send START message to worker
    const startMsg: WorkerInMessage = {
      type: 'START',
      payload: {
        subjects: parsedData.subjects,
        blacklist: Array.from(blacklist),
        electiveGroupRequirements,
        theorySession: useTimetableStore.getState().theorySession,
        maxResults: 5000,
      },
    };

    worker.postMessage(startMsg);
  }, [store]);

  // ── Cancel generation ──
  const cancelGeneration = useCallback(() => {
    store.cancelGeneration();
    store.addToast({ message: 'Generation cancelled', type: 'info' });
  }, [store]);

  // ── Auto-apply filters when dependencies change ──
  useEffect(() => {
    const { generationComplete, allResults } = store;
    if (!generationComplete || allResults.length === 0) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      useTimetableStore.getState().applyFilters();
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    store.whitelist,
    store.searchQuery,
    store.subjectFilter,
    store.venueFilter,
    store.minFreeDays,
    store.generationComplete,
    store.allResults,
  ]);

  return {
    loadData,
    startGeneration,
    cancelGeneration,
    parsedData: store.parsedData,
    dataLoaded: store.dataLoaded,
    dataError: store.dataError,
    isGenerating: store.isGenerating,
    progress: store.progress,
    generationComplete: store.generationComplete,
  };
}
