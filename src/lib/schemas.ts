import { z } from "zod";

/**
 * Claude 구조화 출력용 zod 스키마.
 * 구조화 출력 제약: 모든 필드는 required, optional 대신 nullable 사용.
 */

export const PrioritySchema = z.enum(["required", "preferred"]);
export const MatchLevelSchema = z.enum(["met", "partial", "unmet"]);
export const EvidenceStatusSchema = z.enum(["grounded", "weak", "none"]);
export const GapCategorySchema = z.enum(["hidden", "weak", "missing", "hard"]);

/** 1단계 — 부서장이 뽑으려는 사람 */
export const ManagerStageSchema = z.object({
  company: z.string().describe("공고의 회사명. 원문에 없으면 빈 문자열"),
  title: z.string().describe("공고의 직무명. 원문에 없으면 빈 문자열"),
  actualWork: z.string().describe("이 부서의 실제 일 — 2~3문장"),
  personProfile: z.string().describe("그 일을 해낼 사람의 상 — 한 줄 (예: 게임사 엔지니어와 막힘없이 기술협력을 해내는 AE)"),
  personTraits: z.array(z.string()).describe("사람의 상을 뒷받침하는 특성 3~5개"),
  managerQuestions: z
    .array(z.string())
    .describe("부서장이 이력서를 읽으며 답을 찾는 질문 2~4개 (예: 게임사 엔지니어와 기술 대화가 되는가?)"),
  items: z
    .array(
      z.object({
        label: z.string().describe("JD 원문 항목을 짧게 (20자 내외)"),
        priority: PrioritySchema,
        weight: z.number().describe("1~5 정수. 부서장이 이 항목에 두는 무게"),
        intent: z.string().describe("이 항목이 담보하려는 실제 능력 — 한 문장"),
        signal: z.string().describe("부서장이 이력서에서 실제로 확인하려는 것 — 한 문장"),
        hardGate: z.boolean().describe("자격증·법적 요건·비자 등 단기간에 대체 불가한 요건이면 true"),
      }),
    )
    .describe("JD 항목 6~12개. 자격요건과 우대사항을 모두 포함"),
});

/** 2단계 — 기본 이력서 (액면 대응) */
export const BasicStageSchema = z.object({
  summary: z.string().describe("내 이력 한 줄 요약 (있는 그대로, 과장 없이)"),
  sections: z.array(
    z.object({
      title: z.string().describe("섹션명 (학력 / 경력 / 프로젝트 / 활동 / 자격·어학 등)"),
      entries: z.array(
        z.object({
          period: z.string().nullable().describe("시기. 없으면 null"),
          title: z.string(),
          detail: z.string().describe("한두 문장. 이력 원문의 사실만"),
        }),
      ),
    }),
  ),
  matches: z.array(
    z.object({
      itemId: z.string().describe("1단계에서 부여된 항목 id (j1, j2, ...)"),
      level: MatchLevelSchema.describe("액면 기준. 항목을 문자 그대로 충족하면 met, 일부만이면 partial, 아니면 unmet"),
      evidence: z.string().nullable().describe("액면으로 대응되는 이력 원문 구절. 없으면 null"),
      note: z.string().describe("왜 이 수준인지 한 문장 (냉정하게)"),
    }),
  ),
});

/** 3단계 — 스토리보완 이력서 (갈음 논증) */
export const StoryStageSchema = z.object({
  headline: z.string().describe("부서장을 향한 한 줄 — '~할 수 있는 사람' 형식"),
  answers: z.array(
    z.object({
      question: z.string().describe("부서장의 질문 (1단계 managerQuestions 중 하나)"),
      answer: z.string().describe("그 질문에 대한 답 — 한두 문장"),
      bullets: z.array(z.string()).describe("답을 뒷받침하는 이력 항목 2~4개 (성과·숫자 포함, 이력 원문 사실만)"),
    }),
  ),
  arguments: z.array(
    z.object({
      itemId: z.string(),
      claim: z.string().describe("갈음 주장. 형식: '항목 → 갈음하는 능력' (예: 경력 5년 → 게임 기술 특성 이해 + 핵심 기술 프로젝트)"),
      argument: z.string().describe("부서장에게 하는 논증 2~3문장. 항목이 담보하려던 능력을 다른 경험으로 갈음할 수 있음을 보인다"),
      evidence: z.array(
        z.object({
          quote: z.string().describe("이력 원문에서 그대로 인용한 구절 (바꿔 쓰지 말 것)"),
          source: z.string().describe("어떤 경험인지 (프로젝트명·시기)"),
        }),
      ),
      evidenceStatus: EvidenceStatusSchema.describe("grounded: 원문 인용 근거가 주장을 실제로 뒷받침 / weak: 관련은 있으나 약함 / none: 근거 없음"),
      level: MatchLevelSchema.describe("보완 후 충족 수준. grounded 일 때만 액면보다 올릴 수 있다"),
      note: z.string().describe("근거가 약하거나 없으면 '근거 부족 — 점수 미반영'처럼 솔직하게"),
    }),
  ),
  resumeMarkdown: z
    .string()
    .describe("제출용 스토리보완 이력서 전문 (markdown). 부서장이 읽고 싶은 순서: 헤드라인 → 부서장의 질문별 근거 → 경력/프로젝트 → 학력·자격. 이력 원문에 없는 사실은 쓰지 않는다"),
});

/** 4단계 — 목표 이력서 + 판정 근거 */
export const TargetStageSchema = z.object({
  gaps: z.array(
    z.object({
      itemId: z.string(),
      category: GapCategorySchema.describe("hidden: 있는데 안 드러난 경험 / weak: 관련 있지만 근거 약함 / missing: 실제로 부족 / hard: 단기 대체 불가"),
      title: z.string().describe("보강 항목 제목 (15자 내외)"),
      action: z.string().describe("구체적으로 무엇을 하면 되는가 — 1~2문장, 실행 가능하게"),
      effort: z.enum(["days", "weeks", "months"]),
      questions: z.array(z.string()).nullable().describe("category가 hidden일 때 사실 확인 질문 2~3개. 아니면 null"),
      alternativePath: z.string().nullable().describe("category가 hard일 때 대안 경로. 아니면 null"),
    }),
  ),
  timeline: z.string().describe("보강 예상 기간 (예: 4~6주)"),
  resumeMarkdown: z
    .string()
    .describe("보강 후 제출을 목표로 하는 이력서 전문 (markdown). 아직 없는 항목은 '[보강 예정]'으로 표시"),
});

/** 5단계 — 판정 근거 (짧은 호출) */
export const ReasonStageSchema = z.object({
  verdictReason: z.string().describe("판정 근거 한 문단 (3~4문장). 숫자와 근거를 들어 냉정하게, 마지막 문장은 다음 행동"),
});

export type ManagerStage = z.infer<typeof ManagerStageSchema>;
export type BasicStage = z.infer<typeof BasicStageSchema>;
export type StoryStage = z.infer<typeof StoryStageSchema>;
export type TargetStage = z.infer<typeof TargetStageSchema>;
