"use client";

export function ProgressRing({
  ratio,
  size = 104,
  color = "#2f7de1",
  label,
  sub,
}: {
  ratio: number;
  size?: number;
  color?: string;
  label: string;
  sub?: string;
}) {
  const r = size / 2 - 9;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={9} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-extrabold leading-none">{label}</div>
        {sub ? <div className="mt-0.5 text-[10px] muted">{sub}</div> : null}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  color = "#2f7de1",
  unit = "",
  height = 120,
}: {
  data: { label: string; value: number }[];
  color?: string;
  unit?: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10px] font-semibold" style={{ color }}>
            {d.value > 0 ? `${d.value}${unit}` : ""}
          </span>
          <div
            className="w-full rounded-t-md"
            style={{
              height: `${Math.max(2, (d.value / max) * (height - 34))}px`,
              background: d.value > 0 ? color : "var(--line)",
              opacity: d.value > 0 ? 1 : 0.5,
              transition: "height .4s ease",
            }}
          />
          <span className="text-[10px] muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LineChart({
  series,
  height = 160,
}: {
  series: { name: string; color: string; points: { x: string; y: number }[] }[];
  height?: number;
}) {
  const all = series.flatMap((s) => s.points.map((p) => p.y));
  if (all.length === 0) {
    return <p className="py-8 text-center text-sm muted">기록이 없어요.</p>;
  }
  const min = Math.min(...all);
  const max = Math.max(...all);
  const pad = (max - min) * 0.15 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const W = 320;
  const H = height;
  const px = (i: number, len: number) => (len <= 1 ? W / 2 : (i / (len - 1)) * (W - 24) + 12);
  const py = (v: number) => H - 22 - ((v - lo) / (hi - lo)) * (H - 40);

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={12}
            x2={W - 12}
            y1={22 + t * (H - 44)}
            y2={22 + t * (H - 44)}
            stroke="var(--line)"
            strokeWidth={1}
          />
        ))}
        {series.map((s) => {
          if (s.points.length === 0) return null;
          const d = s.points
            .map((p, i) => `${i === 0 ? "M" : "L"}${px(i, s.points.length)},${py(p.y)}`)
            .join(" ");
          return (
            <g key={s.name}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" />
              {s.points.map((p, i) => (
                <circle key={i} cx={px(i, s.points.length)} cy={py(p.y)} r={3} fill={s.color} />
              ))}
            </g>
          );
        })}
        <text x={12} y={14} fontSize={10} fill="var(--muted)">
          {hi.toFixed(1)}
        </text>
        <text x={12} y={H - 6} fontSize={10} fill="var(--muted)">
          {lo.toFixed(1)}
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-3">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1 text-[11px] muted">
            <i className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

const DONUT_COLORS = ["#2f7de1", "#e8618c", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#84cc16"];

export function DonutChart({ data }: { data: { name: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <p className="py-6 text-center text-sm muted">아직 데이터가 없어요.</p>;

  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={130} height={130} viewBox="0 0 130 130" className="-rotate-90 shrink-0">
        {data.slice(0, 8).map((d, i) => {
          const frac = d.count / total;
          const seg = (
            <circle
              key={d.name}
              cx={65}
              cy={65}
              r={R}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth={20}
              strokeDasharray={`${C * frac} ${C}`}
              strokeDashoffset={-offset}
            />
          );
          offset += C * frac;
          return seg;
        })}
      </svg>
      <ul className="flex-1 space-y-1">
        {data.slice(0, 8).map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-xs">
            <i
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="font-semibold">{d.count}회</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
