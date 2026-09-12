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
}

type Emit = (e: AnalyzeEvent) => Promise<void> | void;

async function callStage<S extends z.ZodType>(
  client: Anthropic,
  schema: S,
  user: string,
  maxTokens: number,
): Promise<z.infer<S>> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const msg = await client.messages.parse({
        model: modelName(),
        max_tokens: maxTokens,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: user }],
        output_config: { format: zodOutputFormat(schema) },
      });
      if (msg.parsed_output) return msg.parsed_output as z.infer<S>;
      throw new Error(`구조화 출력 파싱 실패 (stop_reason=${msg.stop_reason})`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
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
  return analysis;
}

/** 실제 분석: Claude 4단계 순차 호출 (+ 판정 근거 1회). client 는 테스트에서 주입할 수 있다 */
export async function runLive(
  input: AnalyzeInput,
  emit: Emit,
  client: Anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
): Promise<Analysis> {
  const { posting, candidate } = input;

  await emit({ type: "stage", stage: "manager", status: "start" });
  const managerStage = await callStage(
    client,
    ManagerStageSchema,
    managerPrompt(posting.jdText, posting.company, posting.title),
    6000,
  );
  const view = toManagerView(managerStage);
  const resolvedPosting: JobPosting = {
    company: posting.company || managerStage.company || "",
    title: posting.title || managerStage.title || "",
    jdText: posting.jdText,
  };
  await emit({ type: "partial", stage: "manager", data: view });
  await emit({ type: "stage", stage: "manager", status: "done" });

  await emit({ type: "stage", stage: "basic", status: "start" });
  const basicStage = await callStage(client, BasicStageSchema, basicPrompt(view, candidate.resumeText), 8000);
  const basic = toBasicResume(basicStage, view);
  await emit({ type: "partial", stage: "basic", data: basic });
  await emit({ type: "stage", stage: "basic", status: "done" });

  await emit({ type: "stage", stage: "story", status: "start" });
  const storyStage = await callStage(
    client,
    StoryStageSchema,
    storyPrompt(view, basic, candidate.resumeText),
    12000,
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
    12000,
  );
  const target = toTargetResume(targetStage, view, basic, story);
  const verdict = verdictFor(view, basic, story, target);
  const gapLines = target.gaps.map(
    (g) => `${GAP_CATEGORY_META[g.category].num} ${g.title} (+${g.impact}%p 예상${g.category === "hard" ? ", 단기 대체 불가" : ""})`,
  );
  const reasonStage = await callStage(
    client,
    ReasonStageSchema,
    reasonPrompt(view, basic, story, verdict, target.projectedScore, gapLines),
    1500,
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
