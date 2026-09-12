import { useMemo, useSyncExternalStore } from "react";
import { KEY_ANALYSES, KEY_CREDITS, getCredits, listAnalyses, subscribeStorage, type CreditState } from "./storage";
import type { Analysis } from "./types";

/** 하이드레이션이 끝났는지 (서버 스냅샷 false → 클라이언트 true) */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeStorage,
    () => true,
    () => false,
  );
}

/** localStorage 원문 문자열을 외부 스토어로 구독한다 (문자열이라 참조 안정성 문제 없음) */
export function useStorageRaw(key: string): string | null {
  return useSyncExternalStore(
    subscribeStorage,
    () => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
}

export function useAnalyses(): Analysis[] {
  const raw = useStorageRaw(KEY_ANALYSES);
  // raw 가 바뀔 때만 다시 파싱한다
  return useMemo(() => (raw === null ? [] : listAnalyses()), [raw]);
}

export function useCredits(): CreditState {
  const raw = useStorageRaw(KEY_CREDITS);
  return useMemo(() => {
    void raw;
    return getCredits();
  }, [raw]);
}
