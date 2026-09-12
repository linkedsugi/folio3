import type { AnalyzeEvent } from "../types";

export interface AnalyzeRequest {
  id: string;
  company: string;
  title: string;
  jdText: string;
  resumeText: string;
  demo: boolean;
  parentId: string | null;
}

/**
 * 분석 요청을 보내고 이벤트를 순서대로 전달한다 (서버 NDJSON 스트림).
 * HTTP 오류는 서버가 준 문구로 throw 한다. 아티팩트 빌드에서는 브라우저 내 구현으로 대체된다.
 */
export async function streamAnalysis(req: AnalyzeRequest, onEvent: (e: AnalyzeEvent) => void, signal: AbortSignal): Promise<void> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok || !res.body) {
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(j?.error ?? `요청이 실패했습니다 (${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      onEvent(JSON.parse(line) as AnalyzeEvent);
    }
  }
}
