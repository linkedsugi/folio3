import type { Verdict } from "@/lib/types";
import { VERDICT_LABEL } from "@/lib/scoring";

const tone: Record<Verdict, string> = {
  apply: "bg-apply-soft text-apply",
  hold: "bg-hold-soft text-hold",
  not_recommended: "bg-no-soft text-no",
};

const dot: Record<Verdict, string> = { apply: "bg-apply", hold: "bg-hold", not_recommended: "bg-no" };

export function VerdictBadge({ verdict, size = "md", withSub = false }: { verdict: Verdict; size?: "sm" | "md" | "lg"; withSub?: boolean }) {
  const sz = size === "lg" ? "text-base px-3.5 py-1.5" : size === "md" ? "text-sm px-3 py-1" : "text-xs px-2 py-0.5";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full font-bold ${tone[verdict]} ${sz}`}>
      <i className={`inline-block h-2 w-2 rounded-full ${dot[verdict]}`} aria-hidden />
      {VERDICT_LABEL[verdict]}
      {withSub && verdict === "hold" && <span className="font-medium opacity-80">· 목표 이력서 완성 후 지원</span>}
    </span>
  );
}
