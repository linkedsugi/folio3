import type { Analysis } from "./types";

export const KEY_ANALYSES = "rolefit:analyses:v1";
export const KEY_CREDITS = "rolefit:credits:v1";
export const KEY_DRAFT = "rolefit:draft:v1";

/** 같은 탭 안에서의 변경을 구독자(useSyncExternalStore)에게 알린다 */
const listeners = new Set<() => void>();
export function subscribeStorage(cb: () => void): () => void {
  listeners.add(cb);
  if (typeof window !== "undefined") window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", cb);
  };
}
function notify() {
  for (const l of listeners) l();
}


function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** 저장 성공 여부를 돌려준다 (용량 초과·비공개 모드 등에서 false) */
function safeSet(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    notify();
    return true;
  } catch {
    return false;
  }
}

export const MAX_ANALYSES = 30;
/** 공고 1건에 포함된 재분석 횟수 */
export const REANALYSIS_INCLUDED = 3;

export function listAnalyses(): Analysis[] {
  const list = safeGet<Analysis[]>(KEY_ANALYSES, []);
  return Array.isArray(list) ? list : [];
}

export function getAnalysis(id: string): Analysis | null {
  return listAnalyses().find((a) => a.id === id) ?? null;
}

/** 새 분석은 맨 앞에, 기존 분석은 제자리에 저장한다. 실패(용량 초과)하면 false */
export function saveAnalysis(a: Analysis): boolean {
  const list = listAnalyses();
  const idx = list.findIndex((x) => x.id === a.id);
  if (idx >= 0) list[idx] = a;
  else list.unshift(a);
  return safeSet(KEY_ANALYSES, list.slice(0, MAX_ANALYSES));
}

export function deleteAnalysis(id: string) {
  safeSet(
    KEY_ANALYSES,
    listAnalyses().filter((x) => x.id !== id),
  );
}

export function updateProgress(id: string, gapId: string, done: boolean): Analysis | null {
  const a = getAnalysis(id);
  if (!a) return null;
  const next = { ...a, progress: { ...a.progress, [gapId]: done } };
  return saveAnalysis(next) ? next : null;
}

export const BETA_CREDITS = 3;

export interface CreditState {
  /** 첫 공고 전체 무료 사용 여부 */
  firstFreeUsed: boolean;
  /** 베타 크레딧 (결제 미연동 기간 동안 유료 결과물을 여는 데 사용) */
  beta: number;
  /** (예약) 결제 연동 전 자동 충전은 없다 — 호환을 위해 필드만 유지 */
  betaRefillAt: string | null;
  /** 결제로 구매한 크레딧 — 결제 연동 전에는 항상 0 */
  purchased: number;
}

const DEFAULT_CREDITS: CreditState = {
  firstFreeUsed: false,
  beta: BETA_CREDITS,
  betaRefillAt: null,
  purchased: 0,
};

export function getCredits(): CreditState {
  const stored = safeGet<Partial<CreditState>>(KEY_CREDITS, {});
  const c = { ...DEFAULT_CREDITS, ...stored };
  // 이전 버전(5개 지급)에서 온 값은 상한 3개로 맞춘다
  if (c.beta > BETA_CREDITS) c.beta = BETA_CREDITS;
  return c;
}

export type UnlockSource = "firstFree" | "beta" | "purchased";

/**
 * 첫 공고 무료 권리로만 연다 — 크레딧은 절대 쓰지 않는다 (분석 완료 직후 자동 적용용).
 * 첫 공고를 이미 썼으면 아무것도 하지 않고 false.
 */
export function claimFirstFree(id: string): boolean {
  const a = getAnalysis(id);
  const c = getCredits();
  if (!a || a.unlocked || c.firstFreeUsed) return false;
  if (!saveAnalysis({ ...a, unlocked: true, unlockedBy: "firstFree" })) return false;
  safeSet(KEY_CREDITS, { ...c, firstFreeUsed: true });
  return true;
}

/**
 * 잠긴 결과물을 연다. 첫 공고는 무료, 이후는 구매 크레딧 → 베타 크레딧 순으로 1개 소진.
 * 사용자가 GateCard 에서 명시적으로 눌렀을 때만 호출한다.
 * 분석 저장이 먼저 성공해야 크레딧을 차감한다. 실패 시 null.
 */
export function unlockAnalysis(id: string): { source: UnlockSource; credits: CreditState } | null {
  const a = getAnalysis(id);
  if (!a) return null;
  if (a.unlocked) return { source: a.unlockedBy === "beta" || a.unlockedBy === "purchased" ? a.unlockedBy : "firstFree", credits: getCredits() };
  const c = getCredits();
  let source: UnlockSource;
  if (!c.firstFreeUsed) {
    c.firstFreeUsed = true;
    source = "firstFree";
  } else if (c.purchased > 0) {
    c.purchased -= 1;
    source = "purchased";
  } else if (c.beta > 0) {
    c.beta -= 1;
    source = "beta";
  } else {
    return null;
  }
  if (!saveAnalysis({ ...a, unlocked: true, unlockedBy: source })) return null;
  safeSet(KEY_CREDITS, c);
  return { source, credits: c };
}

export interface Draft {
  company: string;
  title: string;
  jdText: string;
  resumeText: string;
}

export function getDraft(): Draft | null {
  return safeGet<Draft | null>(KEY_DRAFT, null);
}

export function saveDraft(d: Draft): boolean {
  return safeSet(KEY_DRAFT, d);
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY_DRAFT);
    notify();
  } catch {
    /* ignore */
  }
}

export function newId(): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}${rnd}`;
}

export function updateNote(id: string, gapId: string, text: string): Analysis | null {
  const a = getAnalysis(id);
  if (!a) return null;
  const next = { ...a, notes: { ...(a.notes ?? {}), [gapId]: text } };
  return saveAnalysis(next) ? next : null;
}

/** 같은 공고의 재분석 횟수 (원본 제외) */
export function reanalysisCount(a: Analysis, all: Analysis[]): number {
  return Math.max(0, lineage(a, all).length - 1);
}

/** 히스토리에서 같은 공고의 회차별 점수 궤적 */
export function lineage(a: Analysis, all: Analysis[]): Analysis[] {
  const chain: Analysis[] = [a];
  let cur = a;
  const seen = new Set([a.id]);
  while (cur.parentId) {
    const p = all.find((x) => x.id === cur.parentId);
    if (!p || seen.has(p.id)) break;
    seen.add(p.id);
    chain.unshift(p);
    cur = p;
  }
  return chain;
}
