import type { BasicStage, ManagerStage, StoryStage, TargetStage } from "./schemas";
import {
  LEVEL_VALUE,
  decideVerdict,
  effectiveWeight,
  faceScore as calcFaceScore,
  normalizeArgument,
  storyLevelMap,
  storyScore as calcStoryScore,
} from "./scoring";
import {
  PASS_LINE,
  type Analysis,
  type AnalysisMode,
  type BasicResume,
  type CandidateInput,
  type FaceMatch,
  type Gap,
  type GapCategory,
  type JobPosting,
  type ManagerView,
  type MatchLevel,
  type StoryArgument,
  type StoryResume,
  type TargetResume,
  type Verdict,
} from "./types";

/** 1단계 결과에 항목 id(j1, j2, ...)를 부여한다 */
export function toManagerView(stage: ManagerStage): ManagerView {
  return {
    actualWork: stage.actualWork,
    personProfile: stage.personProfile,
    personTraits: stage.personTraits,
    managerQuestions: stage.managerQuestions,
    items: stage.items.map((it, i) => ({
      id: `j${i + 1}`,
      label: it.label,
      priority: it.priority,
      weight: Math.min(5, Math.max(1, Math.round(it.weight || 3))),
      intent: it.intent,
      signal: it.signal,
      hardGate: it.hardGate,
    })),
  };
}

/** 문자·숫자만 남긴 비교용 문자열 */
export function normalizeText(s: string): string {
  return s.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
}

/**
 * 인용문이 이력 원문에 실제로 있는지 확인한다.
 * 정규화 후 포함되면 통과. 긴 인용은 12자 조각의 60% 이상이 있으면 통과.
 */
export function quoteFound(quote: string, resumeText: string): boolean {
  const q = normalizeText(quote);
  const r = normalizeText(resumeText);
  if (q.length === 0) return false;
  if (r.includes(q)) return true;
  if (q.length < 12) return false;
  const chunks: string[] = [];
  for (let i = 0; i + 12 <= q.length; i += 12) chunks.push(q.slice(i, i + 12));
  if (chunks.length === 0) return false;
  const found = chunks.filter((c) => r.includes(c)).length;
  return found / chunks.length >= 0.6;
}

export function toBasicResume(stage: BasicStage, view: ManagerView): BasicResume {
  const known = new Set(view.items.map((i) => i.id));
  const byId = new Map<string, FaceMatch>();
  for (const m of stage.matches) {
    if (!known.has(m.itemId)) continue;
    byId.set(m.itemId, { itemId: m.itemId, level: m.level, evidence: m.evidence, note: m.note });
  }
  const matches: FaceMatch[] = view.items.map(
    (it) =>
      byId.get(it.id) ?? {
        itemId: it.id,
        level: "unmet",
        evidence: null,
        note: "이력에서 액면으로 대응되는 내용을 찾지 못했습니다.",
      },
  );
  return {
    summary: stage.summary,
    sections: stage.sections.map((s) => ({
      title: s.title,
      entries: s.entries.map((e) => ({ period: e.period ?? undefined, title: e.title, detail: e.detail })),
    })),
    matches,
    faceScore: calcFaceScore(view.items, matches),
  };
}

/**
 * 3단계 결과에 냉정함의 규칙을 적용한다.
 *  - 인용문이 이력 원문에 없으면 근거로 인정하지 않는다
 *  - grounded 근거가 없는 주장은 액면 수준으로 되돌리고 점수 미반영
 */
export function toStoryResume(
  stage: StoryStage,
  view: ManagerView,
  basic: BasicResume,
  resumeText: string,
): StoryResume {
  const face = new Map(basic.matches.map((m) => [m.itemId, m.level]));
  const known = new Set(view.items.map((i) => i.id));
  const args: StoryArgument[] = [];
  for (const a of stage.arguments) {
    if (!known.has(a.itemId)) continue;
    const verified = a.evidence.filter((e) => quoteFound(e.quote, resumeText));
    const dropped = a.evidence.length - verified.length;
    let status = a.evidenceStatus;
    let note = a.note;
    if (status === "grounded" && verified.length === 0) {
      status = a.evidence.length > 0 ? "weak" : "none";
      note = `${note ? note + " " : ""}(인용한 근거를 이력 원문에서 확인할 수 없어 점수에 반영하지 않았습니다)`;
    } else if (dropped > 0) {
      note = `${note ? note + " " : ""}(원문에서 확인되지 않은 인용 ${dropped}건 제외)`;
    }
    const raw: StoryArgument = {
      itemId: a.itemId,
      claim: a.claim,
      argument: a.argument,
      evidence: verified.map((e) => ({ quote: e.quote, source: e.source })),
      evidenceStatus: status,
      level: a.level,
      counted: false,
      note,
    };
    const faceLevel = face.get(a.itemId) ?? "unmet";
    const item = view.items.find((it) => it.id === a.itemId);
    // 단기 대체 불가 요건(자격·학위 등)은 갈음으로 올릴 수 없다 — 액면 유지
    if (item?.hardGate && LEVEL_VALUE[raw.level] > LEVEL_VALUE[faceLevel]) {
      args.push({
        ...raw,
        level: faceLevel,
        counted: false,
        note: `${raw.note ? raw.note + " " : ""}(단기 대체 불가 요건은 갈음하지 않습니다 — 액면 유지)`,
      });
      continue;
    }
    args.push(normalizeArgument(raw, faceLevel));
  }
  return {
    headline: stage.headline,
    answers: stage.answers,
    arguments: args,
    storyScore: calcStoryScore(view.items, basic.matches, args),
    resumeMarkdown: stage.resumeMarkdown,
  };
}

const CATEGORY_ORDER: GapCategory[] = ["hidden", "weak", "missing", "hard"];

export function toTargetResume(
  stage: TargetStage,
  view: ManagerView,
  basic: BasicResume,
  story: StoryResume,
): TargetResume {
  const levels = storyLevelMap(basic.matches, story.arguments);
  const total = view.items.reduce((s, it) => s + effectiveWeight(it), 0);
  const itemById = new Map(view.items.map((it) => [it.id, it]));

  // 항목별 gap 수 (impact 를 나누기 위해)
  const perItem = new Map<string, number>();
  for (const g of stage.gaps) perItem.set(g.itemId, (perItem.get(g.itemId) ?? 0) + 1);

  const gaps: Gap[] = [];
  stage.gaps.forEach((g, i) => {
    const item = itemById.get(g.itemId);
    if (!item) return;
    const level: MatchLevel = levels.get(g.itemId) ?? "unmet";
    if (level === "met") return; // 이미 충족한 항목의 보강은 의미가 없다
    const maxGain = (effectiveWeight(item) / total) * (1 - LEVEL_VALUE[level]) * 100;
    const share = maxGain / (perItem.get(g.itemId) ?? 1);
    const impact = share > 0 ? Math.max(1, Math.round(share)) : 0;
    gaps.push({
      id: `g${i + 1}`,
      itemId: g.itemId,
      category: g.category,
      title: g.title,
      action: g.action,
      impact,
      effort: g.effort,
      questions: g.category === "hidden" ? (g.questions ?? undefined) : undefined,
      alternativePath: g.category === "hard" ? (g.alternativePath ?? undefined) : undefined,
    });
  });
  gaps.sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

  const doable = gaps.filter((g) => g.category !== "hard").reduce((s, g) => s + g.impact, 0);
  return {
    gaps,
    projectedScore: Math.min(100, story.storyScore + doable),
    timeline: stage.timeline,
    resumeMarkdown: stage.resumeMarkdown,
  };
}

/** 잠정 판정 (목표 이력서 전): 80 이상이면 지원, 아니면 보류/비추천은 로드맵 도달 가능성으로 결정 */
export function provisionalVerdict(view: ManagerView, basic: BasicResume, story: StoryResume): Verdict | "pending" {
  const levels = storyLevelMap(basic.matches, story.arguments);
  const hardUnmet = view.items.some(
    (it) => it.hardGate && it.priority === "required" && (levels.get(it.id) ?? "unmet") === "unmet",
  );
  if (hardUnmet) return "not_recommended";
  if (story.storyScore >= PASS_LINE) return "apply";
  return "pending";
}

export function verdictFor(view: ManagerView, basic: BasicResume, story: StoryResume, target: TargetResume): Verdict {
  const levels = storyLevelMap(basic.matches, story.arguments);
  return decideVerdict(story.storyScore, target.projectedScore, view.items, (it) => levels.get(it.id) ?? "unmet");
}

export interface AssembleInput {
  id: string;
  createdAt: string;
  mode: AnalysisMode;
  posting: JobPosting;
  candidate: CandidateInput;
  managerView: ManagerView;
  basicResume: BasicResume;
  storyResume: StoryResume;
  targetResume: TargetResume;
  verdictReason: string;
  parentId?: string | null;
}

export function assembleAnalysis(input: AssembleInput): Analysis {
  const verdict = verdictFor(input.managerView, input.basicResume, input.storyResume, input.targetResume);
  return {
    id: input.id,
    createdAt: input.createdAt,
    mode: input.mode,
    posting: input.posting,
    candidate: input.candidate,
    managerView: input.managerView,
    basicResume: input.basicResume,
    storyResume: input.storyResume,
    targetResume: input.targetResume,
    verdict,
    verdictReason: input.verdictReason,
    passLine: PASS_LINE,
    progress: {},
    notes: {},
    unlocked: false,
    unlockedBy: null,
    parentId: input.parentId ?? null,
  };
}
