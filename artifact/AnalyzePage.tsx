import { useEffect, useState } from "react";
import { AnalyzeForm } from "@/components/analyze/AnalyzeForm";
import { Container } from "@/components/ui";
import { getSample } from "./transport";

/** 아티팩트용 분석 페이지 — 뷰어의 Claude 호출 능력이 있으면 실제 분석, 없으면 샘플만 */
export function AnalyzePage() {
  const [live, setLive] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    getSample().then((s) => {
      if (alive) setLive(Boolean(s));
    });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <Container className="py-6 sm:py-10">
      <AnalyzeForm
        live={live === true}
        model={live ? "Claude · 이 페이지를 연 계정의 사용량으로 실행" : null}
        offlineNote={live === null ? "AI 호출 권한 확인 중" : "이 화면에서는 Claude 호출 권한이 없어 샘플 공고만 분석됩니다"}
      />
    </Container>
  );
}
