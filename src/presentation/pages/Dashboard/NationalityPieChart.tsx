import { useMemo, useState, type MouseEvent } from 'react';
import type { NationalityCount } from '../../../domain/entities/DashboardSummary';
import styles from './Dashboard.module.css';

// Categorical palette in fixed order (validated for CVD separation).
// Anything past the last slot folds into "Outros" instead of generating new hues.
// Values live in global.css (--series-1..8) with separate light/dark steps.
const SLICE_COLORS = Array.from({ length: 8 }, (_, i) => `var(--series-${i + 1})`);
const OTHERS_COLOR = 'var(--series-other)';

const SIZE = 200;
const RADIUS = SIZE / 2;

interface Slice {
  label: string;
  total: number;
  pct: number;
  color: string;
  path: string;
}

function polar(angle: number, r: number): [number, number] {
  return [RADIUS + r * Math.sin(angle), RADIUS - r * Math.cos(angle)];
}

function slicePath(start: number, end: number): string {
  if (end - start >= Math.PI * 2 - 1e-6) {
    // Full circle: an SVG arc can't start and end at the same point
    return `M ${RADIUS} 0 A ${RADIUS} ${RADIUS} 0 1 1 ${RADIUS - 0.01} 0 Z`;
  }
  const [x1, y1] = polar(start, RADIUS);
  const [x2, y2] = polar(end, RADIUS);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return `M ${RADIUS} ${RADIUS} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

const pctFormat = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

export function NationalityPieChart({ data }: { data: NationalityCount[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const slices = useMemo<Slice[]>(() => {
    const sorted = [...data].filter((d) => d.total > 0).sort((a, b) => b.total - a.total);
    const main = sorted.slice(0, SLICE_COLORS.length);
    const rest = sorted.slice(SLICE_COLORS.length);
    // Keep 8 slots total when folding: 7 countries + "Outros"
    const entries =
      rest.length > 0
        ? [
            ...main.slice(0, SLICE_COLORS.length - 1).map((d, i) => ({ label: d.country, total: d.total, color: SLICE_COLORS[i] })),
            {
              label: 'Outros',
              total: [...main.slice(SLICE_COLORS.length - 1), ...rest].reduce((sum, d) => sum + d.total, 0),
              color: OTHERS_COLOR,
            },
          ]
        : main.map((d, i) => ({ label: d.country, total: d.total, color: SLICE_COLORS[i] }));

    const grandTotal = entries.reduce((sum, e) => sum + e.total, 0);
    let angle = 0;
    return entries.map((e) => {
      const sweep = (e.total / grandTotal) * Math.PI * 2;
      const slice = {
        ...e,
        pct: e.total / grandTotal,
        path: slicePath(angle, angle + sweep),
      };
      angle += sweep;
      return slice;
    });
  }, [data]);

  if (slices.length === 0) {
    return <div className={styles.activityMeta}>Nenhum imigrante cadastrado.</div>;
  }

  const hoveredSlice = slices.find((s) => s.label === hovered);

  const handleMouseMove = (e: MouseEvent<SVGPathElement>, label: string) => {
    const bounds = e.currentTarget.ownerSVGElement?.parentElement?.getBoundingClientRect();
    if (!bounds) return;
    setHovered(label);
    setTooltipPos({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });
  };

  const clearHover = () => {
    setHovered(null);
    setTooltipPos(null);
  };

  return (
    <div className={styles.pieLayout}>
      <div className={styles.pieWrapper}>
        <svg
          viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`}
          className={styles.pieSvg}
          role="img"
          aria-label="Distribuição de imigrantes por nacionalidade"
        >
          {slices.map((s) => (
            <path
              key={s.label}
              d={s.path}
              className={styles.pieSlice}
              style={{ fill: s.color, opacity: hovered && hovered !== s.label ? 0.45 : 1 }}
              onMouseMove={(e) => handleMouseMove(e, s.label)}
              onMouseLeave={clearHover}
            />
          ))}
        </svg>
        {hoveredSlice && tooltipPos && (
          <div className={styles.pieTooltip} style={{ left: tooltipPos.x, top: tooltipPos.y }}>
            <span className={styles.pieSwatch} style={{ background: hoveredSlice.color }} />
            <strong>{hoveredSlice.label}</strong>
            <span>
              {hoveredSlice.total} ({pctFormat.format(hoveredSlice.pct)})
            </span>
          </div>
        )}
      </div>

      <ul className={styles.pieLegend}>
        {slices.map((s) => (
          <li
            key={s.label}
            className={styles.pieLegendItem}
            style={{ opacity: hovered && hovered !== s.label ? 0.45 : 1 }}
            onMouseEnter={() => setHovered(s.label)}
            onMouseLeave={clearHover}
          >
            <span className={styles.pieSwatch} style={{ background: s.color }} />
            <span className={styles.pieLegendLabel}>{s.label}</span>
            <span className={styles.pieLegendValue}>{s.total}</span>
            <span className={styles.pieLegendPct}>{pctFormat.format(s.pct)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
