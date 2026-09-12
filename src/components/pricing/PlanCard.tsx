import { Button, Pill } from "@/components/ui";
import { PLANS, won } from "@/lib/copy";

export type Plan = (typeof PLANS)[number];

/**
 * 요금 카드. 결제 미연동 상태라 버튼은 실제 disabled 다.
 * 강조 카드는 .card 대신 유틸리티로 조립한다 — .card 는 레이어 밖 CSS 라 border-color 유틸리티가 지지 않는다.
 */
export function PlanCard({ plan }: { plan: Plan }) {
  const highlighted = plan.badge !== null;
  return (
    <article
      aria-labelledby={`plan-${plan.id}`}
      className={`relative flex flex-col rounded-card border bg-card p-5 shadow-card ${
        highlighted ? "border-accent ring-1 ring-accent" : "border-line"
      }`}
    >
      {plan.badge && (
        <Pill tone="accent" className="absolute -top-3 left-5">
          {plan.badge}
        </Pill>
      )}

      <h3 id={`plan-${plan.id}`} className="text-base font-bold text-ink">
        {plan.name}
      </h3>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
        <span className="num text-3xl font-black tracking-tight text-ink">{won(plan.price)}</span>
        <span className="text-sm text-muted">/ {plan.unit}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="rounded bg-paper-2 px-1.5 py-0.5 font-semibold text-ink-2">출시 예정가</span>
        {plan.perUnit && <span className="num">{plan.perUnit}</span>}
      </div>

      <ul className="mt-5 flex flex-col gap-2 text-sm leading-6 text-ink-2">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <span className={`mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full ${highlighted ? "bg-accent" : "bg-faint"}`} aria-hidden />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-5">
        <p className="text-xs leading-5 text-muted">{plan.note}</p>
        <Button
          type="button"
          variant="secondary"
          disabled
          aria-disabled="true"
          title="출시 시 카드·간편결제 지원 예정"
          className="mt-4 h-auto! min-h-11 w-full whitespace-normal! py-2.5 text-center leading-5"
        >
          결제 준비 중 · 베타 크레딧으로 이용
        </Button>
        <p className="mt-2 text-center text-[11px] leading-4 text-faint">출시 시 카드·간편결제 지원 예정</p>
      </div>
    </article>
  );
}
