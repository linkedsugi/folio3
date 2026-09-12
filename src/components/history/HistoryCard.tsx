"use client";

import { ScoreMeter } from "@/components/ScoreMeter";
import { VerdictBadge } from "@/components/VerdictBadge";
import { Button, LinkButton, Pill } from "@/components/ui";
import { formatDate } from "@/lib/copy";
import type { Analysis } from "@/lib/types";
import { faceOf, gapOf, passLineOf, storyOf, titleOf, type Group } from "./groups";

function oneLiner(a: Analysis): string {
  switch (a.verdict) {
    case "hold": {
      const gaps = (a.targetResume?.gaps ?? []).filter((g) => g.category !== "hard");
      const done = gaps.filter((g) => a.progress?.[g.id]).length;
      return `합격선까지 ${gapOf(a)}%p · 보강 ${done}/${gaps.length} 완료`;
    }
    case "apply":
      return "지원 가능 · 스토리보완 이력서 준비됨";
    case "not_recommended":
      return "대안 경로 확인";
  }
}

export function HistoryCard({ group, onDelete }: { group: Group; onDelete: (group: Group) => void }) {
  const { latest, chain } = group;
  const versions = chain.length;
  const trend = versions > 1 ? chain.map((a, i) => `v${i + 1} ${storyOf(a)}%`).join(" → ") : null;
  const date = formatDate(latest.createdAt);

  return (
    <article aria-labelledby={`h-${latest.id}`} className="card rise flex h-full flex-col gap-3 p-4 sm:p-5">
      <header className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {latest.mode === "demo" && <Pill>샘플</Pill>}
          {versions > 1 && <Pill>v{versions} · 재분석 {versions - 1}회</Pill>}
          {date && (
            <time className="num" dateTime={latest.createdAt}>
              {date}
            </time>
          )}
        </div>
        <h2 id={`h-${latest.id}`} className="line-clamp-2 text-base font-bold leading-6 text-ink">
          {titleOf(latest)}
        </h2>
      </header>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <VerdictBadge verdict={latest.verdict} size="sm" />
        {!latest.unlocked && <Pill>상세 잠김</Pill>}
        {trend && (
          <span className="num text-xs text-muted" aria-label={`회차별 스토리보완 충족률 ${trend}`}>
            {trend}
          </span>
        )}
      </div>

      <ScoreMeter size="sm" face={faceOf(latest)} story={storyOf(latest)} passLine={passLineOf(latest)} />

      <p className="text-sm leading-6 text-ink-2">{oneLiner(latest)}</p>

      <footer className="mt-auto flex items-center justify-between gap-2 pt-1">
        <LinkButton href={`/result/${latest.id}`} size="sm">
          열기
        </LinkButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(group)}>
          삭제
        </Button>
      </footer>
    </article>
  );
}
