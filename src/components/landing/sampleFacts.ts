import { buildSampleAnalysis } from "@/lib/sample";
import type { Analysis, FaceMatch, Gap, GapCategory, JdItem, StoryArgument } from "@/lib/types";

export interface ArgumentWithItem {
  arg: StoryArgument;
  item: JdItem;
}

export interface FaceRow {
  item: JdItem;
  match: FaceMatch;
}

/** 랜딩에서 보여 줄 샘플 분석의 핵심 숫자·항목. 모두 buildSampleAnalysis() 에서 파생한다. */
export interface SampleFacts {
  analysis: Analysis;
  /** "Intel Korea · Gaming Application Engineer" */
  postingLabel: string;
  face: number;
  story: number;
  passLine: number;
  /** 합격선까지 남은 %p (0 이면 이미 넘음) */
  gapToPass: number;
  /** 판정 근거가 지목한 두 건 — ① 첫 항목과 ② 첫 항목 */
  quickWins: Gap[];
  /** quickWins 만 채웠을 때 예상 충족률 */
  quickWinScore: number;
  /** 「경력 5년」처럼 부서장의 의도가 잘 드러나는 항목 */
  keyItem: JdItem;
  /** 실제 일 — 첫 문장만 */
  actualWorkLine: string;
  /** 결과물 2-1 미리보기에 쓸 항목 4개 */
  faceRows: FaceRow[];
  grounded: ArgumentWithItem;
  weak: ArgumentWithItem;
  hiddenGap: Gap | null;
  gapsByCategory: Record<GapCategory, Gap[]>;
  countedArgs: number;
  uncountedArgs: number;
}

const FACE_ROW_IDS = ["j1", "j2", "j4", "j5"];

/** "…다. …" 형태의 문단에서 첫 문장만 잘라낸다 */
export function firstSentence(text: string): string {
  const m = /^(.*?[다요]\.)\s/.exec(text);
  return m ? m[1] : text;
}

export function getSampleFacts(): SampleFacts {
  const analysis = buildSampleAnalysis();
  const { managerView, basicResume, storyResume, targetResume, passLine } = analysis;
  const items = managerView.items;
  const itemById = new Map(items.map((it) => [it.id, it]));
  const matchById = new Map(basicResume.matches.map((m) => [m.itemId, m]));

  const face = basicResume.faceScore;
  const story = storyResume.storyScore;

  const gapsByCategory: Record<GapCategory, Gap[]> = { hidden: [], weak: [], missing: [], hard: [] };
  for (const g of targetResume.gaps) gapsByCategory[g.category].push(g);

  const hiddenGap = gapsByCategory.hidden[0] ?? null;
  const quickWins = [gapsByCategory.hidden[0], gapsByCategory.weak[0]].filter((g): g is Gap => Boolean(g));
  const quickWinScore = Math.min(100, story + quickWins.reduce((s, g) => s + g.impact, 0));

  const faceRows: FaceRow[] = [];
  for (const id of FACE_ROW_IDS) {
    const item = itemById.get(id);
    const match = matchById.get(id);
    if (item && match) faceRows.push({ item, match });
  }

  const withItem = (arg: StoryArgument | undefined): ArgumentWithItem | null => {
    if (!arg) return null;
    const item = itemById.get(arg.itemId);
    return item ? { arg, item } : null;
  };
  const args = storyResume.arguments;
  const grounded =
    withItem(args.find((a) => a.counted && a.evidenceStatus === "grounded" && a.evidence.length > 0)) ??
    withItem(args[0]);
  const weak =
    withItem(args.find((a) => !a.counted && a.itemId === "j5")) ??
    withItem(args.find((a) => !a.counted)) ??
    withItem(args[args.length - 1]);
  if (!grounded || !weak) throw new Error("샘플 분석에 갈음 논증이 없습니다");

  const countedArgs = args.filter((a) => a.counted).length;

  return {
    analysis,
    postingLabel: `${analysis.posting.company} · ${analysis.posting.title}`,
    face,
    story,
    passLine,
    gapToPass: Math.max(0, passLine - story),
    quickWins,
    quickWinScore,
    keyItem: itemById.get("j1") ?? items[0],
    actualWorkLine: firstSentence(managerView.actualWork),
    faceRows,
    grounded,
    weak,
    hiddenGap,
    gapsByCategory,
    countedArgs,
    uncountedArgs: args.length - countedArgs,
  };
}
