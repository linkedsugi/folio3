"use client";

import { useMemo, useState } from "react";
import { Button, Container, LinkButton, SectionLabel } from "@/components/ui";
import { VERDICT_LABEL } from "@/lib/scoring";
import { deleteAnalysis, listAnalyses } from "@/lib/storage";
import type { Verdict } from "@/lib/types";
import { useAnalyses, useHydrated } from "@/lib/useStorage";
import { buildGroups, faceOf, gapOf, storyOf, timestamp, type Group } from "./groups";
import { HistoryCard } from "./HistoryCard";
import { StatsStrip, type Stats } from "./StatsStrip";

type Filter = "all" | Verdict;
type Sort = "recent" | "closest" | "story";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "apply", label: VERDICT_LABEL.apply },
  { id: "hold", label: VERDICT_LABEL.hold },
  { id: "not_recommended", label: VERDICT_LABEL.not_recommended },
];

const SORTS: { id: Sort; label: string }[] = [
  { id: "recent", label: "최근순" },
  { id: "closest", label: "합격선까지 가까운 순" },
  { id: "story", label: "스토리보완 높은 순" },
];

function isSort(v: string): v is Sort {
  return SORTS.some((s) => s.id === v);
}

function computeStats(groups: Group[]): Stats {
  const n = groups.length;
  const counts: Record<Verdict, number> = { apply: 0, hold: 0, not_recommended: 0 };
  let face = 0;
  let story = 0;
  for (const g of groups) {
    // 잠긴 판정은 세지 않는다 — 카드에도 보이지 않는 숫자다
    counts[g.latest.verdict] += 1;
    face += faceOf(g.latest);
    story += storyOf(g.latest);
  }
  return {
    total: n,
    apply: counts.apply,
    hold: counts.hold,
    no: counts.not_recommended,
    avgFace: n ? Math.round(face / n) : 0,
    avgStory: n ? Math.round(story / n) : 0,
  };
}

function sortGroups(groups: Group[], sort: Sort): Group[] {
  const recent = (x: Group, y: Group) => timestamp(y.latest) - timestamp(x.latest);
  const arr = [...groups];
  if (sort === "story") return arr.sort((x, y) => storyOf(y.latest) - storyOf(x.latest) || recent(x, y));
  if (sort === "closest") return arr.sort((x, y) => gapOf(x.latest) - gapOf(y.latest) || recent(x, y));
  return arr.sort(recent);
}

function exportAll() {
  const blob = new Blob([JSON.stringify(listAnalyses(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rolefit-export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Skeleton() {
  return (
    <div aria-busy="true" className="mt-8 animate-pulse" role="status">
      <span className="sr-only">저장된 공고를 불러오는 중입니다.</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card px-4 py-3">
            <div className="h-3 w-14 rounded bg-paper-2" />
            <div className="mt-2 h-6 w-8 rounded bg-paper-2" />
          </div>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2" aria-hidden>
        {[0, 1].map((i) => (
          <div key={i} className="card flex flex-col gap-3 p-5">
            <div className="h-3 w-24 rounded bg-paper-2" />
            <div className="h-5 w-3/4 rounded bg-paper-2" />
            <div className="h-5 w-16 rounded-full bg-paper-2" />
            <div className="h-2 w-full rounded-full bg-paper-2" />
            <div className="h-3 w-2/3 rounded bg-paper-2" />
            <div className="mt-2 h-9 w-16 rounded-lg bg-paper-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card mt-8 px-6 py-12 text-center sm:py-16">
      <h2 className="text-lg font-bold text-ink">아직 판단한 공고가 없습니다.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        첫 분석은 무료입니다. JD와 이력을 붙여넣으면 부서장의 눈으로 판정해 드립니다.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <LinkButton href="/analyze">첫 분석 시작</LinkButton>
        <LinkButton href="/result/sample" variant="secondary">
          예시 결과 보기
        </LinkButton>
      </div>
    </div>
  );
}

export function HistoryList() {
  const loaded = useHydrated();
  const all = useAnalyses();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");

  const groups = useMemo(() => buildGroups(all), [all]);
  const stats = useMemo(() => computeStats(groups), [groups]);
  const visible = useMemo(() => {
    // 잠긴 판정은 '전체' 에서만 보인다 — 판정을 드러내지 않기 위해서다
    const filtered = filter === "all" ? groups : groups.filter((g) => g.latest.verdict === filter);
    return sortGroups(filtered, sort);
  }, [groups, filter, sort]);

  const countOf = (f: Filter) =>
    f === "all" ? stats.total : f === "apply" ? stats.apply : f === "hold" ? stats.hold : stats.no;

  function handleDelete(group: Group) {
    if (!window.confirm("이 결과를 삭제할까요? 되돌릴 수 없습니다.")) return;
    // 카드는 공고 한 건을 뜻하므로 회차 전부를 지운다 — 저장소 변경은 구독을 통해 곧바로 반영된다
    for (const m of group.members) deleteAnalysis(m.id);
  }

  return (
    <Container className="pb-8 pt-8 sm:pt-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionLabel>판단 기록</SectionLabel>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">내 공고</h1>
          <p className="mt-2 text-sm leading-6 text-muted">뿌리는 지원이 아니라, 판단한 지원의 기록입니다.</p>
        </div>
        <LinkButton href="/analyze" className="self-start sm:self-auto">
          새 분석
        </LinkButton>
      </header>

      {!loaded ? (
        <Skeleton />
      ) : groups.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <StatsStrip stats={stats} className="mt-8" />

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div role="group" aria-label="판정으로 거르기" className="flex flex-wrap gap-2">
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(f.id)}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      active ? "border-ink bg-ink text-white" : "border-line-2 bg-card text-ink-2 hover:bg-paper-2"
                    }`}
                  >
                    {f.label}
                    <span className={`num text-xs ${active ? "text-white/70" : "text-muted"}`}>{countOf(f.id)}</span>
                  </button>
                );
              })}
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              정렬
              <select
                value={sort}
                onChange={(e) => {
                  if (isSort(e.target.value)) setSort(e.target.value);
                }}
                className="h-9 rounded-lg border border-line-2 bg-card px-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {visible.length === 0 ? (
            <p className="card mt-4 px-5 py-10 text-center text-sm text-muted">
              「{FILTERS.find((f) => f.id === filter)?.label}」 판정을 받은 공고가 아직 없습니다.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {visible.map((g) => (
                <li key={g.key} className="min-w-0">
                  <HistoryCard group={g} onDelete={handleDelete} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <footer className="mt-10 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-muted">모든 데이터는 이 브라우저에만 저장됩니다.</p>
        <Button type="button" variant="secondary" size="sm" onClick={exportAll} disabled={!loaded || all.length === 0}>
          전체 내보내기 (JSON)
        </Button>
      </footer>
    </Container>
  );
}
