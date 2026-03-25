import { useState } from 'react';
import type { Criterion } from '../../types';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import * as api from '../../services/api';
import { CorrectionZone } from './CorrectionZone';

interface Props {
  criterion: Criterion;
  index: number;
}

function scoreColor(score: number) {
  if (score < 5) return { border: 'border-red-300', badge: 'bg-red-500', text: 'text-red-500' };
  if (score < 7) return { border: 'border-amber-300', badge: 'bg-amber-500', text: 'text-amber-500' };
  return { border: 'border-sage-300', badge: 'bg-sage-500', text: 'text-sage-500' };
}

export function CriterionCard({ criterion, index }: Props) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [isFixed, setIsFixed] = useState(false);
  const [answerInput, setAnswerInput] = useState('');

  const colors = scoreColor(criterion.score);
  const correction = state.pendingCorrections[index];
  const question = state.pendingQuestions[index];
  const showFix = criterion.score < 7 && !isFixed;
  const isFetching = state.fixingCriterionIndex === index;

  async function handleFix() {
    dispatch({ type: 'SET_FIXING_INDEX', index });

    try {
      const result = await api.fixCriterion(
        state.baseLetter,
        criterion.id,
        criterion.nom,
        criterion.feedback,
        criterion.extrait_concerne,
      );

      if (result.type === 'question' && result.question) {
        dispatch({
          type: 'SET_QUESTION',
          index,
          question: { criterionIndex: index, question: result.question },
        });
      } else if (result.type === 'correction' && result.original && result.corrected) {
        dispatch({
          type: 'SET_CORRECTION',
          index,
          correction: {
            original: result.original,
            corrected: result.corrected,
            explanation: result.explanation || '',
          },
        });
      }
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      dispatch({ type: 'SET_FIXING_INDEX', index: null });
    }
  }

  async function handleAnswerSubmit() {
    if (!question || !answerInput.trim()) return;
    dispatch({ type: 'SET_FIXING_INDEX', index });

    try {
      const result = await api.fixCriterion(
        state.baseLetter,
        criterion.id,
        criterion.nom,
        criterion.feedback,
        criterion.extrait_concerne,
        answerInput.trim(),
        question.question,
      );

      dispatch({ type: 'CLEAR_QUESTION', index });
      setAnswerInput('');

      if (result.type === 'correction' && result.original && result.corrected) {
        dispatch({
          type: 'SET_CORRECTION',
          index,
          correction: {
            original: result.original,
            corrected: result.corrected,
            explanation: result.explanation || '',
          },
        });
      } else if (result.type === 'question' && result.question) {
        dispatch({
          type: 'SET_QUESTION',
          index,
          question: { criterionIndex: index, question: result.question },
        });
      }
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      dispatch({ type: 'SET_FIXING_INDEX', index: null });
    }
  }

  function handleApply() {
    if (!correction) return;
    const oldLetter = state.baseLetter;
    dispatch({ type: 'APPLY_CORRECTION', index });

    if (oldLetter.includes(correction.original)) {
      setIsFixed(true);
      toast.show('Correction appliquee a la lettre !');
    } else {
      toast.show('Passage non trouve exactement. Verifiez manuellement.');
    }
  }

  function handleDismiss() {
    dispatch({ type: 'DISMISS_CORRECTION', index });
  }

  return (
    <div
      className={`rounded-3xl border-2 ${isFixed ? 'border-sage-300' : colors.border} bg-white p-5 space-y-3 transition-all overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-stone-700 text-sm">{criterion.nom}</span>
        <span
          className={`${isFixed ? 'bg-sage-500' : colors.badge} text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full`}
        >
          {isFixed ? '\u2713' : criterion.score}
        </span>
      </div>

      {/* Feedback */}
      <p className="text-sm text-stone-500 leading-relaxed">{criterion.feedback}</p>

      {/* Fix button */}
      {showFix && !correction && !question && (
        <Button
          variant="amber"
          className="!px-4 !py-2 !text-sm !rounded-2xl"
          loading={isFetching}
          loadingText="Correction..."
          onClick={handleFix}
        >
          Corriger avec l'IA
        </Button>
      )}

      {/* AI Question zone */}
      {question && !correction && (
        <div className="space-y-3 pt-2 border-t border-stone-100">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
            <p className="text-xs font-semibold text-amber-600 uppercase mb-1">Question de l'IA :</p>
            <p className="text-sm text-amber-800 leading-relaxed">{question.question}</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnswerSubmit()}
              placeholder="Votre reponse..."
              className="flex-1 px-3 py-2 rounded-2xl border border-stone-200 bg-stone-50 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-sage-300"
            />
            <Button
              variant="small"
              loading={isFetching}
              loadingText="..."
              onClick={handleAnswerSubmit}
            >
              Envoyer
            </Button>
          </div>
        </div>
      )}

      {/* Correction zone */}
      {correction && (
        <CorrectionZone
          correction={correction}
          onApply={handleApply}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}
