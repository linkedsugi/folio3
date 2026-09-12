"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { Analysis, Verdict } from "@/lib/types";
import { VERDICT_LABEL, fmtScore } from "@/lib/scoring";
import { COPY, formatDate } from "@/lib/copy";
import { lineage, unlockAnalysis, updateNote, updateProgress } from "@/lib/storage";
import { useAnalyses, useCredits } from "@/lib/useStorage";
import { CopyButton } from "../CopyButton";
import { ScoreMeter } from "../ScoreMeter";
import { VerdictBadge } from "../VerdictBadge";
import { Container, LinkButton, Pill, btnClass } from "../ui";
import { BasicSection } from "./BasicSection";
import { GateCard } from "./GateCard";
import { ManagerSection } from "./ManagerSection";
import { StorySection } from "./StorySection";
import { TargetSection, pathScores } from "./TargetSection";

const NAV = [
  { href: "#top", label: "판정" },
  { href: "#s1", label: "결과물 1" },
  { href: "#s21", label: "2-1" },
  { href: "#s22", label: "2-2" },
  { href: "#s3", label: "3" },
  { href: "#next", label: "다음 행동" },
];

function headline(v: Verdict, story: number, passLine: number): string {
  const gap = passLine - story;
  if (v === "apply") return `스토리보완 ${story}% · 합격선 ${passLine}%를 넘었습니다. 지원할 이유가 있습니다.`;
  if (v === "hold") return `스토리보완 ${story}% · 합격선까지 ${Math.max(1, gap)}%p. 지금은 아니지만, 길은 있습니다.`;
  return `스토리보완 ${story}% · 이 공고는 지금의 이력으로 설득하기 어렵습니다.`;
}

export function ResultView({ analysis: stored, isSample }: { analysis: Analysis; isSample: boolean }) {
  // 샘플은 저장하지 않으므로 체크·메모를 로컬 상태로만 든다
  const [sampleState, setSampleState] = useState<Analysis>(stored);
  const analysis = isSample ? sampleState : stored;
  const credits = useCredits();
  const all = useAnalyses();
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);
  const chain = useMemo(() => (isSample ? [analysis] : lineage(analysis, all)), [analysis, all, isSample]);
  const prev = chain.length >= 2 ? chain[chain.length - 2] : null;
  const version = chain.length;

  const unlocked = analysis.unlocked || isSample;
  const { storyResume: story, basicResume: basic, passLine } = analysis;
  const minimal = useMemo(() => pathScores(analysis).minimal, [analysis]);

  const onToggle = useCallback(
    (gapId: string, done: boolean) => {
      if (isSample) {
        setSampleState((a) => ({ ...a, progress: { ...a.progress, [gapId]: done } }));
        return;
      }
      updateProgress(analysis.id, gapId, done);
    },
    [analysis.id, isSample],
  );
  const onNote = useCallback(
    (gapId: string, text: string) => {
      if (isSample) {
        setSampleState((a) => ({ ...a, notes: { ...(a.notes ?? {}), [gapId]: text } }));
        return;
      }
      updateNote(analysis.id, gapId, text);
    },
    [analysis.id, isSample],
  );
  const onUnlock = useCallback(() => {
    const r = unlockAnalysis(analysis.id);
    if (!r) return;
    setJustUnlocked(r.source === "beta" ? "베타 크레딧 1개로 열었습니다 · 결제는 연동되지 않았습니다" : "열렸습니다");
  }, [analysis.id]);

  const title = [analysis.posting.company, analysis.posting.title].filter(Boolean).join(" · ") || "제목 없는 공고";

  return (
    <Container className="py-6 sm:py-10">
      {isSample && (
        <div className="mb-4 flex flex-col gap-2 rounded-lg border border-hold/30 bg-hold-soft px-4 py-3 text-sm text-ink sm:flex-row sm:items-center sm:justify-between">
          <span><b>샘플 결과입니다.</b> 입력한 내용이 아니라 내장 예시(게임사 경력 없는 그래픽스 전공자)를 분석한 것입니다.</span>
          <Link href="/analyze" className="font-semibold text-accent hover:underline">내 공고로 분석하려면 →</Link>
        </div>
      )}
      {justUnlocked && (
        <div className="mb-4 rounded-lg border border-apply/30 bg-apply-soft px-4 py-3 text-sm text-ink">{justUnlocked}</div>
      )}

      <header id="top" className="card scroll-mt-28 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <Link href="/history" className="hover:text-ink">내 공고</Link>
          <span aria-hidden>›</span>
          <span>{formatDate(analysis.createdAt)}</span>
          {analysis.mode === "demo" && !isSample && <Pill tone="neutral">데모 결과</Pill>}
          {prev && <Pill tone="accent">재분석 v{version}</Pill>}
        </div>
        <h1 className="mt-2 text-2xl font-black leading-tight text-ink sm:text-3xl">{title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <VerdictBadge verdict={analysis.verdict} size="lg" withSub />
          {!unlocked && <Pill tone="neutral">상세 잠김 · 판정과 숫자는 무료</Pill>}
        </div>
        <p className="mt-3 text-base font-semibold leading-snug text-ink sm:text-lg">{headline(analysis.verdict, story.storyScore, passLine)}</p>
        {prev && (
          <p className="num mt-1 text-sm text-accent">
            스토리보완 {prev.storyResume.storyScore}% → {story.storyScore}% ({story.storyScore - prev.storyResume.storyScore >= 0 ? "+" : ""}{story.storyScore - prev.storyResume.storyScore}%p)
            {prev.verdict !== analysis.verdict && ` · 판정이 ${VERDICT_LABEL[prev.verdict]} → ${VERDICT_LABEL[analysis.verdict]}으로 바뀌었습니다`}
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-md">
          <div>
            <div className="text-xs text-muted">액면</div>
            <div className="num text-2xl font-bold text-ink-2">{basic.faceScore}%</div>
          </div>
          <div>
            <div className="text-xs text-muted">스토리보완</div>
            <div className="num text-3xl font-black text-ink sm:text-4xl">{fmtScore(story.storyScoreExact, story.storyScore)}%</div>
          </div>
          <div>
            <div className="text-xs text-muted">합격선</div>
            <div className="num text-2xl font-bold text-ink-2">{passLine}%</div>
          </div>
        </div>
        <ScoreMeter face={basic.faceScore} story={story.storyScore} passLine={passLine} size="lg" className="mt-3" />
        <p className="mt-3 text-sm leading-6 text-muted">{COPY.result.numbersNote}</p>

        <p className="mt-4 rounded-lg bg-paper px-4 py-3 text-sm leading-6 text-ink-2">{analysis.verdictReason}</p>

        {analysis.verdict === "hold" && (
          <p className="mt-3 text-sm">
            <a href="#s3" className="font-semibold text-accent hover:underline">80%까지 무엇이 필요한지 바로 보기 ↓</a>
            <span className="num text-muted"> · ①②만 채워도 {minimal}% 예상</span>
          </p>
        )}
        {analysis.verdict === "not_recommended" && (
          <div className="mt-3 space-y-1 text-sm leading-6 text-ink-2">
            <p>{COPY.verdict.not_recommended}</p>
            <p>이 판정으로 지원서 한 장 쓰는 시간을 아꼈다면, 그 시간은 ③에 쓰세요. 결과물 1에서 복원한 「부서장이 뽑으려는 사람」에 더 가까운 공고를 찾아보세요.</p>
          </div>
        )}
        {!unlocked && (
          <p className="mt-3 text-sm">
            <a href="#gate" className="font-semibold text-accent hover:underline">논증 본문 · 이력서 전문 · 보강 체크리스트 열기 ↓</a>
          </p>
        )}

        <ul className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4 text-xs text-muted">
          {COPY.result.rules.map((r) => (
            <li key={r} className="rounded-full border border-line bg-paper px-2.5 py-1">{r}</li>
          ))}
        </ul>
      </header>

      <nav aria-label="결과 목차" className="no-print sticky top-14 z-30 -mx-4 mt-4 overflow-x-auto border-b border-line bg-paper/90 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:px-2">
        <ul className="flex gap-1 whitespace-nowrap">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-ink-2 hover:bg-paper-2">{n.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-4 space-y-6">
        <ManagerSection view={analysis.managerView} />
        <BasicSection view={analysis.managerView} basic={basic} />
        <StorySection analysis={analysis} locked={!unlocked} />
        {!unlocked && <GateCard analysis={analysis} credits={credits} onUnlock={onUnlock} />}
        <TargetSection
          analysis={analysis}
          progress={analysis.progress ?? {}}
          notes={analysis.notes ?? {}}
          onToggle={onToggle}
          onNote={onNote}
          isSample={isSample}
          locked={!unlocked}
        />
        <NextActions analysis={analysis} isSample={isSample} locked={!unlocked} />
      </div>

      <p className="mt-8 text-xs leading-5 text-faint">{COPY.result.disclaimer}</p>
    </Container>
  );
}

function NextActions({ analysis, isSample, locked }: { analysis: Analysis; isSample: boolean; locked: boolean }) {
  const v = analysis.verdict;
  return (
    <section id="next" className="card scroll-mt-28 p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-3">
        <VerdictBadge verdict={v} size="lg" withSub />
        <span className="text-sm text-muted">최종 판정 · 스토리보완 {analysis.storyResume.storyScore}% 기준</span>
      </div>
      <p className="mt-3 text-base leading-7 text-ink">{COPY.verdict[v]}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {locked && v === "not_recommended" && <a href="#s3" className={btnClass("primary")}>④ 대안 경로 보기</a>}
        {locked && <a href="#gate" className={btnClass(v === "not_recommended" ? "secondary" : "primary")}>이력서 전문과 보강 체크리스트 열기</a>}
        {!locked && v === "apply" && (
          <>
            <CopyButton text={analysis.storyResume.resumeMarkdown} label="스토리보완 이력서 복사하기" size="md" variant="primary" />
            <a href="#s3" className={btnClass("secondary")}>그래도 목표 이력서로 더 올리기</a>
          </>
        )}
        {!locked && v === "hold" && (
          <>
            <a href="#s3" className={btnClass("primary")}>목표 이력서 체크리스트 시작하기</a>
            {!isSample && <Link href={`/analyze?from=${analysis.id}`} className={btnClass("secondary")}>보강 후 다시 분석하기</Link>}
          </>
        )}
        {!locked && v === "not_recommended" && (
          <>
            <a href="#s3" className={btnClass("primary")}>④ 대안 경로 보기</a>
            <Link href="/analyze" className={btnClass("secondary")}>이 역할에 맞는 다른 공고를 분석하기</Link>
          </>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link href="/history" className="text-accent hover:underline">결과 저장됨 · 내 공고</Link>
        <Link href="/analyze" className="text-accent hover:underline">다른 공고 분석하기</Link>
      </div>
      {isSample && (
        <div className="mt-5 rounded-lg bg-paper p-4 text-sm leading-6 text-ink-2">
          이런 결과를 내 공고로 받으려면 공고와 이력을 붙여넣으세요. 첫 분석은 무료입니다.
          <div className="mt-2"><LinkButton href="/analyze" size="sm">첫 분석 무료로 시작하기</LinkButton></div>
        </div>
      )}
    </section>
  );
}
