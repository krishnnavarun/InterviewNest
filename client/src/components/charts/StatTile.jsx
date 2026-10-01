import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Panel } from '@/components/ui/panel';

// Stat tile: label, value, optional signed delta (up is good for scores).
export function StatTile({ label, value, suffix, delta, deltaLabel, icon: Icon }) {
  const hasDelta = typeof delta === 'number' && delta !== 0;
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/55">{label}</p>
        {Icon && <Icon className="size-4 text-white/35" aria-hidden="true" />}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
        {value ?? '-'}
        {value !== null && value !== undefined && suffix && <span className="ml-1 text-base font-medium text-white/45">{suffix}</span>}
      </p>
      {hasDelta && (
        <p className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${delta > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
          {delta > 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {delta > 0 ? '+' : ''}
          {delta} {deltaLabel}
        </p>
      )}
    </Panel>
  );
}
