import { ScoreMeter } from "@/components/ScoreMeter";
import { VerdictBadge } from "@/components/VerdictBadge";
import { formatDate } from "@/lib/copy";
import { EFFORT_LABEL, GAP_CATEGORY_META } from "@/lib/scoring";
import type { SampleFacts } from "./sampleFacts";

/** 히어로 오른쪽 — 샘플 분석의 판정 카드. 화면 캡처처럼 보이도록 실제 결과 컴포넌트를 그대로 쓴다. */
export function VerdictCard({ facts }: { facts: SampleFacts }) {
  const { analysis, face, story, passLine, gapToPass, quickWins, quickWinScore, countedArgs, uncountedArgs } = facts;
  const nums = quickWins.map((g) => GAP_CATEGORY_META[g.category].num).join("");

  return (
    <div className="rise rounded-2xl border border-line-2 bg-paper-2/70 p-2 sm:p-3">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-hold" aria-hidden />
            판정 · 샘플 결과
          </div>
          <div className="num text-[11px] text-faint">{formatDate(analysis.createdAt)}</div>
        </div>

        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <div className="text-xs text-muted">{analysis.posting.company}</div>
          <div className="mt-0.5 text-base font-bold text-ink">{analysis.posting.title}</div>

          <div className="mt-3">
            <VerdictBadge verdict={analysis.verdict} withSub />
          </div>

          <ScoreMeter face={face} story={story} passLine={passLine} className="mt-5" />

          <p className="mt-4 text-sm font-semibold text-ink">
            합격선까지 <span className="num">{gapToPass}%p</span> · 아래 {nums} 두 건만 채워도{" "}
            <span className="num">{quickWinScore}%</span> 예상
          </p>

          <ul className="mt-2.5 divide-y divide-line rounded-lg border border-line">
            {quickWins.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-accent">{GAP_CATEGORY_META[g.category].num}</span>
                  <span className="truncate text-ink-2">{g.title}</span>
                </span>
                <span className="num shrink-0 text-muted">
                  <b className="font-semibold text-accent">예상 +{g.impact}%p</b> · {EFFORT_LABEL[g.effort]}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-[11px] leading-5 text-faint">
            갈음 논증 {countedArgs + uncountedArgs}건 중 근거 있음 {countedArgs}건만 반영 · 근거 부족 {uncountedArgs}건 미반영
          </p>
        </div>
      </div>
    </div>
  );
}
