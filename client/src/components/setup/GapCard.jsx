import { CheckCircle2, CircleAlert, Crosshair } from 'lucide-react';
import { SCORE_TEXT, scoreTone } from '@/lib/format';

export function GapCard({ gap }) {
  return (
    <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start gap-4">
        <div className="text-center">
          <p className={`text-4xl font-bold ${SCORE_TEXT[scoreTone(gap.matchScore)]}`}>{gap.matchScore}%</p>
          <p className="text-xs text-white/45">JD match</p>
        </div>
        <p className="text-sm text-white/70">{gap.summary}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white/45 uppercase">
            <CheckCircle2 className="size-3.5 text-emerald-300" /> You have
          </p>
          <div className="flex flex-wrap gap-1.5">
            {gap.matchedSkills.map((skill) => (
              <span key={skill} className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white/45 uppercase">
            <CircleAlert className="size-3.5 text-amber-300" /> Gaps
          </p>
          <div className="flex flex-wrap gap-1.5">
            {gap.missingSkills.map((item) => (
              <span
                key={item.skill}
                className={
                  item.importance === 'must_have'
                    ? 'rounded-lg border border-red-400/25 bg-red-500/10 px-2 py-0.5 text-xs text-red-200'
                    : 'rounded-lg border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200'
                }
              >
                {item.skill}
                {item.importance === 'must_have' ? ' · must-have' : ''}
              </span>
            ))}
            {gap.missingSkills.length === 0 && <span className="text-xs text-white/50">No major gaps found</span>}
          </div>
        </div>
      </div>

      {gap.focusAreas.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white/45 uppercase">
            <Crosshair className="size-3.5" /> The interview will probe
          </p>
          <ul className="space-y-1.5 text-sm">
            {gap.focusAreas.map((area) => (
              <li key={area.topic}>
                <span className="font-medium text-white">{area.topic}</span> <span className="text-white/55">- {area.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
