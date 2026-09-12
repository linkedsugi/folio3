import type { BasicStage, ManagerStage, StoryStage, TargetStage } from "./schemas";
import {
  LEVEL_VALUE,
  decideVerdict,
  effectiveWeight,
  faceScoreExact,
  normalizeArgument,
  storyLevelMap,
  storyScoreExact,
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

/** 문자·숫자(+ 기술 표기에 쓰이는 + # .)만 남긴 비교용 문자열 */
export function normalizeText(s: string): string {
  return s.replace(/[^\p{L}\p{N}+#.]/gu, "").toLowerCase();
}

/** 근거로 인정하는 인용문의 최소 길이 (정규화 후) */
export const MIN_QUOTE_LEN = 6;

/**
 * 인용문이 이력 원문에 실제로 있는지 확인한다.
 * 공백·문장부호를 제외한 정규화 문자열이 원문에 그대로 포함될 때만 통과한다 (한 글자라도 다르면 실패).
 * 너무 짧은 인용("팀", "2024")은 근거로 세지 않는다.
 */
export function quoteFound(quote: string, resumeText: string): boolean {
  const q = normalizeText(quote);
  if (q.length < MIN_QUOTE_LEN) return false;
  return normalizeText(resumeText).includes(q);
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
    faceScore: Math.round(faceScoreExact(view.items, matches)),
    faceScoreExact: faceScoreExact(view.items, matches),
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
  const seenItems = new Set<string>();
  for (const a of stage.arguments) {
    if (!known.has(a.itemId) || seenItems.has(a.itemId)) continue; // 항목당 논증 하나만 (첫 번째)
    seenItems.add(a.itemId);
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
    storyScore: Math.round(storyScoreExact(view.items, basic.matches, args)),
    storyScoreExact: storyScoreExact(view.items, basic.matches, args),
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

  // 단기 대체 불가 요건의 보강은 갈래 ④로 강제한다 (갈음·보강으로 올릴 수 없는 항목)
  const raw = stage.gaps
    .filter((g) => itemById.has(g.itemId) && (levels.get(g.itemId) ?? "unmet") !== "met")
    .map((g) => (itemById.get(g.itemId)?.hardGate && g.category !== "hard" ? { ...g, category: "hard" as const } : g));

  // 항목별 '실행 가능한' gap 수 — 항목의 최대 상승분을 이들끼리 나눈다 (④는 나누기에 넣지 않는다)
  const doablePerItem = new Map<string, number>();
  for (const g of raw) if (g.category !== "hard") doablePerItem.set(g.itemId, (doablePerItem.get(g.itemId) ?? 0) + 1);

  const gaps: Gap[] = raw.map((g, i) => {
    const item = itemById.get(g.itemId)!;
    const level: MatchLevel = levels.get(g.itemId) ?? "unmet";
    const maxGain = total > 0 ? (effectiveWeight(item) / total) * (1 - LEVEL_VALUE[level]) * 100 : 0;
    const share = g.category === "hard" ? maxGain : maxGain / (doablePerItem.get(g.itemId) ?? 1);
    return {
      id: `g${i + 1}`,
      itemId: g.itemId,
      category: g.category,
      title: g.title,
      action: g.action,
      impact: Math.round(share),
      impactExact: share,
      effort: g.effort,
      questions: g.category === "hidden" ? (g.questions ?? undefined) : undefined,
      alternativePath: g.category === "hard" ? (g.alternativePath ?? undefined) : undefined,
    };
  });
  gaps.sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

  // 예상치는 반올림된 %p 가 아니라 반올림 전 상승분(점수 산식의 몫)을 더해 계산한다.
  // 한 항목의 실행 가능한 보강들은 그 항목의 최대 상승분을 나눠 가지므로 합이 항목 상한을 넘지 않는다.
  const gain = (cats: GapCategory[]) =>
    gaps.filter((g) => g.category !== "hard" && cats.includes(g.category)).reduce((x, g) => x + g.impactExact, 0);
  const minimalExact = Math.min(100, story.storyScoreExact + gain(["hidden", "weak"]));
  const recommendedExact = Math.min(100, story.storyScoreExact + gain(["hidden", "weak", "missing"]));
  return {
    gaps,
    projectedScore: Math.round(recommendedExact),
    projectedScoreExact: recommendedExact,
    projectedMinimal: Math.round(minimalExact),
    projectedMinimalExact: minimalExact,
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
  if (story.storyScoreExact >= PASS_LINE) return "apply";
  return "pending";
}

export function verdictFor(view: ManagerView, basic: BasicResume, story: StoryResume, target: TargetResume): Verdict {
  const levels = storyLevelMap(basic.matches, story.arguments);
  return decideVerdict(story.storyScoreExact, target.projectedScoreExact, view.items, (it) => levels.get(it.id) ?? "unmet");
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
