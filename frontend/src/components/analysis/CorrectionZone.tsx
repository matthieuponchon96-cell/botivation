import type { Correction } from '../../types';
import { Button } from '../ui/Button';

interface Props {
  correction: Correction;
  onApply: () => void;
  onDismiss: () => void;
}

export function CorrectionZone({ correction, onApply, onDismiss }: Props) {
  return (
    <div className="space-y-3 pt-2 border-t border-stone-100">
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase mb-1">Avant :</p>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-700 line-through leading-relaxed break-words overflow-hidden">
          {correction.original}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase mb-1">Après :</p>
        <div className="bg-sage-50 border border-sage-200 rounded-2xl p-3 text-sm text-sage-700 leading-relaxed break-words overflow-hidden">
          {correction.corrected}
        </div>
      </div>

      <p className="text-xs text-stone-400 italic">{correction.explanation}</p>

      <div className="flex gap-2">
        <Button variant="small" onClick={onApply}>
          Appliquer
        </Button>
        <Button variant="ghost" onClick={onDismiss}>
          Ignorer
        </Button>
      </div>
    </div>
  );
}
