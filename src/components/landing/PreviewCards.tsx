import type { ReactNode } from "react";
import { LevelDot } from "@/components/LevelDot";
import { LinkButton, Pill } from "@/components/ui";
import { COPY } from "@/lib/copy";
import { EFFORT_LABEL, GAP_CATEGORY_META } from "@/lib/scoring";
import type { GapCategory } from "@/lib/types";
import { firstSentence, type ArgumentWithItem, type SampleFacts } from "./sampleFacts";

const CATEGORIES: GapCategory[] = ["hidden", "weak", "missing", "hard"];

function Shell({ num, title, desc, children }: { num: string; title: string; desc: string; children: ReactNode }) {
  return (
    <article className="card flex min-w-0 flex-col p-5">
      <header>
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">결과물 {num}</div>
        <h3 className="mt-1 text-base font-bold text-ink">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted">{desc}</p>
      </header>
      <div className="mt-4 flex-1">{children}</div>
    </article>
  );
}

function ArgumentMini({ data, counted }: { data: ArgumentWithItem; counted: boolean }) {
  const { arg, item } = data;
  const ev = arg.evidence[0];
  return (
    <div className={`rounded-lg border p-3 ${counted ? "border-accent/30 bg-accent-soft/40" : "border-line bg-paper-2/40"}`}>
      <div className="text-[11px] text-muted">{item.label}</div>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <div className="text-sm font-semibold leading-5 text-ink">{arg.claim}</div>
        <Pill tone={counted ? "accent" : "warn"}>{counted ? "근거 있음 · 점수 반영" : "근거 부족 · 점수 미반영"}</Pill>
      </div>
      {ev && (
        <blockquote className={`mt-2 border-l-2 pl-2.5 text-xs leading-5 text-ink-2 ${counted ? "border-accent" : "border-line-2"}`}>
          “{ev.quote}” <span className="text-faint">— {ev.source}</span>
        </blockquote>
      )}
      {!counted && <p className="mt-2 text-xs leading-5 text-muted">{arg.note}</p>}
    </div>
  );
}

export function PreviewCards({ facts }: { facts: SampleFacts }) {
  const { analysis, face, story, passLine, keyItem, actualWorkLine, faceRows, grounded, weak, hiddenGap, gapsByCategory } = facts;
  const { managerView, targetResume } = analysis;

  return (
    <div>
      <p className="mb-5 text-sm leading-6 text-muted">{COPY.preview.caption}</p>

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 pt-1 scroll-px-4 sm:-mx-6 sm:px-6 sm:scroll-px-6 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0">
        {/* 결과물 1 */}
        <div className="w-[84%] shrink-0 snap-start md:w-auto md:shrink">
          <Shell num="1" title="부서장이 뽑으려는 사람" desc="항목 목록을 한 사람의 역할로 복원합니다">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted">이 부서의 실제 일</dt>
                <dd className="mt-0.5 leading-6 text-ink-2">{actualWorkLine}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">부서장이 뽑으려는 사람</dt>
                <dd className="mt-0.5 font-bold leading-6 text-ink">{managerView.personProfile}</dd>
              </div>
            </dl>
            <div className="mt-4 rounded-lg bg-paper-2 p-3 text-xs leading-5">
              <div className="text-muted">
                JD 항목 <span className="font-semibold text-ink-2">「{keyItem.label}」</span>
              </div>
              <div className="mt-1 flex gap-2">
                <span className="shrink-0 text-accent" aria-hidden>
                  →
                </span>
                <span className="text-ink-2">
                  실제로 원한 것 · <span className="font-semibold text-ink">{keyItem.intent}</span>
                </span>
              </div>
            </div>
          </Shell>
        </div>

        {/* 결과물 2-1 */}
        <div className="w-[84%] shrink-0 snap-start md:w-auto md:shrink">
          <Shell num="2-1" title="기본 이력서 · 액면 충족률" desc="내 이력을 그대로 놓고 항목별로 냉정하게 봅니다">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="num text-3xl font-black text-ink">{face}%</span>
              <span className="text-xs text-muted">액면 충족률 · 합격선 {passLine}%</span>
            </div>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {faceRows.map(({ item, match }) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 flex-1 text-sm leading-5 text-ink-2">{item.label}</span>
                  <LevelDot level={match.level} className="shrink-0" />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-5 text-muted">
              {firstSentence(COPY.result.faceNote)} 항목 {managerView.items.length}개 중 {faceRows.length}개만 보였습니다.
            </p>
          </Shell>
        </div>

        {/* 결과물 2-2 */}
        <div className="w-[84%] shrink-0 snap-start md:w-auto md:shrink">
          <Shell num="2-2" title="스토리보완 이력서 · 갈음 논증" desc="근거가 붙는 주장만 점수에 반영합니다">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="num text-3xl font-black text-ink">{story}%</span>
              <span className="num text-sm font-semibold text-accent">+{story - face}%p</span>
              <span className="text-xs text-muted">스토리보완 후 · 합격선 {passLine}%</span>
            </div>
            <div className="mt-3 space-y-2">
              <ArgumentMini data={grounded} counted />
              <ArgumentMini data={weak} counted={false} />
            </div>
          </Shell>
        </div>

        {/* 결과물 3 */}
        <div className="w-[84%] shrink-0 snap-start md:w-auto md:shrink">
          <Shell num="3" title="목표 이력서 · 보강 로드맵" desc="합격선 80%까지 무엇을 채울지 네 갈래로 정리합니다">
            <ul className="divide-y divide-line border-y border-line">
              {CATEGORIES.map((cat) => {
                const meta = GAP_CATEGORY_META[cat];
                const gaps = gapsByCategory[cat];
                return (
                  <li key={cat} className="py-2.5">
                    <div className="flex items-baseline gap-2 text-sm">
                      <span className="shrink-0 text-accent">{meta.num}</span>
                      <span className="min-w-0 flex-1 leading-5 text-ink">{meta.title}</span>
                      <span className="num shrink-0 text-xs text-muted">{gaps.length}건</span>
                    </div>
                    <div className="ml-6 mt-0.5 text-xs text-muted">{meta.action}</div>
                    {cat === "hidden" && hiddenGap && (
                      <div className="ml-6 mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 rounded-md bg-accent-soft px-2.5 py-1.5 text-xs">
                        <span className="min-w-0 text-ink">{hiddenGap.title}</span>
                        <span className="num shrink-0 font-semibold text-accent">
                          +{hiddenGap.impact}%p 예상 · {EFFORT_LABEL[hiddenGap.effort]}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs leading-5 text-muted">
              ①②③을 모두 채우면 <span className="num font-semibold text-ink">{targetResume.projectedScore}%</span> 예상 · {targetResume.timeline}
            </p>
          </Shell>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <LinkButton href="/result/sample" variant="secondary">
          {COPY.preview.cta}
        </LinkButton>
      </div>
    </div>
  );
}
