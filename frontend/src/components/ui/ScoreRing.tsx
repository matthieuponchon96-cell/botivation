interface Props {
  score: number;
  size?: number;
}

function getColor(score: number) {
  if (score < 5) return '#DC2626';
  if (score < 7) return '#D97706';
  return '#4A7856';
}

export function ScoreRing({ score, size = 100 }: Props) {
  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 10) * circumference;
  const color = getColor(score);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e7e5e4"
        strokeWidth="8"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="score-ring-progress"
      />
      <text
        x={size / 2}
        y={size / 2 + 8}
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
}
