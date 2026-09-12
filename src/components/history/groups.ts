import { lineage } from "@/lib/storage";
import { PASS_LINE, type Analysis } from "@/lib/types";

/** 같은 공고의 회차(parentId 체인)를 카드 하나로 묶은 단위 */
export interface Group {
  /** 체인의 뿌리(최초 분석) id — 카드 key */
  key: string;
  /** 가장 최근 회차 — 카드가 보여주고 여는 대상 */
  latest: Analysis;
  /** 최근 회차까지의 회차 궤적, 오래된 순 */
  chain: Analysis[];
  /** 이 공고에 속한 모든 분석 (삭제 시 함께 지운다) */
  members: Analysis[];
}

export function timestamp(a: Analysis): number {
  const t = Date.parse(a.createdAt);
  return Number.isNaN(t) ? 0 : t;
}

export function storyOf(a: Analysis): number {
  return a.storyResume?.storyScore ?? 0;
}

export function faceOf(a: Analysis): number {
  return a.basicResume?.faceScore ?? 0;
}

export function passLineOf(a: Analysis): number {
  return a.passLine || PASS_LINE;
}

/** 합격선까지 남은 %p (넘었으면 0) */
export function gapOf(a: Analysis): number {
  return Math.max(0, passLineOf(a) - storyOf(a));
}

export function buildGroups(all: Analysis[]): Group[] {
  const byRoot = new Map<string, Analysis[]>();
  for (const a of all) {
    const root = lineage(a, all)[0].id;
    const members = byRoot.get(root);
    if (members) members.push(a);
    else byRoot.set(root, [a]);
  }
  const groups: Group[] = [];
  for (const [key, members] of byRoot) {
    const sorted = [...members].sort((x, y) => timestamp(x) - timestamp(y));
    const latest = sorted[sorted.length - 1];
    groups.push({ key, latest, chain: lineage(latest, all), members: sorted });
  }
  return groups;
}

export function titleOf(a: Analysis): string {
  const company = a.posting?.company?.trim() ?? "";
  const title = a.posting?.title?.trim() ?? "";
  if (company && title) return `${company} · ${title}`;
  return company || title || "제목 없는 공고";
}
