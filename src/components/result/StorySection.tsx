import Link from "next/link";
import type { Analysis } from "@/lib/types";
import { LEVEL_LABEL, PRIORITY_LABEL } from "@/lib/scoring";
import { COPY } from "@/lib/copy";
import { CopyButton, DownloadButton } from "../CopyButton";
import { LevelDot } from "../LevelDot";
import { Markdown } from "../Markdown";
import { ScoreMeter } from "../ScoreMeter";
import { Pill, btnClass } from "../ui";
import { ScoreSheet } from "./ScoreSheet";
import { SectionHeader } from "./SectionHeader";

export function StorySection({ analysis, locked = false }: { analysis: Analysis; locked?: boolean }) {
  const { managerView: view, basicResume: basic, storyResume: story, id } = analysis;
  const gap = analysis.passLine - story.storyScore;
  const notCounted = story.arguments.filter((a) => !a.counted).length;
  const counted = story.arguments.length - notCounted;
  const filename = `${analysis.posting.company || "공고"}-${analysis.posting.title || "이력서"}-스토리보완.md`.replace(/[\\/:*?"<>|]/g, "_");

  return (
    <section className="card p-5 sm:p-7">
      <SectionHeader
        id="s22"
        number="2-2"
        title="스토리보완 이력서"
        lead="부서장이 읽고 싶은 질문에 답하는 순서로 내 경험을 다시 배열했습니다. 이 이력서를 취준생에게 제공합니다."
        aside={
          <div className="text-right">
            <div className="text-xs text-muted">스토리보완 후 충족률</div>
            <div className="num text-3xl font-black text-ink">{story.storyScore}%</div>
            <div className="num text-xs text-muted">{gap > 0 ? `합격선까지 ${gap}%p` : "합격선 통과"}</div>
          </div>
        }
      />

      <ScoreMeter face={basic.faceScore} story={story.storyScore} passLine={analysis.passLine} />

      <blockquote className="mt-6 rounded-xl border-l-4 border-accent bg-accent-soft/60 px-5 py-4">
        <div className="text-xs font-bold uppercase tracking-wider text-accent">부서장을 향한 한 줄</div>
        <p className="mt-1 text-lg font-bold leading-snug text-ink">{story.headline}</p>
      </blockquote>

      {locked && (
        <>
          <h3 className="mt-8 text-base font-bold text-ink">항목별 갈음 결과 <span className="text-sm font-medium text-muted">· 논증 본문과 근거는 잠김</span></h3>
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-paper">
            {view.items.map((it) => {
              const face = basic.matches.find((m) => m.itemId === it.id)?.level ?? "unmet";
              const arg = story.arguments.find((a) => a.itemId === it.id);
              const after = arg ? arg.level : face;
              return (
                <li key={it.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                  <span className="font-medium text-ink">{it.label}</span>
                  <span className="flex items-center gap-2 text-muted">
                    <LevelDot level={face} /> <span aria-hidden>→</span> <LevelDot level={after} />
                    {arg && (
                      <Pill tone={arg.counted ? "apply" : arg.evidenceStatus === "grounded" ? "neutral" : "warn"}>
                        {arg.counted ? "반영" : arg.evidenceStatus === "grounded" ? "액면 유지" : "미반영 · 근거 부족"}
                      </Pill>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 rounded-lg bg-paper-2 px-4 py-3 text-sm leading-6 text-ink-2">
            {COPY.result.evidenceNote} <span className="num font-semibold">반영 {counted}건 · 미반영 {notCounted}건.</span>
          </p>
          <p className="mt-3 text-sm"><a href="#gate" className="font-semibold text-accent hover:underline">논증 본문 · 근거 · 이력서 전문 열기 ↓</a></p>
        </>
      )}
      {!locked && (<>
      <h3 className="mt-8 text-base font-bold text-ink">항목별 갈음 논증과 근거</h3>
      <p className="mt-1 text-sm text-muted">항목을 그대로 채우지 못해도, 부서장이 그 항목으로 담보하려던 능력을 다른 경험으로 갈음할 수 있는지 논증했습니다.</p>
      <ul className="mt-3 space-y-3">
        {view.items.map((it) => {
          const face = basic.matches.find((m) => m.itemId === it.id)?.level ?? "unmet";
          const arg = story.arguments.find((a) => a.itemId === it.id);
          if (!arg) {
            return (
              <li key={it.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-paper px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{it.label}</span>
                  <Pill tone={it.priority === "required" ? "accent" : "neutral"}>{PRIORITY_LABEL[it.priority]}</Pill>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <LevelDot level={face} />
                  <span>· 액면 그대로 {face === "met" ? "— 논증 불필요" : ""}</span>
                </div>
              </li>
            );
          }
          const raised = arg.counted;
          const tone = raised ? "apply" : arg.evidenceStatus === "grounded" ? "neutral" : "warn";
          const status = raised
            ? `근거 있음 · 점수 반영 (${LEVEL_LABEL[face]} → ${LEVEL_LABEL[arg.level]})`
            : arg.evidenceStatus === "grounded"
              ? "근거 있음 · 액면 유지"
              : arg.evidenceStatus === "weak"
                ? "근거 부족 · 점수 미반영"
                : "근거 없음 · 점수 미반영";
          return (
            <li key={it.id} className={`rounded-xl border p-4 sm:p-5 ${raised ? "border-apply/30 bg-card" : "border-line bg-paper"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{it.label}</span>
                  <Pill tone={it.priority === "required" ? "accent" : "neutral"}>{PRIORITY_LABEL[it.priority]}</Pill>
                </div>
                <Pill tone={tone}>{status}</Pill>
              </div>
              <dl className="mt-3 grid gap-2 text-sm leading-6 sm:grid-cols-[7rem_1fr]">
                <dt className="text-muted">부서장이 원한 능력</dt>
                <dd className="text-ink-2">{it.intent}</dd>
                <dt className="text-muted">갈음 주장</dt>
                <dd className="font-semibold text-ink">{arg.claim}</dd>
                <dt className="text-muted">논증</dt>
                <dd className={raised ? "text-ink-2" : "text-muted"}>{arg.argument}</dd>
                <dt className="text-muted">근거</dt>
                <dd>
                  {arg.evidence.length === 0 ? (
                    <span className="text-muted">이력 원문에서 확인된 근거 없음</span>
                  ) : (
                    <ul className="space-y-1.5">
                      {arg.evidence.map((e, i) => (
                        <li key={i} className="rounded-md border border-line bg-card px-3 py-2">
                          <q className="text-ink">{e.quote}</q>
                          <div className="mt-0.5 text-xs text-muted">— {e.source} · 이력 원문 인용</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </dl>
              <p className={`mt-3 text-sm leading-6 ${raised ? "text-muted" : "text-[#7a4b00]"}`}>
                {arg.note}
                {!raised && (
                  <>
                    {" "}
                    <a href="#s3" className="font-semibold text-accent hover:underline">목표 이력서에서 보강 방법 보기 ↓</a>
                  </>
                )}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 rounded-lg bg-paper-2 px-4 py-3 text-sm leading-6 text-ink-2">
        {COPY.result.evidenceNote} <span className="num font-semibold">이번 분석에서 점수 미반영 처리된 주장: {notCounted}건.</span>
      </p>

      <div className="mt-4">
        <ScoreSheet view={view} basic={basic} story={story} />
      </div>

      <h3 className="mt-8 text-base font-bold text-ink">부서장의 질문에 답하는 순서로 재배열한 이력</h3>
      <ol className="mt-3 space-y-3">
        {story.answers.map((a, i) => (
          <li key={i} className="rounded-lg border border-line bg-paper p-4">
            <div className="flex gap-2 text-sm font-semibold text-ink"><span className="num text-accent">Q{i + 1}</span><span>{a.question}</span></div>
            <p className="mt-1.5 text-sm leading-6 text-ink-2">{a.answer}</p>
            <ul className="mt-2 space-y-1 text-sm leading-6 text-ink-2">
              {a.bullets.map((b) => (
                <li key={b} className="flex gap-2"><span aria-hidden>·</span><span>{b}</span></li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-ink">스토리보완 이력서 전문</h3>
            <p className="text-sm text-muted">부서장이 읽고 싶은 순서로 재배열했습니다. 제출 전 근거 수치를 직접 확인하세요.</p>
          </div>
          <div className="no-print flex flex-wrap gap-2">
            <CopyButton text={story.resumeMarkdown} />
            <DownloadButton text={story.resumeMarkdown} filename={filename} />
            <Link href={`/result/${id}/resume`} className={btnClass("secondary", "sm")}>인쇄용 보기</Link>
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-line bg-card p-5 sm:p-7">
          <Markdown text={story.resumeMarkdown} />
        </div>
      </div>
      </>)}
    </section>
  );
}
