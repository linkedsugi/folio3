import type { ManagerView } from "@/lib/types";
import { PRIORITY_LABEL } from "@/lib/scoring";
import { Pill } from "../ui";
import { SectionHeader } from "./SectionHeader";

export function WeightLabel({ weight }: { weight: number }) {
  const label = weight >= 5 ? "핵심" : weight >= 3 ? "중요" : "보조";
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted" title={`무게 ${weight}/5`}>
      <span className="inline-flex gap-px" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <i key={i} className={`h-2 w-1 rounded-sm ${i <= weight ? "bg-ink-2" : "bg-line-2"}`} />
        ))}
      </span>
      {label}
    </span>
  );
}

export function ManagerSection({ view, compact = false }: { view: ManagerView; compact?: boolean }) {
  return (
    <section className="card p-5 sm:p-7">
      <SectionHeader id="s1" number="1" title="부서장이 뽑으려는 사람 (JD 분석)" lead="항목의 목록이 아니라, 한 사람의 해체도로 읽었습니다." />

      <div className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">이 부서의 실제 일</h3>
          <p className="mt-1.5 text-[15px] leading-7 text-ink-2">{view.actualWork}</p>
        </div>
        <div className="rounded-xl bg-ink p-5 text-white md:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">그 일을 해낼 사람의 상</h3>
          <p className="mt-2 text-lg font-bold leading-snug">{view.personProfile}</p>
          {!compact && (
            <ul className="mt-3 space-y-1 text-sm leading-6 text-white/80">
              {view.personTraits.map((t, i) => (
                <li key={i} className="flex gap-2"><span aria-hidden>·</span><span>{t}</span></li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">부서장이 이력서에서 답을 찾는 질문</h3>
        <ol className="mt-2 grid gap-2 sm:grid-cols-2">
          {view.managerQuestions.map((q, i) => (
            <li key={i} className="flex gap-3 rounded-lg border border-line bg-paper px-3.5 py-3 text-sm leading-6 text-ink">
              <span className="num shrink-0 font-bold text-accent">Q{i + 1}</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">각 JD 항목이 담보하려는 실제 능력</h3>
        <div className="mt-2 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="border-b border-line py-2 pr-3 font-semibold">JD 항목</th>
                <th className="border-b border-line py-2 pr-3 font-semibold">구분 · 무게</th>
                <th className="border-b border-line py-2 pr-3 font-semibold">부서장이 실제로 원하는 능력</th>
                <th className="border-b border-line py-2 font-semibold">이력서에서 확인하려는 것</th>
              </tr>
            </thead>
            <tbody>
              {view.items.map((it) => (
                <tr key={it.id} className="align-top">
                  <td className="border-b border-line py-3 pr-3 font-medium text-ink">
                    {it.label}
                    {it.hardGate && <div className="mt-1"><Pill tone="no">단기 대체 불가</Pill></div>}
                  </td>
                  <td className="border-b border-line py-3 pr-3">
                    <div className="flex flex-col gap-1">
                      <Pill tone={it.priority === "required" ? "accent" : "neutral"}>{PRIORITY_LABEL[it.priority]}</Pill>
                      <WeightLabel weight={it.weight} />
                    </div>
                  </td>
                  <td className="border-b border-line py-3 pr-3 leading-6 text-ink-2">{it.intent}</td>
                  <td className="border-b border-line py-3 leading-6 text-muted">{it.signal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-2 space-y-2 md:hidden">
          {view.items.map((it) => (
            <li key={it.id} className="rounded-lg border border-line bg-paper p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink">{it.label}</span>
                <Pill tone={it.priority === "required" ? "accent" : "neutral"}>{PRIORITY_LABEL[it.priority]}</Pill>
                <WeightLabel weight={it.weight} />
                {it.hardGate && <Pill tone="no">단기 대체 불가</Pill>}
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-2"><span className="font-semibold text-ink">실제로 원하는 능력 · </span>{it.intent}</p>
              <p className="mt-1 text-sm leading-6 text-muted"><span className="font-semibold">확인하려는 것 · </span>{it.signal}</p>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 border-t border-line pt-4 text-sm font-medium text-ink">이 상(像)이 이후 모든 판단의 기준점입니다.</p>
    </section>
  );
}
