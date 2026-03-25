import type { AnalysisResult } from '../../types';
import { ScoreRing } from '../ui/ScoreRing';
import { CriterionCard } from './CriterionCard';

interface Props {
  result: AnalysisResult;
}

export function AnalysisDashboard({ result }: Props) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-col items-center gap-3 py-4">
        <ScoreRing score={result.score_global} size={110} />
        <p className="text-sm text-stone-500 text-center max-w-md">{result.verdict}</p>
      </div>

      {/* Criteria grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {result.criteres.map((criterion, index) => (
          <CriterionCard key={criterion.id} criterion={criterion} index={index} />
        ))}
      </div>
    </div>
  );
}
