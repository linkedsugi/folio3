import {
  PASS_LINE,
  type FaceMatch,
  type JdItem,
  type MatchLevel,
  type StoryArgument,
  type Verdict,
} from "./types";

export const LEVEL_VALUE: Record<MatchLevel, number> = {
  met: 1,
  partial: 0.5,
  unmet: 0,
};

export const LEVEL_LABEL: Record<MatchLevel, string> = {
  met: "충족",
  partial: "부분 충족",
  unmet: "미충족",
};

export const PRIORITY_LABEL = { required: "필수", preferred: "우대" } as const;

export const VERDICT_LABEL: Record<Verdict, string> = {
  apply: "지원",
  hold: "보류",
  not_recommended: "비추천",
};

export const VERDICT_SUB: Record<Verdict, string> = {
  apply: "지금 이 스토리보완 이력서로 지원할 근거가 있습니다",
  hold: "목표 이력서를 채우면 지원 가능한 포지션이 됩니다",
  not_recommended: "이 공고는 지금 지원하지 않는 것이 판단입니다",
};

/** 항목 가중치 — 필수 항목은 무게를 1.5배로 본다 */
export function effectiveWeight(item: JdItem): number {
  const w = Math.min(5, Math.max(1, Math.round(item.weight || 3)));
  return item.priority === "required" ? w * 1.5 : w;
}

/** 가중 평균 충족률 (0–100, 정수) */
export function weightedScore(items: JdItem[], levelOf: (item: JdItem) => MatchLevel): number {
  let total = 0;
  let got = 0;
  for (const item of items) {
    const w = effectiveWeight(item);
    total += w;
    got += w * LEVEL_VALUE[levelOf(item)];
  }
  if (total === 0) return 0;
  return Math.round((got / total) * 100);
}

export function faceScore(items: JdItem[], matches: FaceMatch[]): number {
  const map = new Map(matches.map((m) => [m.itemId, m.level]));
  return weightedScore(items, (it) => map.get(it.id) ?? "unmet");
}

/**
 * 냉정함의 규칙: 근거가 grounded 인 논증만 액면 수준을 올릴 수 있다.
 * weak/none 은 점수에 반영하지 않고 액면 수준으로 되돌린다.
 */
export function normalizeArgument(arg: StoryArgument, face: MatchLevel): StoryArgument {
  const grounded = arg.evidenceStatus === "grounded" && arg.evidence.length > 0;
  const raised = LEVEL_VALUE[arg.level] > LEVEL_VALUE[face];
  if (!grounded && raised) {
    return { ...arg, level: face, counted: false };
  }
  // 논증이 액면보다 낮게 평가했다면 액면 수준을 유지한다
  const level = LEVEL_VALUE[arg.level] < LEVEL_VALUE[face] ? face : arg.level;
  return { ...arg, level, counted: grounded && LEVEL_VALUE[level] > LEVEL_VALUE[face] };
}

export function storyScore(items: JdItem[], matches: FaceMatch[], args: StoryArgument[]): number {
  const face = new Map(matches.map((m) => [m.itemId, m.level]));
  const story = new Map(args.map((a) => [a.itemId, a]));
  return weightedScore(items, (it) => {
    const f = face.get(it.id) ?? "unmet";
    const a = story.get(it.id);
    if (!a) return f;
    return normalizeArgument(a, f).level;
  });
}

/**
 * 판정 규칙 (스토리보완 충족률 기준)
 *  - 단기 대체 불가 필수 요건(hardGate)이 미충족이면 점수와 무관하게 비추천
 *  - 스토리보완 ≥ 80  지원
 *  - 권장 경로(①②③ 보강)로 예상 80% 도달 가능  보류 (목표 이력서 완성 후 지원)
 *  - 그래도 미달  비추천
 */
export function decideVerdict(
  score: number,
  projected: number,
  items: JdItem[],
  levelOf: (item: JdItem) => MatchLevel,
): Verdict {
  const hardUnmet = items.some(
    (it) => it.hardGate && it.priority === "required" && levelOf(it) === "unmet",
  );
  if (hardUnmet) return "not_recommended";
  if (score >= PASS_LINE) return "apply";
  if (projected >= PASS_LINE) return "hold";
  return "not_recommended";
}

export function storyLevelMap(matches: FaceMatch[], args: StoryArgument[]): Map<string, MatchLevel> {
  const face = new Map(matches.map((m) => [m.itemId, m.level]));
  const out = new Map<string, MatchLevel>();
  for (const [id, f] of face) {
    const a = args.find((x) => x.itemId === id);
    out.set(id, a ? normalizeArgument(a, f).level : f);
  }
  return out;
}

/** 보강 완료 시 예상 충족률: 현재 스토리 점수 + 완료된 gap 의 impact 합 (상한 100) */
export function projectedScore(base: number, impacts: number[]): number {
  return Math.min(100, Math.round(base + impacts.reduce((a, b) => a + b, 0)));
}

export const GAP_CATEGORY_META = {
  hidden: {
    num: "①",
    title: "있는데 드러나지 않은 경험",
    action: "질문·사실 확인으로 발굴",
    hint: "이미 갖고 있을 가능성이 큽니다. 아래 질문에 답해 보세요.",
  },
  weak: {
    num: "②",
    title: "관련은 있지만 근거가 약한 경험",
    action: "자료 보완·구체화",
    hint: "숫자·산출물·역할을 붙이면 근거가 됩니다.",
  },
  missing: {
    num: "③",
    title: "실제로 부족한 역량·경험",
    action: "학습·프로젝트·현장 경험 설계",
    hint: "짧은 프로젝트 하나가 항목 하나를 바꿉니다.",
  },
  hard: {
    num: "④",
    title: "단기간에 대체하기 어려운 요건",
    action: "미충족 표시 + 대안 경로",
    hint: "숨기지 말고 표시합니다. 대안 경로가 있습니다.",
  },
} as const;

export const EFFORT_LABEL = { days: "며칠", weeks: "몇 주", months: "몇 달" } as const;
