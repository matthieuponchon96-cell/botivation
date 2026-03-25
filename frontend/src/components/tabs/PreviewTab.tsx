import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { copyToClipboard, downloadTxt } from '../../utils/download';
import { escapeHtml } from '../../utils/escapeHtml';
import * as api from '../../services/api';
import type { HighlightSegment } from '../../types';

// Color mapping for highlight categories
const HIGHLIGHT_COLORS: Record<string, { bg: string; label: string }> = {
  specialite:     { bg: 'bg-blue-100 text-blue-900',    label: 'Specialite' },
  projet_notable: { bg: 'bg-purple-100 text-purple-900', label: 'Projets notables' },
  dirigeant:      { bg: 'bg-teal-100 text-teal-900',    label: 'Dirigeant' },
  competence_cle: { bg: 'bg-amber-100 text-amber-900',  label: 'Competences cles' },
  philosophie:    { bg: 'bg-rose-100 text-rose-900',     label: 'Philosophie' },
};

function HighlightLegend() {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold self-center mr-1">
        Legende
      </span>
      {Object.entries(HIGHLIGHT_COLORS).map(([key, { bg, label }]) => (
        <span key={key} className={`${bg} text-[10px] px-2 py-0.5 rounded-full font-medium`}>
          {label}
        </span>
      ))}
    </div>
  );
}

function HighlightedLetter({ segments }: { segments: HighlightSegment[] }) {
  return (
    <div className="letter-preview bg-white rounded-3xl p-6 border border-stone-100 text-stone-700 text-[15px] leading-relaxed whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (!seg.category) {
          return <span key={i}>{seg.text}</span>;
        }
        const color = HIGHLIGHT_COLORS[seg.category];
        if (!color) return <span key={i}>{seg.text}</span>;
        return (
          <mark
            key={i}
            className={`${color.bg} rounded px-0.5 py-0 not-italic`}
            title={color.label}
            style={{ textDecoration: 'none' }}
          >
            {seg.text}
          </mark>
        );
      })}
    </div>
  );
}

export function PreviewTab() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const toast = useToast();

  async function handleCopy() {
    await copyToClipboard(state.personalizedLetter);
    toast.show('Copie dans le presse-papiers !');
  }

  function handleDownload() {
    const agencyName = state.selectedAgency?.name || 'lettre-motivation';
    downloadTxt(state.personalizedLetter, agencyName);
    toast.show('Fichier telecharge !');
  }

  function handleStartEdit() {
    dispatch({ type: 'SET_EDITING_LETTER', value: true });
  }

  function handleCancelEdit() {
    dispatch({ type: 'SET_EDITING_LETTER', value: false });
  }

  function handleSaveEdit() {
    dispatch({ type: 'SAVE_EDITED_LETTER' });
    toast.show('Lettre mise a jour !');
  }

  async function handleAnalyzePersonalized() {
    if (state.personalizedLetter.trim().length < 50) return;
    dispatch({ type: 'SET_ANALYSIS_TARGET', target: 'personalized' });
    dispatch({ type: 'SET_ANALYZING', value: true });
    try {
      const result = await api.analyze(state.personalizedLetter);
      dispatch({ type: 'SET_ANALYSIS', result });
      dispatch({ type: 'SET_ACTIVE_TAB', tab: 'analysis' });
      toast.show('Analyse de la lettre personnalisee terminee !');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      dispatch({ type: 'SET_ANALYZING', value: false });
    }
  }

  async function handleRegenerate() {
    if (!state.selectedAgency || state.baseLetter.trim().length < 50) return;
    dispatch({ type: 'SET_GENERATING', value: true });
    try {
      const combinedInstructions = [
        state.userInstructions,
        state.regenerateInstructions,
      ].filter(Boolean).join('\n');

      const result = await api.generate(
        state.selectedAgency.key,
        state.baseLetter,
        combinedInstructions || undefined,
      );
      const html = escapeHtml(result.personalized_letter);
      dispatch({
        type: 'SET_PERSONALIZED_LETTER',
        letter: result.personalized_letter,
        html,
        segments: result.highlights || [],
      });
      dispatch({ type: 'SET_SELECTED_AGENCY', agency: result.agency_info });
      toast.show('Lettre regeneree !');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      dispatch({ type: 'SET_GENERATING', value: false });
    }
  }

  // Empty state
  if (!state.personalizedLetter) {
    return (
      <div className="text-center py-12 text-stone-400">
        <p>
          Ecrivez votre lettre de base, selectionnez une agence, puis cliquez sur{' '}
          <strong className="text-sage-500">Generer la lettre</strong>.
        </p>
      </div>
    );
  }

  const hasHighlights = state.highlightSegments.length > 0;

  // Edit mode
  if (state.isEditingLetter) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-stone-400 italic">
          Modifiez la lettre ci-dessous. Les highlights seront recalcules a la prochaine regeneration.
        </p>
        <textarea
          value={state.editDraftLetter}
          onChange={(e) => dispatch({ type: 'SET_EDIT_DRAFT', text: e.target.value })}
          rows={22}
          className="w-full px-4 py-3 rounded-3xl border border-stone-200 bg-stone-50 text-stone-700 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-sage-300 min-h-[300px]"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="small" onClick={handleCancelEdit}>
            Annuler
          </Button>
          <Button variant="primary" className="!rounded-2xl !px-4 !py-2 !text-sm" onClick={handleSaveEdit}>
            Sauvegarder
          </Button>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="space-y-4">
      {/* Legend */}
      {hasHighlights && <HighlightLegend />}

      {/* Letter body */}
      {hasHighlights ? (
        <HighlightedLetter segments={state.highlightSegments} />
      ) : (
        <div className="letter-preview bg-white rounded-3xl p-6 border border-stone-100 text-stone-700 text-[15px] leading-relaxed whitespace-pre-wrap">
          {state.personalizedLetter}
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          <Button variant="small" onClick={handleCopy}>Copier</Button>
          <Button variant="small" onClick={handleDownload}>Telecharger</Button>
          <Button variant="small" onClick={handleStartEdit}>Modifier</Button>
        </div>
        <Button
          variant="amber"
          className="!px-4 !py-2 !text-sm !rounded-2xl"
          loading={state.isAnalyzing}
          loadingText="Analyse..."
          onClick={handleAnalyzePersonalized}
        >
          Analyser cette lettre
        </Button>
      </div>

      {/* Regeneration section */}
      <div className="border-t border-stone-100 pt-4 space-y-3">
        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
          Regenerer avec des consignes
        </p>
        <textarea
          value={state.regenerateInstructions}
          onChange={(e) => dispatch({ type: 'SET_REGENERATE_INSTRUCTIONS', text: e.target.value })}
          rows={2}
          placeholder="Ex: Insiste davantage sur le projet X, adopte un ton plus enthousiaste, raccourcis le 2e paragraphe..."
          className="w-full px-4 py-2 rounded-2xl border border-stone-200 bg-stone-50 text-stone-600 placeholder-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-sage-300 resize-none"
        />
        <Button
          variant="primary"
          className="!rounded-2xl !px-4 !py-2 !text-sm"
          loading={state.isGenerating}
          loadingText="Regeneration..."
          onClick={handleRegenerate}
          disabled={!state.selectedAgency}
        >
          Regenerer la lettre
        </Button>
      </div>
    </div>
  );
}
