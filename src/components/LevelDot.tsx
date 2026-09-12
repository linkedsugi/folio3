import type { MatchLevel } from "@/lib/types";
import { LEVEL_LABEL } from "@/lib/scoring";

export function LevelDot({ level, label = true, className = "" }: { level: MatchLevel; label?: boolean; className?: string }) {
  const glyph = level === "met" ? "●" : level === "partial" ? "◐" : "○";
  const color = level === "met" ? "text-met" : level === "partial" ? "text-partial" : "text-faint";
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm ${className}`}>
      <span className={`${color} text-[15px] leading-none`} aria-hidden>
        {glyph}
      </span>
      {label && <span className={level === "unmet" ? "text-muted" : "text-ink-2"}>{LEVEL_LABEL[level]}</span>}
    </span>
  );
}

export function LevelBar({ level, className = "" }: { level: MatchLevel; className?: string }) {
  const w = level === "met" ? "100%" : level === "partial" ? "50%" : "0%";
  const c = level === "met" ? "bg-met" : level === "partial" ? "bg-partial" : "bg-unmet";
  return (
    <div className={`h-1.5 w-full rounded-full bg-paper-2 ${className}`} aria-hidden>
      <div className={`h-full rounded-full ${c}`} style={{ width: w }} />
    </div>
  );
}
