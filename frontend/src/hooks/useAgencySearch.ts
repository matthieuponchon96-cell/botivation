import { useState, useEffect, useRef, useCallback } from 'react';
import type { AgencySearchResult, AgencyInfo } from '../types';
import * as api from '../services/api';

export interface SearchState {
  query: string;
  setQuery: (q: string) => void;
  results: AgencySearchResult[];
  isSearching: boolean;
  isResearchingAI: boolean;
  aiResult: AgencyInfo | null;
  aiError: string | null;
  clearResults: () => void;
}

export function useAgencySearch(): SearchState {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AgencySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResearchingAI, setIsResearchingAI] = useState(false);
  const [aiResult, setAiResult] = useState<AgencyInfo | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const dbDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const aiAbortRef = useRef<AbortController | null>(null);

  // Cancel any pending AI research
  const cancelAI = useCallback(() => {
    clearTimeout(aiDebounceRef.current);
    if (aiAbortRef.current) {
      aiAbortRef.current.abort();
      aiAbortRef.current = null;
    }
    setIsResearchingAI(false);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    // Reset on empty
    if (trimmed.length < 1) {
      setResults([]);
      setAiResult(null);
      setAiError(null);
      cancelAI();
      return;
    }

    // Clear previous AI results when query changes
    setAiResult(null);
    setAiError(null);
    cancelAI();

    // Tier 1: Fast local DB search (200ms debounce)
    clearTimeout(dbDebounceRef.current);
    dbDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await api.searchAgencies(trimmed);
        setResults(data);

        // Tier 2: If DB found nothing and query is substantial, launch AI research
        if (data.length === 0 && trimmed.length >= 3) {
          clearTimeout(aiDebounceRef.current);
          aiDebounceRef.current = setTimeout(() => {
            launchAIResearch(trimmed);
          }, 400); // Extra 400ms after DB returns empty
        }
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      clearTimeout(dbDebounceRef.current);
      cancelAI();
    };
  }, [query, cancelAI]);

  async function launchAIResearch(name: string) {
    // Abort any previous AI request
    if (aiAbortRef.current) {
      aiAbortRef.current.abort();
    }
    const controller = new AbortController();
    aiAbortRef.current = controller;

    setIsResearchingAI(true);
    setAiError(null);
    try {
      const result = await api.researchAgency(name);

      // Only update if not aborted
      if (!controller.signal.aborted) {
        setAiResult(result);
        setIsResearchingAI(false);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setAiError(err instanceof Error ? err.message : 'Erreur de recherche');
        setIsResearchingAI(false);
      }
    }
  }

  const clearResults = useCallback(() => {
    setResults([]);
    setAiResult(null);
    setAiError(null);
    cancelAI();
  }, [cancelAI]);

  return { query, setQuery, results, isSearching, isResearchingAI, aiResult, aiError, clearResults };
}
