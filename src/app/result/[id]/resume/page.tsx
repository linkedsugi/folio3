"use client";

import Link from "next/link";
import { use, useMemo } from "react";
import { CopyButton, DownloadButton } from "@/components/CopyButton";
import { Markdown } from "@/components/Markdown";
import { Button, btnClass } from "@/components/ui";
import { formatDate } from "@/lib/copy";
import { buildSampleAnalysis, SAMPLE_ID } from "@/lib/sample";
import { useAnalyses, useHydrated } from "@/lib/useStorage";

export default function ResumePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isSample = id === SAMPLE_ID;
  const hydrated = useHydrated();
  const analyses = useAnalyses();
  const sample = useMemo(() => (isSample ? buildSampleAnalysis() : null), [isSample]);
  const a = isSample ? sample : (analyses.find((x) => x.id === id) ?? null);

  if (!isSample && !hydrated) return null;
  if (!a) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-ink">이 결과를 찾을 수 없습니다.</p>
        <Link href="/history" className={`${btnClass("secondary")} mt-4`}>내 공고</Link>
      </div>
    );
  }
  const unlocked = a.unlocked || isSample;
  const title = [a.posting.company, a.posting.title].filter(Boolean).join(" · ");
  const filename = `${title || "이력서"}-스토리보완.md`.replace(/[\\/:*?"<>|]/g, "_");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href={`/result/${id}`} className={btnClass("ghost", "sm")}>← 결과로</Link>
        {unlocked && (
          <div className="flex flex-wrap gap-2">
            <CopyButton text={a.storyResume.resumeMarkdown} label="복사" size="md" />
            <DownloadButton text={a.storyResume.resumeMarkdown} filename={filename} label=".md 다운로드" size="md" />
            <Button type="button" onClick={() => window.print()}>인쇄 / PDF 저장</Button>
          </div>
        )}
      </div>
      {unlocked ? (
        <article className="card p-6 sm:p-10 print:border-0 print:p-0">
          <Markdown text={a.storyResume.resumeMarkdown} />
          <p className="mt-8 border-t border-line pt-3 text-[11px] text-faint">
            RoleFit Canvas · {formatDate(a.createdAt)} · 스토리보완 이력서 · 근거 미확인 항목은 제외됨 · 대상 공고: {title}
          </p>
        </article>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-ink">이 공고의 스토리보완 이력서는 아직 열리지 않았습니다.</p>
          <Link href={`/result/${id}#gate`} className={`${btnClass("primary")} mt-4`}>결과 화면에서 열기</Link>
        </div>
      )}
    </div>
  );
}
