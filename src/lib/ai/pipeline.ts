import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import {
  assembleAnalysis,
  provisionalVerdict,
  toBasicResume,
  toManagerView,
  toStoryResume,
  toTargetResume,
  verdictFor,
} from "../assemble";
import { BasicStageSchema, ManagerStageSchema, ReasonStageSchema, StoryStageSchema, TargetStageSchema } from "../schemas";
import { GAP_CATEGORY_META } from "../scoring";
import type { Analysis, AnalyzeEvent, CandidateInput, JobPosting } from "../types";
import { basicPrompt, managerPrompt, reasonPrompt, storyPrompt, SYSTEM_PROMPT, targetPrompt } from "./prompts";
import { buildSampleAnalysis, SAMPLE_STAGES } from "../sample";

export const DEFAULT_MODEL = "claude-fable-5-1";

export function liveAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function modelName(): string {
  return process.env.ROLEFIT_MODEL || DEFAULT_MODEL;
}

export interface AnalyzeInput {
  id: string;
  posting: JobPosting;
  candidate: CandidateInput;
  parentId?: string | null;
  /** 강제 데모 (샘플) */
  demo?: boolean;
  /** 클라이언트가 끊으면 진행 중인 모델 호출도 중단한다 */
  signal?: AbortSignal;
}

type Emit = (e: AnalyzeEvent) => Promise<void> | void;

export type AnalyzeErrorCode = NonNullable<Extract<AnalyzeEvent, { type: "error" }>["code"]>;

/** 사용자에게 보여줄 수 있는 오류 — 원인 코드와 고정 문구만 담는다 (SDK 원문은 서버 로그에만) */
export class AnalyzeError extends Error {
  constructor(
    public code: AnalyzeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AnalyzeError";
  }
}

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 데모: 내장 샘플을 같은 조립 경로로 재생한다 (진행 화면 검증용 지연 포함) */
export async function runDemo(input: AnalyzeInput, emit: Emit, delayMs = 1400): Promise<Analysis> {
  const s = SAMPLE_STAGES;
  await emit({ type: "stage", stage: "manager", status: "start" });
  await sleep(delayMs);
  const view = toManagerView(s.manager);
  await emit({ type: "partial", stage: "manager", data: view });
  await emit({ type: "stage", stage: "manager", status: "done" });

  await emit({ type: "stage", stage: "basic", status: "start" });
  await sleep(delayMs);
  const basic = toBasicResume(s.basic, view);
  await emit({ type: "partial", stage: "basic", data: basic });
  await emit({ type: "stage", stage: "basic", status: "done" });

  await emit({ type: "stage", stage: "story", status: "start" });
  await sleep(delayMs);
  const story = toStoryResume(s.story, view, basic, s.candidate.resumeText);
  await emit({ type: "partial", stage: "story", data: story });
  await emit({ type: "stage", stage: "story", status: "done" });

  await emit({ type: "stage", stage: "target", status: "start" });
  await sleep(delayMs);
  const analysis = buildSampleAnalysis({ id: input.id, createdAt: new Date().toISOString(), mode: "demo" });
  await emit({ type: "stage", stage: "target", status: "done" });
  return { ...analysis, parentId: input.parentId ?? null };
}

/** 실제 분석: Claude 4단계 순차 호출 (+ 판정 근거 1회). client 는 테스트에서 주입할 수 있다 */
export async function runLive(input: AnalyzeInput, emit: Emit, client: Anthropic = makeClient()): Promise<Analysis> {
  const { posting, candidate, signal } = input;

  await emit({ type: "stage", stage: "manager", status: "start" });
  const managerStage = await callStage(
    client,
    ManagerStageSchema,
    managerPrompt(posting.jdText, posting.company, posting.title),
    8000,
    signal,
  );
  if (managerStage.items.length === 0) throw new AnalyzeError("parse", "공고에서 항목을 찾지 못했습니다. 자격 요건·주요 업무가 포함된 공고 전문을 넣어 주세요.");
  const view = toManagerView(managerStage);
  const resolvedPosting: JobPosting = {
    company: posting.company || managerStage.company || "",
    title: posting.title || managerStage.title || "",
    jdText: posting.jdText,
  };
  await emit({ type: "partial", stage: "manager", data: view });
  await emit({ type: "stage", stage: "manager", status: "done" });

  await emit({ type: "stage", stage: "basic", status: "start" });
  const basicStage = await callStage(client, BasicStageSchema, basicPrompt(view, candidate.resumeText), 12000, signal);
  const basic = toBasicResume(basicStage, view);
  await emit({ type: "partial", stage: "basic", data: basic });
  await emit({ type: "stage", stage: "basic", status: "done" });

  await emit({ type: "stage", stage: "story", status: "start" });
  const storyStage = await callStage(
    client,
    StoryStageSchema,
    storyPrompt(view, basic, candidate.resumeText),
    16000,
    signal,
  );
  const story = toStoryResume(storyStage, view, basic, candidate.resumeText);
  await emit({ type: "partial", stage: "story", data: story });
  await emit({ type: "stage", stage: "story", status: "done" });

  await emit({ type: "stage", stage: "target", status: "start" });
  const provisional = provisionalVerdict(view, basic, story);
  const targetStage = await callStage(
    client,
    TargetStageSchema,
    targetPrompt(view, basic, story, provisional, candidate.resumeText),
    16000,
    signal,
  );
  const target = toTargetResume(targetStage, view, basic, story);
  const verdict = verdictFor(view, basic, story, target);
  const gapLines = target.gaps.map(
    (g) => `${GAP_CATEGORY_META[g.category].num} ${g.title} (+${g.impact}%p 예상${g.category === "hard" ? ", 단기 대체 불가" : ""})`,
  );
  const reasonStage = await callStage(
    client,
    ReasonStageSchema,
    reasonPrompt(resolvedPosting, view, basic, story, verdict, target.projectedScore, gapLines),
    4000,
    signal,
    "medium",
  );
  await emit({ type: "stage", stage: "target", status: "done" });

  return assembleAnalysis({
    id: input.id,
    createdAt: new Date().toISOString(),
    mode: "live",
    posting: resolvedPosting,
    candidate,
    managerView: view,
    basicResume: basic,
    storyResume: story,
    targetResume: target,
    verdictReason: reasonStage.verdictReason,
    parentId: input.parentId ?? null,
  });
}

export async function runAnalysis(input: AnalyzeInput, emit: Emit): Promise<Analysis> {
  if (input.demo || !liveAvailable()) return runDemo(input, emit);
  return runLive(input, emit);
}
