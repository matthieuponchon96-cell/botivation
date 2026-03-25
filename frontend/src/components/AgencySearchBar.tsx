import { useState, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { useAgencySearch } from '../hooks/useAgencySearch';
import { useToast } from '../hooks/useToast';
import { AgencyDropdownItem } from './AgencyDropdownItem';
import { Button } from './ui/Button';
import { avatarColor, avatarLetter } from '../utils/avatarColor';
import { escapeHtml } from '../utils/escapeHtml';
import * as api from '../services/api';
import type { AgencyInfo } from '../types';

export function AgencySearchBar() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { query, setQuery, results, isSearching, isResearchingAI, aiResult, aiError, clearResults } = useAgencySearch();
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showInstructions, setShowInstructions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasDropdownContent = results.length > 0 || isResearchingAI || aiResult !== null || aiError !== null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show dropdown when content is available
  useEffect(() => {
    if (hasDropdownContent && query.length > 0) {
      setShowDropdown(true);
      setHighlightIndex(-1);
    }
  }, [hasDropdownContent, query.length]);

  function selectAgency(agency: AgencyInfo) {
    dispatch({ type: 'SET_SELECTED_AGENCY', agency });
    setQuery('');
    setShowDropdown(false);
    clearResults();
  }

  function handleSelectFromDropdown(result: typeof results[0]) {
    selectAgency({
      key: result.key,
      name: result.name,
      ville_agence: result.ville,
      specialite: result.specialite_short,
      projet_notable: result.projet_notable,
      nom_dirigeant: result.nom_dirigeant,
      ce_qui_attire: result.ce_qui_attire,
      competence_cle: result.competence_cle,
    });
  }

  function handleSelectAIResult() {
    if (!aiResult) return;
    selectAgency(aiResult);
    toast.show(`Agence "${aiResult.name}" trouvee par l'IA !`);
  }

  function handleDeselect() {
    dispatch({ type: 'SET_SELECTED_AGENCY', agency: null });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (showDropdown) {
      const totalItems = results.length + (aiResult ? 1 : 0);

      if (e.key === 'ArrowDown' && totalItems > 0) {
        e.preventDefault();
        setHighlightIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        return;
      } else if (e.key === 'ArrowUp' && totalItems > 0) {
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        return;
      } else if (e.key === 'Enter' && highlightIndex >= 0) {
        e.preventDefault();
        if (highlightIndex < results.length) {
          handleSelectFromDropdown(results[highlightIndex]);
        } else if (aiResult) {
          handleSelectAIResult();
        }
        return;
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
        return;
      }
    }
  }

  async function handleGenerate() {
    if (!state.selectedAgency || state.baseLetter.trim().length < 50) return;

    dispatch({ type: 'SET_GENERATING', value: true });
    try {
      const result = await api.generate(
        state.selectedAgency.key,
        state.baseLetter,
        state.userInstructions || undefined,
      );
      const html = escapeHtml(result.personalized_letter);
      dispatch({ type: 'SET_PERSONALIZED_LETTER', letter: result.personalized_letter, html, segments: result.highlights || [] });
      dispatch({ type: 'SET_SELECTED_AGENCY', agency: result.agency_info });
      dispatch({ type: 'SET_ACTIVE_TAB', tab: 'preview' });
      toast.show('Lettre personnalisee generee !');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      dispatch({ type: 'SET_GENERATING', value: false });
    }
  }

  const canGenerate = state.selectedAgency !== null && state.baseLetter.trim().length >= 50;
  const agency = state.selectedAgency;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 -mt-6 mb-6 relative z-20" ref={containerRef}>
      <div className="glass rounded-4xl p-5 shadow-lg border border-white/60 space-y-3">
        {/* Search row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            {agency ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-3xl border border-sage-200 bg-sage-50">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ backgroundColor: avatarColor(agency.name) }}
                >
                  {avatarLetter(agency.name)}
                </div>
                <span className="font-medium text-sage-700 text-sm">{agency.name}</span>
                <span className="text-xs text-sage-400">{agency.ville_agence}</span>
                <button
                  type="button"
                  onClick={handleDeselect}
                  className="ml-auto text-sage-400 hover:text-sage-600 transition-colors text-lg leading-none cursor-pointer"
                >
                  &times;
                </button>
              </div>
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => hasDropdownContent && query.length > 0 && setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder="Nom d'agence ou d'architecte..."
                className="w-full px-4 py-3 rounded-3xl border border-stone-200 bg-white/80 text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-300 text-sm"
              />
            )}

            {/* Dropdown */}
            {showDropdown && hasDropdownContent && !agency && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden z-30 agency-dropdown-enter">
                <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                  {/* Local DB results */}
                  {results.map((result, i) => (
                    <AgencyDropdownItem
                      key={result.key}
                      name={result.name}
                      ville={result.ville}
                      specialiteShort={result.specialite_short}
                      nomDirigeant={result.nom_dirigeant}
                      isHighlighted={i === highlightIndex}
                      onClick={() => handleSelectFromDropdown(result)}
                    />
                  ))}

                  {/* AI research loading */}
                  {isResearchingAI && (
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="spinner text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm text-stone-500">Recherche par l'IA en cours...</p>
                        <p className="text-xs text-stone-400">L'agence n'est pas dans la base, Gemini cherche les infos</p>
                      </div>
                    </div>
                  )}

                  {/* AI result */}
                  {aiResult && (
                    <button
                      type="button"
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                        highlightIndex === results.length ? 'bg-sage-50' : 'hover:bg-stone-50'
                      }`}
                      onClick={handleSelectAIResult}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ring-2 ring-amber-300"
                        style={{ backgroundColor: avatarColor(aiResult.name) }}
                      >
                        {avatarLetter(aiResult.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-stone-800 text-sm truncate">
                            {aiResult.name}
                            <span className="ml-2 text-[10px] font-normal text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">IA</span>
                          </span>
                          <span className="text-xs text-stone-400 shrink-0">{aiResult.ville_agence}</span>
                        </div>
                        {aiResult.nom_dirigeant && (
                          <p className="text-xs text-stone-500 truncate">{aiResult.nom_dirigeant}</p>
                        )}
                        <p className="text-xs text-stone-400 truncate mt-0.5">{aiResult.specialite}</p>
                      </div>
                    </button>
                  )}

                  {/* AI error */}
                  {aiError && (
                    <div className="px-4 py-3 text-xs text-red-500">
                      {aiError}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            className="!rounded-3xl !px-6 shrink-0"
            loading={state.isGenerating}
            loadingText="Generation..."
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            Generer la lettre
          </Button>
        </div>

        {/* Agency detail card — shows what info the AI will use */}
        {agency && (
          <div className="bg-white/60 rounded-2xl border border-sage-100 px-4 py-3 space-y-2">
            <p className="text-[11px] font-semibold text-sage-500 uppercase tracking-wider">
              Elements utilises pour personnaliser votre lettre
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {agency.nom_dirigeant && (
                <InfoRow label="Dirigeant" value={agency.nom_dirigeant} />
              )}
              {agency.ville_agence && (
                <InfoRow label="Ville" value={agency.ville_agence} />
              )}
              {agency.specialite && (
                <InfoRow label="Specialite" value={agency.specialite} />
              )}
              {agency.projet_notable && (
                <InfoRow label="Projets notables" value={agency.projet_notable} />
              )}
              {agency.ce_qui_attire && (
                <InfoRow label="Ce qui attire" value={agency.ce_qui_attire} />
              )}
              {agency.competence_cle && (
                <InfoRow label="Competences cles" value={agency.competence_cle} />
              )}
            </div>
          </div>
        )}

        {/* Instructions toggle + field */}
        <div>
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-xs text-stone-400 hover:text-sage-500 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className={`transition-transform ${showInstructions ? 'rotate-90' : ''}`}>&#9654;</span>
            Consignes supplementaires pour l'IA
          </button>
          {showInstructions && (
            <textarea
              value={state.userInstructions}
              onChange={(e) => dispatch({ type: 'SET_USER_INSTRUCTIONS', text: e.target.value })}
              rows={2}
              placeholder="Ex: Insiste sur mon experience en BIM, adopte un ton plus formel, mentionne mon stage chez X..."
              className="w-full mt-2 px-4 py-2 rounded-2xl border border-stone-200 bg-white/80 text-stone-600 placeholder-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-sage-300 resize-none"
            />
          )}
        </div>

        {/* Help text */}
        {!agency && (
          <p className="text-xs text-stone-400">
            Tapez un nom d'agence — les resultats locaux s'affichent instantanement, sinon l'IA recherche automatiquement
          </p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs leading-relaxed">
      <span className="text-stone-400 shrink-0 w-28">{label}</span>
      <span className="text-stone-600">{value}</span>
    </div>
  );
}
