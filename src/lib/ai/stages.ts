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
import { basicPrompt, managerPrompt, reasonPrompt, storyPrompt, targetPrompt } from "./prompts";
import { buildSampleAnalysis, SAMPLE_STAGES } from "../sample";

/**
 * 4단계(+판정 근거) 파이프라인의 순서와 조립 규칙.
 * 모델 호출 방식(서버 SDK / 브라우저 sample 능력)은 StageCaller 로 주입한다.
 */

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

export type Emit = (e: AnalyzeEvent) => Promise<void> | void;

export type AnalyzeErrorCode = NonNullable<Extract<AnalyzeEvent, { type: "error" }>["code"]>;

/** 사용자에게 보여줄 수 있는 오류 — 원인 코드와 고정 문구만 담는다 */
export class AnalyzeError extends Error {
  constructor(
    public code: AnalyzeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AnalyzeError";
  }
}

export type StageId5 = "manager" | "basic" | "story" | "target" | "reason";

/** 한 단계를 호출해 스키마에 맞는 객체를 돌려준다 */
export type StageCaller = <S extends z.ZodType>(args: {
  stage: StageId5;
  schema: S;
  prompt: string;
  maxTokens: number;
  effort?: "low" | "medium" | "high";
}) => Promise<z.infer<S>>;

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

/** 실제 분석: 4단계 순차 호출 + 판정 근거 1회 */
export async function runStages(input: AnalyzeInput, emit: Emit, call: StageCaller): Promise<Analysis> {
  const { posting, candidate } = input;

  await emit({ type: "stage", stage: "manager", status: "start" });
  const managerStage = await call({
    stage: "manager",
    schema: ManagerStageSchema,
    prompt: managerPrompt(posting.jdText, posting.company, posting.title),
    maxTokens: 8000,
  });
  if (managerStage.items.length === 0) {
    throw new AnalyzeError("parse", "공고에서 항목을 찾지 못했습니다. 자격 요건·주요 업무가 포함된 공고 전문을 넣어 주세요.");
  }
  const view = toManagerView(managerStage);
  const resolvedPosting: JobPosting = {
    company: posting.company || managerStage.company || "",
    title: posting.title || managerStage.title || "",
    jdText: posting.jdText,
  };
  await emit({ type: "partial", stage: "manager", data: view });
  await emit({ type: "stage", stage: "manager", status: "done" });

  await emit({ type: "stage", stage: "basic", status: "start" });
  const basicStage = await call({ stage: "basic", schema: BasicStageSchema, prompt: basicPrompt(view, candidate.resumeText), maxTokens: 12000 });
  const basic = toBasicResume(basicStage, view);
  await emit({ type: "partial", stage: "basic", data: basic });
  await emit({ type: "stage", stage: "basic", status: "done" });

  await emit({ type: "stage", stage: "story", status: "start" });
  const storyStage = await call({ stage: "story", schema: StoryStageSchema, prompt: storyPrompt(view, basic, candidate.resumeText), maxTokens: 16000 });
  const story = toStoryResume(storyStage, view, basic, candidate.resumeText);
  await emit({ type: "partial", stage: "story", data: story });
  await emit({ type: "stage", stage: "story", status: "done" });

  await emit({ type: "stage", stage: "target", status: "start" });
  const provisional = provisionalVerdict(view, basic, story);
  const targetStage = await call({
    stage: "target",
    schema: TargetStageSchema,
    prompt: targetPrompt(view, basic, story, provisional, candidate.resumeText),
    maxTokens: 16000,
  });
  const target = toTargetResume(targetStage, view, basic, story);
  const verdict = verdictFor(view, basic, story, target);
  const gapLines = target.gaps.map(
    (g) => `${GAP_CATEGORY_META[g.category].num} ${g.title} (+${g.impact}%p 예상${g.category === "hard" ? ", 단기 대체 불가" : ""})`,
  );
  const reasonStage = await call({
    stage: "reason",
    schema: ReasonStageSchema,
    prompt: reasonPrompt(resolvedPosting, view, basic, story, verdict, target.projectedScore, gapLines),
    maxTokens: 4000,
    effort: "medium",
  });
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
