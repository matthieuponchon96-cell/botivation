import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';
import { AnalysisDashboard } from '../analysis/AnalysisDashboard';
import { Button } from '../ui/Button';
import * as api from '../../services/api';

export function AnalysisTab() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const toast = useToast();

  async function handleReAnalyze() {
    const letterToAnalyze = state.analysisTarget === 'personalized'
      ? state.personalizedLetter
      : state.baseLetter;
    if (letterToAnalyze.trim().length < 50) return;
    dispatch({ type: 'SET_ANALYZING', value: true });
    try {
      const result = await api.analyze(letterToAnalyze);
      dispatch({ type: 'SET_ANALYSIS', result });
      toast.show('Re-analyse terminee !');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      dispatch({ type: 'SET_ANALYZING', value: false });
    }
  }

  if (!state.analysisResult) {
    return (
      <div className="text-center py-12 text-stone-400">
        <p>
          Cliquez sur <strong className="text-amber-500">Analyser ma lettre</strong> dans l'editeur
          {state.personalizedLetter ? ' ou sur Analyser cette lettre dans l\'apercu' : ''}
          {' '}pour obtenir un diagnostic.
        </p>
      </div>
    );
  }

  const targetLabel = state.analysisTarget === 'personalized'
    ? 'lettre personnalisee'
    : 'lettre de base';

  return (
    <div className="space-y-4">
      {/* Target indicator */}
      <p className="text-xs text-stone-400 italic">
        Analyse de la {targetLabel}
      </p>

      {state.correctionsApplied && (
        <div className="flex items-center justify-between bg-sage-50 rounded-2xl px-4 py-3 border border-sage-200">
          <p className="text-sm text-sage-700">Des corrections ont ete appliquees a votre lettre.</p>
          <Button
            variant="small"
            loading={state.isAnalyzing}
            loadingText="Analyse..."
            onClick={handleReAnalyze}
          >
            Re-analyser
          </Button>
        </div>
      )}
      <AnalysisDashboard result={state.analysisResult} />
    </div>
  );
}
