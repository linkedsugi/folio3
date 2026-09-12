"use client";

import Link from "next/link";
import { use, useMemo } from "react";
import { ResultView } from "@/components/result/ResultView";
import { Container, btnClass } from "@/components/ui";
import { buildSampleAnalysis, SAMPLE_ID } from "@/lib/sample";
import { useAnalyses, useHydrated } from "@/lib/useStorage";

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isSample = id === SAMPLE_ID;
  const hydrated = useHydrated();
  const analyses = useAnalyses();
  const sample = useMemo(() => (isSample ? buildSampleAnalysis() : null), [isSample]);
  const analysis = isSample ? sample : (analyses.find((a) => a.id === id) ?? null);

  if (!isSample && !hydrated) {
    return (
      <Container className="py-10">
        <div className="card animate-pulse p-7" aria-busy="true">
          <div className="h-4 w-32 rounded bg-paper-2" />
          <div className="mt-4 h-8 w-2/3 rounded bg-paper-2" />
          <div className="mt-6 h-4 w-full rounded bg-paper-2" />
          <div className="mt-2 h-4 w-5/6 rounded bg-paper-2" />
        </div>
      </Container>
    );
  }
  if (!analysis) {
    return (
      <Container className="py-16">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <h1 className="text-xl font-bold text-ink">이 결과를 찾을 수 없습니다.</h1>
          <p className="mt-2 text-sm leading-6 text-muted">브라우저 데이터가 지워졌거나 다른 브라우저에서 만든 결과일 수 있습니다. 결과는 만든 브라우저에만 저장됩니다.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/history" className={btnClass("secondary")}>내 공고</Link>
            <Link href="/analyze" className={btnClass("primary")}>새 분석</Link>
          </div>
        </div>
      </Container>
    );
  }
  return <ResultView key={analysis.id} analysis={analysis} isSample={isSample} />;
}
