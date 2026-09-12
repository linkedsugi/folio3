import { z } from "zod";
import { liveAvailable, modelName, runAnalysis, toAnalyzeError } from "@/lib/ai/pipeline";
import type { AnalyzeEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_JD = 15000;
const MAX_RESUME = 20000;

/** 인스턴스 메모리 기반의 단순 속도 제한 — 실제 분석(비용 발생)에만 적용 */
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT_PER_WINDOW = 8;
const hits = new Map<string, number[]>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= LIMIT_PER_WINDOW) {
    hits.set(key, arr);
    return true;
  }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}

const BodySchema = z.object({
  id: z.string().min(1).max(64),
  company: z.string().max(200).default(""),
  title: z.string().max(200).default(""),
  jdText: z.string().max(MAX_JD),
  resumeText: z.string().max(MAX_RESUME),
  demo: z.boolean().default(false),
  parentId: z.string().max(64).nullable().default(null),
});

/** 서버 상태: 실제 분석 가능 여부 */
export async function GET() {
  return Response.json({ live: liveAvailable(), model: liveAvailable() ? modelName() : null });
}

export async function POST(req: Request) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const demo = body.demo;
  if (!demo) {
    if (!liveAvailable()) {
      return Response.json(
        {
          error:
            "AI 분석이 아직 준비되지 않았습니다 (서버에 ANTHROPIC_API_KEY 가 설정되지 않음). 샘플 분석으로 흐름을 먼저 체험해 보세요.",
          code: "no_api_key",
        },
        { status: 503 },
      );
    }
    if (body.jdText.trim().length < 200) {
      return Response.json({ error: "공고 본문이 너무 짧습니다. 채용 공고 전체를 붙여넣어 주세요." }, { status: 400 });
    }
    if (body.resumeText.trim().length < 150) {
      return Response.json({ error: "이력이 너무 짧습니다. 사소한 경험까지 전부 적어 주세요." }, { status: 400 });
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
    if (rateLimited(ip)) {
      return Response.json(
        { error: "잠시 후 다시 시도해 주세요. 한 시간에 분석할 수 있는 횟수를 넘었습니다.", code: "rate_limited" },
        { status: 429 },
      );
    }
  }

  const encoder = new TextEncoder();
  const abort = new AbortController();
  req.signal.addEventListener("abort", () => abort.abort(), { once: true });
  let closed = false;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: AnalyzeEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        } catch {
          closed = true;
        }
      };
      try {
        const analysis = await runAnalysis(
          {
            id: body.id,
            posting: { company: body.company, title: body.title, jdText: body.jdText },
            candidate: { resumeText: body.resumeText },
            parentId: body.parentId,
            demo,
            signal: abort.signal,
          },
          emit,
        );
        emit({ type: "result", data: analysis });
      } catch (err) {
        const mapped = toAnalyzeError(err);
        if (mapped.code !== "aborted") console.error("[rolefit] analyze failed:", err instanceof Error ? err.message : err);
        emit({ type: "error", code: mapped.code, message: `분석이 중단됐습니다. ${mapped.message}` });
      } finally {
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        }
      }
    },
    cancel() {
      closed = true;
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
