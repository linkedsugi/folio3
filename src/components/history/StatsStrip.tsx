import { VERDICT_LABEL } from "@/lib/scoring";

export interface Stats {
  total: number;
  apply: number;
  hold: number;
  no: number;
  avgFace: number;
  avgStory: number;
}

/** 요약 타일 4개 — 폰에서는 2×2. 판정 타일은 색점 + 라벨로 뜻을 나르고 숫자는 잉크색을 유지한다 */
export function StatsStrip({ stats, className = "" }: { stats: Stats; className?: string }) {
  const tiles = [
    { label: "분석한 공고", value: stats.total, dot: null },
    { label: VERDICT_LABEL.apply, value: stats.apply, dot: "bg-apply" },
    { label: VERDICT_LABEL.hold, value: stats.hold, dot: "bg-hold" },
    { label: VERDICT_LABEL.not_recommended, value: stats.no, dot: "bg-no" },
  ];
  return (
    <section aria-label="요약" className={className}>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card px-4 py-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-muted">
              {t.dot && <i className={`inline-block h-2 w-2 rounded-full ${t.dot}`} aria-hidden />}
              {t.label}
            </dt>
            <dd className="num mt-1 text-2xl font-black leading-none text-ink">{t.value}</dd>
          </div>
        ))}
      </dl>
      {stats.total > 0 && (
        <p className="mt-2 text-xs text-muted">
          평균 액면 <b className="num font-semibold text-ink-2">{stats.avgFace}%</b> → 스토리보완{" "}
          <b className="num font-semibold text-ink">{stats.avgStory}%</b>
        </p>
      )}
    </section>
  );
}
