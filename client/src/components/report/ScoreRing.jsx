import { scoreTone } from '@/lib/format';

const STROKE = { green: '#34d399', amber: '#fbbf24', red: '#f87171', neutral: '#9368ff' };
const TRACK = { green: 'rgba(52,211,153,0.15)', amber: 'rgba(251,191,36,0.15)', red: 'rgba(248,113,113,0.15)', neutral: 'rgba(147,104,255,0.15)' };

// Hero figure with a meter ring: the fill carries severity, the track is a
// lighter step of the same hue.
export function ScoreRing({ score, size = 168 }) {
  const tone = scoreTone(score);
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={TRACK[tone]} strokeWidth="10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={STROKE[tone]}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-5xl font-bold tracking-tight">{score}</p>
          <p className="text-xs text-white/50">out of 100</p>
        </div>
      </div>
    </div>
  );
}
