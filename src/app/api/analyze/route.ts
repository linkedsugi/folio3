import { z } from "zod";
import { liveAvailable, modelName, runAnalysis } from "@/lib/ai/pipeline";
import type { AnalyzeEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX = 30000;

const BodySchema = z.object({
  id: z.string().min(1).max(64),
  company: z.string().max(200).default(""),
  title: z.string().max(200).default(""),
  jdText: z.string().max(MAX),
  resumeText: z.string().max(MAX),
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
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: AnalyzeEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      };
      try {
        const analysis = await runAnalysis(
          {
            id: body.id,
            posting: { company: body.company, title: body.title, jdText: body.jdText },
            candidate: { resumeText: body.resumeText },
            parentId: body.parentId,
            demo,
          },
          emit,
        );
        emit({ type: "result", data: analysis });
      } catch (err) {
        const message = err instanceof Error ? err.message : "알 수 없는 오류";
        emit({ type: "error", message: `분석이 중단됐습니다. ${message}` });
      } finally {
        controller.close();
      }
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
