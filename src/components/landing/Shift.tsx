import { COPY } from "@/lib/copy";
import { FlowArrow } from "./Section";

/** 뿌리는 지원에서, 판단하는 지원으로 — 지금 / 이 앱을 거치면 */
export function Shift({ showTitle = false }: { showTitle?: boolean }) {
  const rows = COPY.shift.now.map((now, i) => ({ now, after: COPY.shift.after[i] ?? "" }));
  return (
    <div>
      {showTitle && <h3 className="mb-5 text-lg font-bold text-ink">{COPY.shift.title}</h3>}
      <div className="card overflow-hidden">
        <div className="hidden grid-cols-[1fr_auto_1fr] border-b border-line bg-paper-2/60 text-xs font-bold uppercase tracking-[0.14em] md:grid">
          <div className="px-5 py-3 text-muted">지금</div>
          <div className="w-14" aria-hidden />
          <div className="px-5 py-3 text-accent">이 앱을 거치면</div>
        </div>
        <ol className="divide-y divide-line">
          {rows.map((r, i) => (
            <li key={i} className="grid items-center md:grid-cols-[1fr_auto_1fr]">
              <div className="flex gap-3 px-5 pt-4 md:py-5">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-faint" aria-hidden />
                <div>
                  <div className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted md:hidden">지금</div>
                  <p className="text-sm leading-6 text-muted">{r.now}</p>
                </div>
              </div>
              <FlowArrow className="w-full py-1 md:w-14 md:py-0" />
              <div className="flex gap-3 px-5 pb-4 md:py-5">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                <div>
                  <div className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-accent md:hidden">이 앱을 거치면</div>
                  <p className="text-sm font-medium leading-6 text-ink">{r.after}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-5 max-w-2xl text-[15px] leading-7 text-ink-2">{COPY.shift.footer}</p>
    </div>
  );
}
