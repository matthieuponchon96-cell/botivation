import { useAppState, useAppDispatch } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import { Button } from './ui/Button';
import * as api from '../services/api';

export function BaseLetterEditor() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const wordCount = state.baseLetter.trim().split(/\s+/).filter(Boolean).length;
  const lengthFeedback = wordCount === 0
    ? ''
    : wordCount < 100
    ? 'Trop court'
    : wordCount < 200
    ? 'Un peu court'
    : wordCount <= 400
    ? 'Bonne longueur'
    : 'Un peu long';

  const lengthColor = wordCount === 0
    ? ''
    : wordCount < 100
    ? 'text-red-400'
    : wordCount < 200
    ? 'text-amber-400'
    : wordCount <= 400
    ? 'text-sage-500'
    : 'text-amber-400';

  async function handleAnalyze() {
    if (state.baseLetter.trim().length < 50) {
      toast.show('La lettre est trop courte pour une analyse (min. 50 caracteres)');
      return;
    }
    dispatch({ type: 'SET_ANALYSIS_TARGET', target: 'base' });
    dispatch({ type: 'SET_ANALYZING', value: true });
    try {
      const result = await api.analyze(state.baseLetter);
      dispatch({ type: 'SET_ANALYSIS', result });
      dispatch({ type: 'SET_ACTIVE_TAB', tab: 'analysis' });
      toast.show('Analyse terminee !');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      dispatch({ type: 'SET_ANALYZING', value: false });
    }
  }

  return (
    <section className="bg-white rounded-4xl p-6 shadow-sm border border-stone-100 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-stone-800 flex items-center gap-2">
          <span className="text-sage-500">&#9998;</span>
          Votre lettre de base
        </h2>
        <Button
          variant="amber"
          className="!px-4 !py-2 !text-sm !rounded-2xl"
          loading={state.isAnalyzing}
          loadingText="Analyse..."
          onClick={handleAnalyze}
        >
          Analyser ma lettre
        </Button>
      </div>

      <textarea
        value={state.baseLetter}
        onChange={(e) => dispatch({ type: 'SET_BASE_LETTER', text: e.target.value })}
        rows={22}
        placeholder="Ecrivez ou collez votre lettre de motivation ici.

Cette lettre sera votre modele de base : l'IA la personnalisera pour chaque agence en y integrant les informations specifiques (projets, philosophie, specialites).

Conseils :
- Ecrivez une lettre complete et authentique
- Mentionnez vos realisations concretes et experiences
- Exprimez votre motivation pour l'architecture
- Les parties generiques seront adaptees automatiquement"
        className="w-full px-4 py-3 rounded-3xl border border-stone-200 bg-stone-50 text-stone-700 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-sage-300 min-h-[300px]"
      />

      <div className="flex items-center justify-between text-xs text-stone-400">
        <span>{wordCount} mots</span>
        <span className={lengthColor}>{lengthFeedback}</span>
      </div>
    </section>
  );
}
