"use client";

import { useCredits, useHydrated } from "@/lib/useStorage";

/**
 * 이 브라우저의 크레딧 상태. localStorage 는 하이드레이션이 끝난 뒤에만 읽는다 —
 * 서버·하이드레이션 렌더에서는 같은 높이의 자리표시자를 그려 SSR 불일치와 레이아웃 흔들림을 피한다.
 */
export function CreditStatus({ className = "" }: { className?: string }) {
  const hydrated = useHydrated();
  const credits = useCredits();

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-card px-3.5 py-2 text-sm ${className}`}
    >
      <span className="text-xs font-semibold text-muted">지금 내 상태</span>
      {!hydrated ? (
        <span className="text-faint">크레딧 상태를 확인하는 중</span>
      ) : !credits.firstFreeUsed ? (
        <>
          <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
            <i className="inline-block h-2 w-2 rounded-full bg-apply" aria-hidden />
            첫 공고 무료 사용 가능
          </span>
          <span className="text-xs text-muted">결과물 전부와 판정을 무료로 봅니다</span>
        </>
      ) : (
        <>
          <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
            <i className={`inline-block h-2 w-2 rounded-full ${credits.beta > 0 ? "bg-accent" : "bg-faint"}`} aria-hidden />
            베타 크레딧 <b className="num">{credits.beta}</b>개 남음
          </span>
          <span className="text-xs text-muted">{credits.beta > 0 ? "결제 없이 잠긴 결과물을 열 수 있습니다" : "결제가 열리기 전까지 자동 충전은 없습니다"}</span>
        </>
      )}
    </div>
  );
}
