import type { BasicResume, ManagerView } from "@/lib/types";
import { PRIORITY_LABEL } from "@/lib/scoring";
import { COPY } from "@/lib/copy";
import { LevelBar, LevelDot } from "../LevelDot";
import { Pill } from "../ui";
import { SectionHeader } from "./SectionHeader";

export function BasicSection({ view, basic }: { view: ManagerView; basic: BasicResume }) {
  return (
    <section className="card p-5 sm:p-7">
      <SectionHeader
        id="s21"
        number="2-1"
        title="기본 이력서"
        lead="내 이력을 그대로 정리하고, JD 요소별로 액면 대응을 표시했습니다. 이 숫자만 보면 지원할 이유가 없어 보이는 게 정상입니다."
        aside={
          <div className="text-right">
            <div className="text-xs text-muted">액면 충족률</div>
            <div className="num text-3xl font-black text-ink-2">{basic.faceScore}%</div>
          </div>
        }
      />

      <p className="rounded-lg bg-paper px-4 py-3 text-sm leading-6 text-ink-2">{basic.summary}</p>

      <ul className="mt-4 divide-y divide-line">
        {basic.matches.map((m) => {
          const it = view.items.find((i) => i.id === m.itemId);
          if (!it) return null;
          return (
            <li key={m.itemId} className="grid gap-2 py-3.5 sm:grid-cols-12 sm:gap-4">
              <div className="sm:col-span-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{it.label}</span>
                  <Pill tone={it.priority === "required" ? "accent" : "neutral"}>{PRIORITY_LABEL[it.priority]}</Pill>
                </div>
              </div>
              <div className="sm:col-span-3">
                <LevelDot level={m.level} />
                <LevelBar level={m.level} className="mt-1.5 max-w-[160px]" />
              </div>
              <div className="text-sm leading-6 sm:col-span-5">
                {m.evidence ? (
                  <p className="text-ink-2">
                    <span className="text-muted">대응 · </span>
                    <q className="italic">{m.evidence}</q>
                  </p>
                ) : (
                  <p className="text-muted">대응하는 이력 없음</p>
                )}
                <p className="text-muted">{m.note}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <details className="mt-4 rounded-lg border border-line bg-paper">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-ink">정리된 내 이력 보기</summary>
        <div className="space-y-4 px-4 pb-4">
          {basic.sections.map((s) => (
            <div key={s.title}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">{s.title}</h4>
              <ul className="mt-1.5 space-y-2">
                {s.entries.map((e, i) => (
                  <li key={i} className="text-sm leading-6">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      {e.period && <span className="num text-xs text-muted">{e.period}</span>}
                      <span className="font-semibold text-ink">{e.title}</span>
                    </div>
                    <p className="text-ink-2">{e.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>

      <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-ink-2">{COPY.result.faceNote}</p>
        <a href="#s22" className="shrink-0 text-sm font-semibold text-accent hover:underline">갈음 논증으로 얼마나 올라가는지 보기 ↓</a>
      </div>
    </section>
  );
}
