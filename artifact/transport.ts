/**
 * 아티팩트 빌드용 분석 전송 계층 — 서버 없이 브라우저 안에서 파이프라인을 돌린다.
 * 실제 분석은 claude.ai 아티팩트의 `sample` 능력(뷰어 계정의 Claude)으로 호출한다.
 */
import { z } from "zod";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { AnalyzeError, runDemo, runStages, type StageCaller } from "@/lib/ai/stages";
import type { AnalyzeRequest } from "@/lib/client/transport";
import type { AnalyzeEvent } from "@/lib/types";

type ModelTier = "quick" | "default" | "complex";
interface SampleFn {
  (input: string, opts?: { signal?: AbortSignal; modelTier?: ModelTier; cache?: boolean }): Promise<{ text: string; truncated: boolean }>;
  json: (input: string, opts?: { signal?: AbortSignal; modelTier?: ModelTier; cache?: boolean }) => Promise<unknown>;
  limits?: () => Promise<{ inputBytes?: number }>;
}
interface ClaudeRuntime {
  use: (name: string) => Promise<unknown>;
}

let samplePromise: Promise<SampleFn | null> | null = null;

/** 뷰어에게 Claude 호출 능력이 있는지 (없으면 null). 10초 안에 응답이 없으면 null */
export function getSample(): Promise<SampleFn | null> {
  if (samplePromise) return samplePromise;
  const rt = (globalThis as { claude?: ClaudeRuntime }).claude;
  if (!rt || typeof rt.use !== "function") {
    samplePromise = Promise.resolve(null);
    return samplePromise;
  }
  samplePromise = rt
    .use("sample")
    .then((ns) => (typeof ns === "function" ? (ns as SampleFn) : null))
    .catch(() => null);
  return samplePromise;
}

function tierFor(stage: string): ModelTier {
  if (stage === "story" || stage === "manager") return "complex";
  return "default";
}

function issuesText(err: z.ZodError): string {
  return err.issues
    .slice(0, 6)
    .map((i) => `- ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

function makeCaller(sample: SampleFn, signal: AbortSignal): StageCaller {
  return async ({ stage, schema, prompt }) => {
    const jsonSchema = JSON.stringify(z.toJSONSchema(schema));
    const base = `${SYSTEM_PROMPT}\n\n${prompt}\n\n=== 출력 형식 ===\n아래 JSON 스키마를 정확히 따르는 JSON 객체 하나만 출력한다. 설명 문장, 마크다운 코드펜스, 주석 없이 JSON 만 출력한다. 모든 필드를 채운다 (선택 필드는 null).\n${jsonSchema}`;
    let feedback = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      if (signal.aborted) throw new AnalyzeError("aborted", "분석을 취소했습니다.");
      let data: unknown;
      try {
        data = await sample.json(base + feedback, { signal, modelTier: tierFor(stage) });
      } catch (e) {
        const code = (e as { code?: string })?.code;
        if (code === "cancelled") throw new AnalyzeError("aborted", "분석을 취소했습니다.");
        if (code === "not_granted") throw new AnalyzeError("auth", "이 페이지에서 Claude 를 호출할 권한이 없습니다. 권한을 허용하면 실제 분석이 됩니다.");
        if (code === "rate_limited") throw new AnalyzeError("rate_limited", "지금 요청이 많습니다. 잠시 후 다시 시도해 주세요.");
        if (code === "invalid_json") {
          feedback = "\n\n(직전 응답이 올바른 JSON 이 아니었다. 반드시 JSON 객체 하나만 출력한다.)";
          continue;
        }
        console.error("[rolefit] sample failed:", e);
        throw new AnalyzeError("server", "분석 중 오류가 났습니다. 다시 시도해 주세요.");
      }
      const parsed = schema.safeParse(data);
      if (parsed.success) return parsed.data;
      feedback = `\n\n(직전 응답이 스키마와 맞지 않았다. 아래를 고쳐서 다시 출력한다.)\n${issuesText(parsed.error)}`;
    }
    throw new AnalyzeError("parse", "AI 응답 형식이 맞지 않아 결과를 만들지 못했습니다. 다시 시도해 주세요.");
  };
}

export async function streamAnalysis(req: AnalyzeRequest, onEvent: (e: AnalyzeEvent) => void, signal: AbortSignal): Promise<void> {
  const input = {
    id: req.id,
    posting: { company: req.company, title: req.title, jdText: req.jdText },
    candidate: { resumeText: req.resumeText },
    parentId: req.parentId,
    demo: req.demo,
    signal,
  };
  if (req.demo) {
    const a = await runDemo(input, onEvent);
    onEvent({ type: "result", data: a });
    return;
  }
  if (req.jdText.trim().length < 200) throw new Error("공고 본문이 너무 짧습니다. 채용 공고 전체를 붙여넣어 주세요.");
  if (req.resumeText.trim().length < 150) throw new Error("이력이 너무 짧습니다. 사소한 경험까지 전부 적어 주세요.");
  const sample = await getSample();
  if (!sample) {
    throw new Error("이 화면에서는 Claude 호출 권한이 없어 내 공고를 분석할 수 없습니다. claude.ai 에서 이 페이지를 열고 권한을 허용하거나, 샘플로 흐름을 체험해 보세요.");
  }
  try {
    const a = await runStages(input, onEvent, makeCaller(sample, signal));
    onEvent({ type: "result", data: a });
  } catch (err) {
    if (err instanceof AnalyzeError) throw new Error(err.message);
    throw err;
  }
}
