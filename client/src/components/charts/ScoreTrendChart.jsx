import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDate } from '@/lib/format';

// Single-series line chart of overall interview scores over time.
// Specs: 2px line, 8px markers with a 2px surface ring, ~10% area wash,
// hairline grid, crosshair + tooltip snapping to the nearest interview,
// keyboard navigation, and a table view.
const MARK = '#9368ff'; // brand-400 - validated against the dark panel surface
const SURFACE = '#17111f';
const HEIGHT = 220;
const PAD = { top: 16, right: 40, bottom: 30, left: 34 };
const TICKS = [0, 25, 50, 75, 100];

export function ScoreTrendChart({ points }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [active, setActive] = useState(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const geometry = useMemo(() => {
    const plotWidth = width - PAD.left - PAD.right;
    const plotHeight = HEIGHT - PAD.top - PAD.bottom;
    const x = (index) => PAD.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
    const y = (value) => PAD.top + plotHeight - (value / 100) * plotHeight;
    const coords = points.map((point, index) => ({ ...point, cx: x(index), cy: y(point.overall) }));
    const line = coords.map((point, index) => `${index ? 'L' : 'M'}${point.cx},${point.cy}`).join(' ');
    const area = coords.length > 1 ? `${line} L${coords.at(-1).cx},${y(0)} L${coords[0].cx},${y(0)} Z` : '';
    const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(plotWidth / 90))));
    return { coords, line, area, y, labelEvery };
  }, [points, width]);

  const handlePointer = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - box.left;
    let nearest = 0;
    geometry.coords.forEach((point, index) => {
      if (Math.abs(point.cx - px) < Math.abs(geometry.coords[nearest].cx - px)) nearest = index;
    });
    setActive(nearest);
  };

  const handleKey = (event) => {
    if (event.key === 'ArrowRight') setActive((index) => Math.min(points.length - 1, (index ?? -1) + 1));
    if (event.key === 'ArrowLeft') setActive((index) => Math.max(0, (index ?? points.length) - 1));
    if (event.key === 'Escape') setActive(null);
  };

  const activePoint = active !== null ? geometry.coords[active] : null;
  const last = geometry.coords.at(-1);

  return (
    <div>
      <div ref={containerRef} className="relative">
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Overall score across ${points.length} interviews, latest ${last?.overall ?? 0}. Use arrow keys to inspect.`}
          tabIndex={0}
          onPointerMove={handlePointer}
          onPointerLeave={() => setActive(null)}
          onKeyDown={handleKey}
          onBlur={() => setActive(null)}
          className="block touch-none outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 rounded-lg"
        >
          {TICKS.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={geometry.y(tick)} y2={geometry.y(tick)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              <text x={PAD.left - 8} y={geometry.y(tick)} dy="0.32em" textAnchor="end" className="fill-white/40 text-[11px] tabular-nums">
                {tick}
              </text>
            </g>
          ))}

          {geometry.area && <path d={geometry.area} fill={MARK} fillOpacity="0.1" />}
          {geometry.coords.length > 1 && (
            <path d={geometry.line} fill="none" stroke={MARK} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          )}

          {activePoint && (
            <line x1={activePoint.cx} x2={activePoint.cx} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
          )}

          {geometry.coords.map((point, index) => (
            <circle
              key={point.id}
              cx={point.cx}
              cy={point.cy}
              r={index === active ? 6 : 4}
              fill={MARK}
              stroke={SURFACE}
              strokeWidth="2"
            />
          ))}

          {/* Direct label on the latest point only */}
          {last && (
            <text x={last.cx + 10} y={last.cy} dy="0.32em" className="fill-white text-[12px] font-semibold">
              {last.overall}
            </text>
          )}

          {geometry.coords.map((point, index) =>
            index % geometry.labelEvery === 0 || index === geometry.coords.length - 1 ? (
              <text key={`x-${point.id}`} x={point.cx} y={HEIGHT - 8} textAnchor="middle" className="fill-white/40 text-[11px]">
                {formatDate(point.date, { month: 'short', day: 'numeric' })}
              </text>
            ) : null
          )}
        </svg>

        {activePoint && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 min-w-36 -translate-x-1/2 rounded-xl border border-white/10 bg-ink-950/95 px-3 py-2 text-xs shadow-xl"
            style={{ left: Math.min(Math.max(activePoint.cx, 80), width - 80), top: Math.max(0, activePoint.cy - 78) }}
          >
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded-full" style={{ background: MARK }} />
              <span className="text-base font-semibold text-white">{activePoint.overall}</span>
              <span className="text-white/50">/ 100</span>
            </div>
            <p className="mt-0.5 text-white/60">{activePoint.roleTitle}</p>
            <p className="text-white/40">{formatDate(activePoint.date)}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowTable((value) => !value)}
        className="mt-2 cursor-pointer text-xs font-medium text-white/50 hover:text-white"
      >
        {showTable ? 'Hide table' : 'View as table'}
      </button>
      {showTable && (
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-xs text-white/45">
            <tr>
              <th className="py-1.5 font-medium">Date</th>
              <th className="py-1.5 font-medium">Role</th>
              <th className="py-1.5 text-right font-medium">Score</th>
            </tr>
          </thead>
          <tbody className="text-white/80">
            {points.map((point) => (
              <tr key={point.id} className="border-t border-white/[0.06]">
                <td className="py-1.5">{formatDate(point.date)}</td>
                <td className="py-1.5">{point.roleTitle}</td>
                <td className="py-1.5 text-right tabular-nums">{point.overall}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
