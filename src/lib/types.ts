/**
 * RoleFit Canvas 데이터 모델
 *
 * 메모의 결과물 구조를 그대로 따른다.
 *  - 결과물 1  ManagerView   부서장이 뽑으려는 사람 (JD 분석)
 *  - 결과물 2-1 BasicResume  기본 이력서 (액면 충족률)
 *  - 결과물 2-2 StoryResume  스토리보완 이력서 (갈음 논증 + 근거)
 *  - 결과물 3  TargetResume 목표 이력서 (보강 로드맵)
 *  - 판정      Verdict      지원 · 보류 · 비추천
 */

export const PASS_LINE = 80;

export type Verdict = "apply" | "hold" | "not_recommended";

export type Priority = "required" | "preferred";

/** 충족 수준: 충족 / 부분 / 미충족 */
export type MatchLevel = "met" | "partial" | "unmet";

/** 근거 상태: 이력 속 실제 경험이 인용됨 / 관련은 있으나 약함 / 없음 */
export type EvidenceStatus = "grounded" | "weak" | "none";

/** 결과물 3의 네 가지 보강 구분 */
export type GapCategory = "hidden" | "weak" | "missing" | "hard";

export interface JobPosting {
  company: string;
  title: string;
  jdText: string;
}

export interface CandidateInput {
  resumeText: string;
}

/** JD 항목 하나 — 부서장이 이 항목으로 담보하려던 실제 능력까지 포함 */
export interface JdItem {
  id: string;
  /** JD 원문 항목 (짧게) */
  label: string;
  priority: Priority;
  /** 1–5. 부서장이 이 항목에 두는 무게 */
  weight: number;
  /** 이 항목이 담보하려는 실제 능력 */
  intent: string;
  /** 부서장이 이력서에서 실제로 확인하려는 것 */
  signal: string;
  /** 단기간에 대체하기 어려운 요건(자격·법적 요건 등)인가 */
  hardGate: boolean;
}

/** 결과물 1 · 부서장이 뽑으려는 사람 */
export interface ManagerView {
  /** 이 부서의 실제 일 */
  actualWork: string;
  /** 그 일을 해낼 사람의 상 — 한 줄 */
  personProfile: string;
  /** 사람의 상을 뒷받침하는 설명 */
  personTraits: string[];
  /** 부서장이 이력서를 읽으며 답을 찾는 질문 (2–4개) */
  managerQuestions: string[];
  items: JdItem[];
}

export interface ResumeEntry {
  period?: string;
  title: string;
  detail: string;
}

export interface ResumeSection {
  title: string;
  entries: ResumeEntry[];
}

/** JD 항목별 액면 대응 */
export interface FaceMatch {
  itemId: string;
  level: MatchLevel;
  /** 이력에서 액면으로 대응되는 부분 (없으면 null) */
  evidence: string | null;
  note: string;
}

/** 결과물 2-1 · 기본 이력서 */
export interface BasicResume {
  /** 내 이력 한 줄 요약 */
  summary: string;
  sections: ResumeSection[];
  matches: FaceMatch[];
  /** 액면 충족률 0–100 (표시용 정수) */
  faceScore: number;
  /** 반올림 전 값 — 판정은 이 값으로 내린다 */
  faceScoreExact: number;
}

export interface EvidenceQuote {
  /** 이력 원문에서 인용한 문장 (그대로) */
  quote: string;
  /** 어떤 경험인지 (프로젝트명·시기 등) */
  source: string;
}

/** JD 항목별 갈음 논증 */
export interface StoryArgument {
  itemId: string;
  /** 갈음 주장 — "경력 5년 → 게임 기술 특성 이해 + 핵심 기술 프로젝트" */
  claim: string;
  /** 부서장에게 하는 논증 (2–3문장) */
  argument: string;
  evidence: EvidenceQuote[];
  evidenceStatus: EvidenceStatus;
  /** 보완 후 충족 수준. 근거가 grounded일 때만 액면보다 올라갈 수 있다 */
  level: MatchLevel;
  /** 점수 반영 여부 (근거 없는 주장은 미반영) */
  counted: boolean;
  note: string;
}

/** 부서장의 질문에 답하는 형태로 재배열한 이력 */
export interface ManagerAnswer {
  question: string;
  answer: string;
  bullets: string[];
}

/** 결과물 2-2 · 스토리보완 이력서 */
export interface StoryResume {
  /** 부서장을 향한 한 줄 — "게임사 엔지니어와 기술 대화가 되는 AE 후보" */
  headline: string;
  /** 부서장이 읽고 싶은 순서로 재배열한 이력 */
  answers: ManagerAnswer[];
  arguments: StoryArgument[];
  /** 스토리보완 후 충족률 0–100 (표시용 정수) */
  storyScore: number;
  /** 반올림 전 값 — 판정은 이 값으로 내린다 */
  storyScoreExact: number;
  /** 제출용 스토리보완 이력서 전문 (markdown) */
  resumeMarkdown: string;
}

export interface Gap {
  id: string;
  itemId: string;
  category: GapCategory;
  title: string;
  /** 무엇을 하면 되는가 */
  action: string;
  /** 보강 시 올라가는 충족률 포인트 (표시용 반올림) */
  impact: number;
  /** 반올림 전 값 */
  impactExact: number;
  effort: "days" | "weeks" | "months";
  /** category === "hidden" 일 때 사실 확인 질문 */
  questions?: string[];
  /** category === "hard" 일 때 대안 경로 */
  alternativePath?: string;
}

/** 결과물 3 · 목표 이력서 */
export interface TargetResume {
  gaps: Gap[];
  /** 권장 경로(①②③)를 모두 채웠을 때 예상 충족률 (정수) — 점수 산식으로 정확히 재계산한 값 */
  projectedScore: number;
  projectedScoreExact: number;
  /** 최소 경로(①②)만 채웠을 때 예상 충족률 (정수) */
  projectedMinimal: number;
  projectedMinimalExact: number;
  /** 보강 예상 기간 */
  timeline: string;
  /** 보강 후 제출을 목표로 하는 이력서 (보강 예정 항목은 [보강 예정] 표시) */
  resumeMarkdown: string;
}

export type AnalysisMode = "demo" | "live";

export interface Analysis {
  id: string;
  createdAt: string;
  mode: AnalysisMode;
  posting: JobPosting;
  candidate: CandidateInput;
  managerView: ManagerView;
  basicResume: BasicResume;
  storyResume: StoryResume;
  targetResume: TargetResume;
  verdict: Verdict;
  /** 판정 근거 한 문단 */
  verdictReason: string;
  passLine: number;
  /** 목표 이력서 체크리스트 진행 상태 (gapId → 완료) */
  progress: Record<string, boolean>;
  /** 체크리스트 항목별 사용자가 적은 보강 메모 (gapId → 텍스트) */
  notes: Record<string, string>;
  /** 결과물 2-2 · 3 · 판정이 열려 있는가 (첫 공고 무료 / 베타 크레딧 / 결제) */
  unlocked: boolean;
  unlockedBy: "firstFree" | "beta" | "purchased" | "sample" | null;
  /** 같은 공고의 이전 분석 id (재분석 시) */
  parentId: string | null;
}

/** 분석 파이프라인 단계 */
export type StageId = "manager" | "basic" | "story" | "target";

export const STAGES: { id: StageId; title: string; caption: string }[] = [
  { id: "manager", title: "부서장의 눈으로 JD 읽기", caption: "항목 목록을 한 사람의 역할로 복원합니다" },
  { id: "basic", title: "기본 이력서 · 액면 충족률", caption: "내 이력을 그대로 놓고 항목별로 냉정하게 봅니다" },
  { id: "story", title: "스토리보완 · 갈음 논증", caption: "근거가 붙는 주장만 점수에 반영합니다" },
  { id: "target", title: "목표 이력서 · 판정", caption: "합격선 80%까지 무엇이 필요한지 정리합니다" },
];

/** 서버 → 클라이언트 스트리밍 이벤트 */
export type AnalyzeEvent =
  | { type: "stage"; stage: StageId; status: "start" | "done"; message?: string }
  | { type: "partial"; stage: "manager"; data: ManagerView }
  | { type: "partial"; stage: "basic"; data: BasicResume }
  | { type: "partial"; stage: "story"; data: StoryResume }
  | { type: "result"; data: Analysis }
  | { type: "error"; message: string; code?: "rate_limited" | "auth" | "connection" | "refusal" | "parse" | "aborted" | "server" };
