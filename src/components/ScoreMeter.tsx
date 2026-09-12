import { PASS_LINE } from "@/lib/types";

export function ScoreMeter({
  face,
  story,
  passLine = PASS_LINE,
  size = "md",
  showLabels = true,
  className = "",
}: {
  face: number;
  story: number;
  passLine?: number;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  className?: string;
}) {
  const h = size === "lg" ? "h-4" : size === "md" ? "h-3" : "h-2";
  const gain = Math.max(0, story - face);
  return (
    <div className={className}>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={story}
        aria-label={`액면 ${face}, 스토리보완 ${story}, 합격선 ${passLine}`}
        className={`relative w-full overflow-visible rounded-full bg-paper-2 ${h}`}
      >
        <div className="absolute inset-y-0 left-0 rounded-full bg-met/90" style={{ width: `${Math.min(100, story)}%` }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-muted" style={{ width: `${Math.min(100, face)}%` }} />
        <div
          className="absolute -top-1 -bottom-1 w-0 border-l-2 border-dashed border-pass"
          style={{ left: `${passLine}%` }}
          aria-hidden
        />
      </div>
      {showLabels && (
        <div className={`mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 ${size === "sm" ? "text-[11px]" : "text-xs"} text-muted`}>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2 w-2 rounded-full bg-muted" aria-hidden />
            액면 <b className="num text-ink-2">{face}%</b>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2 w-2 rounded-full bg-met" aria-hidden />
            스토리보완 <b className="num text-ink">{story}%</b>
            {gain > 0 && <span className="num text-accent">(+{gain}%p)</span>}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-0 border-l-2 border-dashed border-pass" aria-hidden />
            합격선 <b className="num text-ink-2">{passLine}%</b>
          </span>
        </div>
      )}
    </div>
  );
}
