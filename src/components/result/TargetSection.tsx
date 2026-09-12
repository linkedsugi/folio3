"use client";

import Link from "next/link";
import type { Analysis, Gap, GapCategory } from "@/lib/types";
import { EFFORT_LABEL, GAP_CATEGORY_META } from "@/lib/scoring";
import { Markdown } from "../Markdown";
import { Pill, btnClass } from "../ui";
import { SectionHeader } from "./SectionHeader";

const ORDER: GapCategory[] = ["hidden", "weak", "missing", "hard"];

export function pathScores(a: Analysis) {
  const s = a.storyResume.storyScore;
  const sum = (cats: GapCategory[]) =>
    a.targetResume.gaps.filter((g) => cats.includes(g.category)).reduce((x, g) => x + g.impact, 0);
  return {
    minimal: Math.min(100, s + sum(["hidden", "weak"])),
    recommended: Math.min(100, s + sum(["hidden", "weak", "missing"])),
  };
}

export function TargetSection({
  analysis,
  progress,
  notes,
  onToggle,
  onNote,
  isSample,
  locked = false,
}: {
  analysis: Analysis;
  progress: Record<string, boolean>;
  notes: Record<string, string>;
  onToggle: (gapId: string, done: boolean) => void;
  onNote: (gapId: string, text: string) => void;
  isSample: boolean;
  locked?: boolean;
}) {
  const { targetResume: target, storyResume: story, managerView: view, passLine } = analysis;
  const gaps = target.gaps;
  const doable = gaps.filter((g) => g.category !== "hard");
  const done = doable.filter((g) => progress[g.id]).length;
  const checkedGain = doable.filter((g) => progress[g.id]).reduce((s, g) => s + g.impact, 0);
  const expected = Math.min(100, story.storyScore + checkedGain);
  const { minimal, recommended } = pathScores(analysis);
  const gap = passLine - story.storyScore;
  const hasInput = done > 0 || Object.values(notes).some((n) => n.trim().length > 0);

  return (
    <section className="card p-5 sm:p-7">
      <SectionHeader
        id="s3"
        number="3"
        title="목표 이력서"
        lead="보강을 마치고 제출할 이력서입니다. 부족한 부분을 네 가지로 구분해, 쉬운 것부터 배치했습니다."
        aside={
          <div className="text-right">
            <div className="text-xs text-muted">합격선 {passLine}%까지</div>
            <div className="num text-3xl font-black text-ink">{gap > 0 ? `${gap}%p` : "통과"}</div>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-paper p-4">
          <div className="text-xs text-muted">현재 스토리보완</div>
          <div className="num mt-1 text-2xl font-black text-ink">{story.storyScore}%</div>
        </div>
        <div className="rounded-lg border border-line bg-paper p-4">
          <div className="text-xs text-muted">①② 만 채우면 (예상)</div>
          <div className={`num mt-1 text-2xl font-black ${minimal >= passLine ? "text-apply" : "text-ink"}`}>{minimal}%</div>
        </div>
        <div className="rounded-lg border border-line bg-paper p-4">
          <div className="text-xs text-muted">③ 까지 채우면 (예상)</div>
          <div className={`num mt-1 text-2xl font-black ${recommended >= passLine ? "text-apply" : "text-ink"}`}>{recommended}%</div>
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">예상치는 항목 무게 기준 계산값입니다. 실제 반영은 보강 내용을 넣고 다시 분석했을 때 근거가 확인된 만큼만 됩니다. 예상 기간: {target.timeline}</p>

      {locked && (
        <>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {ORDER.map((cat) => {
              const meta = GAP_CATEGORY_META[cat];
              const list = gaps.filter((g) => g.category === cat);
              const sum = list.reduce((x, g) => x + g.impact, 0);
              return (
                <li key={cat} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-paper px-4 py-3 text-sm">
                  <span><span className="font-black text-ink">{meta.num}</span> <span className="font-semibold text-ink">{meta.title}</span></span>
                  <span className="num shrink-0 text-muted">{list.length}건{cat !== "hard" && sum > 0 ? ` · +${sum}%p` : ""}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-sm"><a href="#gate" className="font-semibold text-accent hover:underline">보강 항목 · 체크리스트 · 재분석 열기 ↑</a></p>
        </>
      )}
      {!locked && (<>

      <div className="mt-6 rounded-xl border border-accent/30 bg-accent-soft/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-ink">
            체크리스트 <span className="num">{done}/{doable.length}</span> 채움
            <span className="num ml-2 text-accent">→ 반영 시 예상 {expected}%</span>
          </div>
          {isSample ? (
            <span className="text-xs text-muted">샘플에서는 체크가 저장되지 않습니다</span>
          ) : (
            <span className="text-xs text-muted">체크와 메모는 이 브라우저에 저장됩니다</span>
          )}
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-card">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${doable.length ? (done / doable.length) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {ORDER.map((cat) => {
          const meta = GAP_CATEGORY_META[cat];
          const list = gaps.filter((g) => g.category === cat);
          return (
            <div key={cat} className={`rounded-xl border ${list.length ? "border-line bg-card" : "border-dashed border-line bg-paper"} p-4 sm:p-5`}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-lg font-black text-ink">{meta.num}</span>
                <h3 className="text-base font-bold text-ink">{meta.title}</h3>
                <span className="text-sm text-muted">→ {meta.action}</span>
              </div>
              {list.length === 0 ? (
                <p className="mt-2 text-sm text-muted">이 갈래에 해당하는 항목은 없습니다.</p>
              ) : (
                <>
                  <p className="mt-1 text-xs text-muted">{meta.hint}</p>
                  <ul className="mt-3 space-y-3">
                    {list.map((g) => (
                      <GapRow
                        key={g.id}
                        gap={g}
                        itemLabel={view.items.find((i) => i.id === g.itemId)?.label ?? ""}
                        done={Boolean(progress[g.id])}
                        note={notes[g.id] ?? ""}
                        onToggle={onToggle}
                        onNote={onNote}
                      />
                    ))}
                  </ul>
                </>
              )}
            </div>
          );
        })}
      </div>

      <details className="mt-6 rounded-lg border border-line bg-paper">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-ink">목표 이력서 미리보기 — 보강 후 제출할 모습</summary>
        <div className="px-4 pb-4">
          <p className="mb-3 text-xs text-muted"><span className="todo rounded px-1">[보강 예정]</span> 표시는 아직 없는 사실입니다. 채워지기 전에는 제출하지 않습니다.</p>
          <div className="rounded-lg border border-line bg-card p-5">
            <Markdown text={target.resumeMarkdown} />
          </div>
        </div>
      </details>

      <div className="mt-6 rounded-xl bg-ink p-5 text-white">
        <div className="text-xs font-bold uppercase tracking-wider text-white/60">보강 후</div>
        <p className="mt-1 text-base font-bold">보강 내용을 반영해서 다시 분석하기</p>
        <p className="mt-1 text-sm leading-6 text-white/75">
          체크리스트의 답변과 메모가 기존 이력 뒤에 [보강 추가] 블록으로 자동으로 붙습니다. 이력을 다시 붙여넣을 필요가 없습니다. 근거가 확인된 만큼만 점수에 반영됩니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {isSample ? (
            <span className="text-sm text-white/70">샘플 결과에서는 재분석할 수 없습니다. 내 공고로 분석해 보세요.</span>
          ) : (
            <Link
              href={`/analyze?from=${analysis.id}`}
              aria-disabled={!hasInput}
              className={btnClass("secondary", "md", hasInput ? "" : "pointer-events-none opacity-50")}
            >
              보강 내용 반영해서 다시 분석하기
            </Link>
          )}
          {!isSample && !hasInput && <span className="self-center text-xs text-white/60">체크 1개 또는 메모 1줄 이상이면 활성화됩니다</span>}
        </div>
      </div>
      </>)}
    </section>
  );
}

function GapRow({
  gap,
  itemLabel,
  done,
  note,
  onToggle,
  onNote,
}: {
  gap: Gap;
  itemLabel: string;
  done: boolean;
  note: string;
  onToggle: (id: string, done: boolean) => void;
  onNote: (id: string, text: string) => void;
}) {
  const hard = gap.category === "hard";
  const inputId = `note-${gap.id}`;
  return (
    <li className={`rounded-lg border p-3.5 sm:p-4 ${done ? "border-apply/40 bg-apply-soft/40" : "border-line bg-paper"}`}>
      <div className="flex items-start gap-3">
        {hard ? (
          <span className="mt-0.5 shrink-0"><Pill tone="no">미충족</Pill></span>
        ) : (
          <input
            id={`chk-${gap.id}`}
            type="checkbox"
            checked={done}
            onChange={(e) => onToggle(gap.id, e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[#1e40af]"
            aria-label={`${gap.title} 채움`}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <label htmlFor={hard ? undefined : `chk-${gap.id}`} className={`font-semibold text-ink ${hard ? "" : "cursor-pointer"}`}>{gap.title}</label>
            <span className="text-xs text-muted">· {itemLabel}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className={`num rounded-md px-1.5 py-0.5 font-semibold ${hard ? "bg-no-soft text-no" : "bg-accent-soft text-accent"}`}>
              {hard ? `채우면 +${gap.impact}%p 이지만 단기 대체 불가` : `채우면 +${gap.impact}%p 예상`}
            </span>
            <span className="text-muted">소요 {EFFORT_LABEL[gap.effort]}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-ink-2">{gap.action}</p>
          {gap.questions && gap.questions.length > 0 && (
            <ul className="mt-2 space-y-1 rounded-md bg-card px-3 py-2 text-sm leading-6 text-ink-2">
              {gap.questions.map((q) => (
                <li key={q} className="flex gap-2"><span className="text-accent" aria-hidden>?</span><span>{q}</span></li>
              ))}
            </ul>
          )}
          {gap.alternativePath && (
            <p className="mt-2 rounded-md bg-card px-3 py-2 text-sm leading-6 text-ink-2"><span className="font-semibold text-ink">대안 경로 · </span>{gap.alternativePath}</p>
          )}
          {!hard && (
            <div className="mt-2">
              <label htmlFor={inputId} className="sr-only">{gap.title} 답변 또는 메모</label>
              <textarea
                id={inputId}
                value={note}
                onChange={(e) => onNote(gap.id, e.target.value)}
                rows={2}
                placeholder={gap.category === "hidden" ? "질문에 답해 보세요. 사실만 적으면 다음 분석에서 근거가 됩니다." : "한 일·숫자·산출물을 적어 두세요. 재분석 때 이력에 붙습니다."}
                className="w-full resize-y rounded-md border border-line bg-card px-3 py-2 text-sm leading-6 text-ink placeholder:text-faint focus:border-accent focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
