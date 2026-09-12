import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyzeForm } from "@/components/analyze/AnalyzeForm";
import { Container } from "@/components/ui";
import { liveAvailable, modelName } from "@/lib/ai/pipeline";

export const metadata: Metadata = { title: "분석하기" };
export const dynamic = "force-dynamic";

export default function AnalyzePage() {
  const live = liveAvailable();
  return (
    <Container className="py-6 sm:py-10">
      <Suspense fallback={null}>
        <AnalyzeForm live={live} model={live ? modelName() : null} />
      </Suspense>
    </Container>
  );
}
