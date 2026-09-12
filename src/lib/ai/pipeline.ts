import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import type { Analysis } from "../types";
import { SYSTEM_PROMPT } from "./prompts";
import { AnalyzeError, runDemo, runStages, type AnalyzeInput, type Emit } from "./stages";

export { AnalyzeError, runDemo, type AnalyzeInput, type Emit } from "./stages";

export const DEFAULT_MODEL = "claude-fable-5-1";

export function liveAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function modelName(): string {
  return process.env.ROLEFIT_MODEL || DEFAULT_MODEL;
}

/** SDK 오류를 사용자용 코드·문구로 바꾼다 (원문은 서버 로그에만) */
export function toAnalyzeError(err: unknown): AnalyzeError {
  if (err instanceof AnalyzeError) return err;
  if (err instanceof Anthropic.RateLimitError) return new AnalyzeError("rate_limited", "지금 분석 요청이 많습니다. 잠시 후 다시 시도해 주세요.");
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError)
    return new AnalyzeError("auth", "서버의 AI 인증 설정에 문제가 있습니다. 운영자에게 알려 주세요.");
  if (err instanceof Anthropic.APIConnectionError) return new AnalyzeError("connection", "AI 서버와 연결이 끊겼습니다. 다시 시도해 주세요.");
  if (err instanceof Anthropic.APIUserAbortError || (err instanceof Error && err.name === "AbortError"))
    return new AnalyzeError("aborted", "분석을 취소했습니다.");
  if (err instanceof Anthropic.AnthropicError && /parse|Validation|JSON/i.test(err.message))
    return new AnalyzeError("parse", "AI 응답 형식이 맞지 않아 결과를 만들지 못했습니다. 다시 시도해 주세요.");
  return new AnalyzeError("server", "분석 중 오류가 났습니다. 다시 시도해 주세요.");
}

function makeClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 180_000, maxRetries: 1 });
}

/**
 * 한 단계 호출. 스트리밍으로 받아 긴 출력에도 안전하고, 구조화 출력은 finalMessage 에서 파싱된다.
 * max_tokens 에 잘리면 한도를 키워 한 번 더, 형식 오류면 같은 조건으로 한 번 더 시도한다.
 */
async function callStage<S extends z.ZodType>(
  client: Anthropic,
  schema: S,
  user: string,
  maxTokens: number,
  signal?: AbortSignal,
  effort?: "low" | "medium" | "high",
): Promise<z.infer<S>> {
  let cap = maxTokens;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal?.aborted) throw new AnalyzeError("aborted", "분석을 취소했습니다.");
    try {
      const stream = client.messages.stream(
        {
          model: modelName(),
          max_tokens: cap,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: user }],
          output_config: { format: zodOutputFormat(schema), ...(effort ? { effort } : {}) },
        },
        { signal },
      );
      const msg = await stream.finalMessage();
      if (msg.parsed_output) return msg.parsed_output as z.infer<S>;
      if (msg.stop_reason === "refusal") throw new AnalyzeError("refusal", "AI 가 이 입력의 분석을 거부했습니다. 공고와 이력 내용을 확인해 주세요.");
      if (msg.stop_reason === "max_tokens") {
        cap = Math.round(cap * 1.5);
        lastErr = new AnalyzeError("parse", "AI 응답이 길이 제한에 잘렸습니다. 다시 시도해 주세요.");
        continue;
      }
      throw new AnalyzeError("parse", `AI 응답을 해석하지 못했습니다 (${msg.stop_reason ?? "unknown"}).`);
    } catch (err) {
      if (err instanceof AnalyzeError && err.code !== "parse") throw err;
      const mapped = toAnalyzeError(err);
      if (mapped.code === "aborted" || mapped.code === "auth" || mapped.code === "rate_limited") throw mapped;
      console.error("[rolefit] stage attempt failed:", err instanceof Error ? err.message : err);
      lastErr = mapped;
    }
  }
  throw lastErr instanceof Error ? lastErr : new AnalyzeError("server", "분석 중 오류가 났습니다.");
}

/** 실제 분석 (서버, Anthropic SDK). client 는 테스트에서 주입할 수 있다 */
export async function runLive(input: AnalyzeInput, emit: Emit, client: Anthropic = makeClient()): Promise<Analysis> {
  return runStages(input, emit, ({ schema, prompt, maxTokens, effort }) =>
    callStage(client, schema, prompt, maxTokens, input.signal, effort),
  );
}

export async function runAnalysis(input: AnalyzeInput, emit: Emit): Promise<Analysis> {
  if (input.demo || !liveAvailable()) return runDemo(input, emit);
  return runLive(input, emit);
}
